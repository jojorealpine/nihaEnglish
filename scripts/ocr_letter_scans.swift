import Foundation
import Vision
import CoreImage
import ImageIO

// Local OCR only. Preserve line positions so page numbers and letter headings
// can be separated from the letter body during import.
let arguments = Array(CommandLine.arguments.dropFirst())
guard arguments.count >= 2 else {
    fatalError("Usage: ocr_letter_scans INPUT_DIRECTORY OUTPUT_JSONL [FIRST_IMAGE LAST_IMAGE]")
}
let input = URL(fileURLWithPath: arguments[0])
let output = URL(fileURLWithPath: arguments[1])
let lower = arguments.count > 2 ? Int(arguments[2])! : 0
let upper = arguments.count > 3 ? Int(arguments[3])! : Int.max
let context = CIContext(options: [.useSoftwareRenderer: false])
let files = try FileManager.default.contentsOfDirectory(at: input, includingPropertiesForKeys: nil)
    .filter { $0.pathExtension.lowercased() == "jpg" }.sorted { $0.lastPathComponent < $1.lastPathComponent }
FileManager.default.createFile(atPath: output.path, contents: nil)
let handle = try FileHandle(forWritingTo: output)
defer { try? handle.close() }
for (index, file) in files.enumerated() {
    let number = Int(file.lastPathComponent.components(separatedBy: CharacterSet.decimalDigits.inverted).filter { !$0.isEmpty }[0])!
    if number < lower || number > upper { continue }
    try autoreleasepool {
        guard let source = CGImageSourceCreateWithURL(file as CFURL, nil),
              let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
            throw NSError(domain: "OCR", code: 1, userInfo: [NSLocalizedDescriptionKey: "Cannot read \(file.path)"])
        }
        let spread = number >= 782
        let oriented = spread ? CIImage(cgImage: image).oriented(.left) : CIImage(cgImage: image)
        guard let upright = context.createCGImage(oriented, from: oriented.extent) else { fatalError("Cannot orient image") }
        let count = spread ? 2 : 1
        for side in 0..<count {
            let left = side * upright.width / count
            let right = (side + 1) * upright.width / count
            guard let cropped = upright.cropping(to: CGRect(x: left, y: 0, width: right - left, height: upright.height)) else { fatalError("Cannot crop page") }
            let enlarged = CIImage(cgImage: cropped).transformed(by: CGAffineTransform(scaleX: 2, y: 2))
            guard let page = context.createCGImage(enlarged, from: enlarged.extent) else { fatalError("Cannot enlarge page") }
            let request = VNRecognizeTextRequest()
            request.recognitionLevel = .accurate
            request.recognitionLanguages = ["en-US"]
            request.usesLanguageCorrection = true
            request.minimumTextHeight = 0.004
            request.customWords = ["sadhana", "samadhi", "Bhagwan", "Mahavir", "Rajnagar", "Jabalpur", "Acharya", "Tulsi", "satchitananda"]
            try VNImageRequestHandler(cgImage: page).perform([request])
            var lines: [[String: Any]] = (request.results ?? []).compactMap { result in
                guard let text = result.topCandidates(1).first else { return nil }
                let box = result.boundingBox
                return ["text": text.string, "confidence": text.confidence,
                        "x": box.minX, "y": box.minY, "width": box.width, "height": box.height,
                        "alternatives": result.topCandidates(3).map { $0.string }]
            }
            // Isolated large number headings are sometimes missed by full-page OCR.
            // A second pass on the left margin recovers only numeric observations.
            if let margin = page.cropping(to: CGRect(x: 0, y: 0, width: page.width * 2 / 5, height: page.height)) {
                let numbers = VNRecognizeTextRequest()
                numbers.recognitionLevel = .accurate
                numbers.recognitionLanguages = ["en-US"]
                numbers.usesLanguageCorrection = false
                numbers.minimumTextHeight = 0.004
                try VNImageRequestHandler(cgImage: margin).perform([numbers])
                for result in numbers.results ?? [] {
                    guard let candidate = result.topCandidates(1).first,
                          candidate.string.range(of: "^[0-9]{1,4}[.,]?$", options: .regularExpression) != nil else { continue }
                    let box = result.boundingBox
                    if !lines.contains(where: { abs(($0["y"] as! CGFloat) - box.minY) < 0.01 && ($0["text"] as! String).range(of: "^[0-9]{1,4}[.,]?$", options: .regularExpression) != nil }) {
                        lines.append(["text": candidate.string, "confidence": candidate.confidence,
                                      "x": box.minX * 0.4, "y": box.minY, "width": box.width * 0.4,
                                      "height": box.height, "recoveredHeading": true])
                    }
                }
            }
            lines.sort { ($0["y"] as! CGFloat) + ($0["height"] as! CGFloat) > ($1["y"] as! CGFloat) + ($1["height"] as! CGFloat) }
            let record: [String: Any] = ["file": file.lastPathComponent, "side": count == 1 ? "single" : (side == 0 ? "left" : "right"),
                                        "width": page.width, "height": page.height, "lines": lines]
            let data = try JSONSerialization.data(withJSONObject: record, options: [.sortedKeys])
            try handle.write(contentsOf: data)
            try handle.write(contentsOf: Data([10]))
        }
    }
    if (index + 1) % 10 == 0 { print("OCR: \(index + 1)/\(files.count) images") }
}
