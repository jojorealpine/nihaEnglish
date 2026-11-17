"""Ground concise Korean grammar notes in English morphology/dependencies.

These are selected grammar points, not a claim to analyze every clause. Curated
notes remain untouched. Quotes always come from the original sentence.
"""
import re
import json
from pathlib import Path

MODALS = {'can', 'could', 'may', 'might', 'must', 'will', 'would', 'shall', 'should'}
OVERRIDES = {
 'Whatever is - love it.': ('imperative-relative', '「Whatever is」는 존재하는 것이 무엇이든이라는 명사절이고, 「love it」은 주어 you가 생략된 명령문입니다. it은 앞의 대상을 다시 가리킵니다.'),
 'This just watching dissolves thought by itself.': ('gerund-subject', '「This just watching」이 주어 역할을 하며 watching은 지켜보는 행동을 명사처럼 가리킵니다. 「dissolves」는 dissolve의 3인칭 단수 현재형입니다.'),
 'Thirst!': ('nominal-exclamation', '「Thirst」는 갈증을 뜻하는 명사입니다. 명사 하나와 느낌표로 간절함을 강조한 표현이며, 완전한 서술문 형태는 아닙니다.'),
 'Live!': ('imperative', '「Live」는 live의 동사원형으로 쓰인 명령문입니다. 주어 you를 생략하고 살아가라고 권합니다.'),
 'Long for that.': ('imperative', '「Long for」는 간절히 바라다라는 뜻의 동사구입니다. 동사원형 long으로 시작하고 주어 you를 생략한 명령문입니다.'),
 'The dross burns leaving pure gold.': ('participle-result', '「burns」는 burn의 3인칭 단수 현재형입니다. 「leaving pure gold」는 주절에 이어지는 분사구로, 타고 난 결과 순금이 남는다는 뜻을 더합니다.'),
 'In meditation, enjoy doing nothing.': ('gerund-object', '「enjoy」는 주어 you가 생략된 명령문 동사입니다. enjoy는 행동을 목적어로 받을 때 「doing」처럼 동명사 -ing형을 사용합니다.'),
 'This very understanding flowers into a silence which is not just absence of noise but a positive bliss.': ('relative', '「flowers」는 여기서 명사가 아니라 꽃피다라는 동사의 3인칭 단수 현재형입니다. 「which」가 이끄는 관계절은 앞의 silence를 설명합니다.'),
 'Only a few enter and still fewer progressively follow it.': ('parallel', '「a few」와 「fewer」는 각각 소수의 사람들과 그보다 더 적은 사람들을 가리키며 주어 역할을 합니다. 「enter」와 「follow」는 and로 연결된 두 절의 현재형 동사입니다.'),
 'Do it relaxedly.': ('imperative', '「Do」는 주어 you를 생략한 명령문의 동사원형입니다. 「relaxedly」는 그 행동을 어떤 방식으로 할지 설명하는 부사입니다.'),
 'Or can you?': ('ellipsis', '「can + you」는 조동사와 주어가 도치된 의문문 어순입니다. can 뒤의 본동사와 그 내용은 앞 문맥에서 반복하지 않고 생략했습니다.'),
 'But you need not do either.': ('need-modal', '「need not do」에서 need는 조동사처럼 쓰여 동사원형 do를 받습니다. need not은 그 행동을 할 필요가 없다는 뜻이며, must not의 금지와 구별합니다.'),
 'That which is.': ('relative-fragment', '지시대명사 「That」을 관계절 「which is」가 설명합니다. 여기서 is는 존재한다는 뜻으로 읽으며, 전체는 존재하는 것을 가리키는 명사구입니다.'),
}

corrections_path = Path(__file__).resolve().parents[1] / 'data/letter_study/grammar-corrections.json'
if corrections_path.exists():
    for row in json.loads(corrections_path.read_text()):
        OVERRIDES[row['english']] = ('reviewed-grammar', row['grammar'])


STATE_PARTICIPLES = {'please', 'surprise', 'tire', 'relax', 'excite', 'interest', 'satisfy', 'concern', 'worry', 'confuse', 'frighten', 'disappoint', 'exhaust'}


def quote_span(doc, indices):
    return doc[min(indices):max(indices) + 1].text


def explain_grammar(doc):
    text = doc.text
    if text in OVERRIDES:
        return OVERRIDES[text]
    words = [t for t in doc if t.is_alpha]
    lower = text.lower().replace('’', "'")
    if not words:
        raise ValueError('No English words')
    initial_no = re.match(r"^\s*(?:please\s+)?(do not|don't|never)\s+([a-z]+)", lower)
    if initial_no:
        verb_word = initial_no.group(2)
        if any(t.lower_ == verb_word and t.tag_ == 'VB' for t in doc):
            phrase = text[initial_no.start():initial_no.end()].strip()
            return 'negative-imperative', f'「{phrase}」는' + ' 동사원형을 이용한 부정 명령 표현입니다. 주어 you를 따로 쓰지 않고 그 행동을 하지 말라고 말합니다.'
    # Lexical constructions that would otherwise resemble a different tense.
    match = re.search(r"\b(?:am|is|are|was|were|be|been)\s+bound\s+to\s+[a-z]+", lower)
    if match:
        phrase = text[match.start():match.end()]
        return 'bound-to', f'「{phrase}」는 be bound to + 동사원형의 구조로, 어떤 일이 반드시 일어나리라는 강한 확신을 나타냅니다.'
    match = re.search(r'\b(?:have|has|had) to\s+[a-z]+', lower)
    if match:
        phrase = text[match.start():match.end()]
        return 'have-to', f'「{phrase}」는 have to + 동사원형의 구조로, 그 행동을 해야 한다는 필요나 의무를 나타냅니다.'
    if lower.strip(' .!?,;:\n') in {'yes', 'no', 'oh', 'ah', 'okay', 'ok'}:
        return 'response', f'「{words[0].text}」는 독립적으로 쓰인 짧은 응답·감탄 표현입니다. 주어와 동사를 갖춘 서술문 대신 문맥 속에서 대답이나 반응을 전합니다.'
    if re.match(r'^\s*what\s+an?\s+', lower):
        return 'exclamation', '문두의 「What a/an ...」은 명사구로 감탄을 나타내는 형태입니다. 평서문처럼 주어와 동사를 모두 쓰지 않고도 놀라움이나 감정을 전합니다.'

    roots = [t for t in doc if t.dep_ == 'ROOT' and t.pos_ in {'VERB', 'AUX'}]
    verbs = roots + [t for t in doc if t.pos_ == 'VERB' and t not in roots] + [t for t in doc if t.pos_ == 'AUX' and t not in roots]
    # Main-clause constructions first, then unambiguous embedded verb phrases.
    for verb in verbs:
        children = list(verb.children)
        aux = [t for t in children if t.dep_ in {'aux', 'auxpass'}]
        neg = [t for t in children if t.dep_ == 'neg']
        subjects = [t for t in children if t.dep_ in {'nsubj', 'nsubjpass', 'csubj', 'expl'}]
        modal = next((t for t in aux if t.lemma_.lower() in MODALS), None)
        have = next((t for t in aux if t.lemma_ == 'have'), None)
        be = [t for t in aux if t.lemma_ == 'be']
        do = next((t for t in aux if t.lemma_ == 'do'), None)
        indices = [verb.i] + [t.i for t in aux + neg + [c for c in children if c.dep_ == 'prt']]
        phrase = quote_span(doc, indices)
        # Imperatives have a bare main verb and no stated subject.
        if verb in roots and verb.tag_ == 'VB' and not subjects and not modal and not have and not any(t.tag_ == 'TO' for t in aux):
            if verb.lemma_ == 'let':
                return 'let', f'「{verb.text}」로 시작하는 명령·권유 표현입니다. let 뒤에는 대상과 동사원형을 이어서, 그 행동을 하게 두거나 함께 하자는 뜻을 나타낼 수 있습니다.'
            if do and neg:
                return 'negative-imperative', f'「{phrase}」는 do not + 동사원형으로 만든 부정 명령문입니다. 행동의 주체인 you를 따로 쓰지 않고, 그 행동을 하지 말라고 말합니다.'
            return 'imperative', f'동사원형 「{verb.text}」가 쓰인 부분은 명령문으로 읽습니다. 주어 you를 따로 쓰지 않고 행동을 권하거나 요청하는 형태입니다.'
        if modal and have and verb.tag_ == 'VBN':
            return 'modal-perfect', f'「{phrase}」는 조동사 + have + 과거분사의 구조입니다. 조동사의 뜻에 따라 기준 시점에 앞선 일에 대한 추측·가능성·가정 등을 나타냅니다.'
        if have and be and verb.tag_ == 'VBG':
            if modal:
                return 'modal-perfect-progressive', f'「{phrase}」는 조동사 + have + been + -ing의 구조입니다. 완료형과 진행형을 조동사에 결합해 기준 시점까지 이어진 행동을 나타냅니다.'
            past = have.lower_ in {'had', "'d"}
            tense = '과거완료진행형' if past else '현재완료진행형'
            pattern = 'had + been + -ing' if past else 'have/has + been + -ing'
            return 'perfect-progressive', f'「{phrase}」는 {tense}인 {pattern} 구조입니다. 기준 시점까지 이어져 온 행동의 지속을 나타냅니다.'
        if have and verb.tag_ == 'VBN':
            past = have.lower_ in {'had', "'d"}
            tense = '과거완료' if past else '현재완료'
            pattern = 'had + 과거분사' if past else 'have/has + 과거분사'
            detail = '과거의 기준 시점보다 앞선 일' if past else '과거의 일이 현재와 연결되는 완료·경험·결과·지속'
            extra = ' be + 과거분사도 이어져 수동의 뜻을 더합니다.' if be else ''
            return 'perfect', f'「{phrase}」는 {pattern}로 만든 {tense} 표현입니다. {detail}을 나타냅니다.{extra}'
        if be and verb.tag_ == 'VBN':
            if verb.lemma_ in STATE_PARTICIPLES:
                return 'participle-state', f'「{phrase}」는 be동사 뒤에 과거분사형 「{verb.text}」가 이어진 형태입니다. 이 분사형은 감정이나 상태를 나타내는 데에도 쓰입니다.'
            pattern = '조동사 + be + 과거분사' if modal else 'be동사 + 과거분사'
            return 'passive', f'「{phrase}」는 {pattern}로 된 수동 표현입니다. 주어가 그 행동을 하는 쪽이 아니라 그 행동의 대상이 됨을 나타냅니다.'
        if be and verb.tag_ == 'VBG':
            b = be[0].lower_
            tense = '과거진행형' if b in {'was', 'were'} else '현재진행형' if b in {'am', 'is', 'are', "'m", "'s", "'re"} else '진행형'
            return 'progressive', f'「{phrase}」는 be동사 + -ing로 만든 {tense} 표현입니다. 기준이 되는 시점에 행동이나 변화가 진행 중임을 나타냅니다.'
        if modal:
            label = modal.lemma_.lower()
            meanings = {'will':'미래의 일이나 의지', 'would':'가정·의지·정중함', 'can':'가능·능력', 'could':'과거의 능력·가능성·정중함', 'may':'가능성·허락', 'might':'가능성', 'must':'의무·강한 추측', 'should':'조언·의무·예상', 'shall':'미래·의지·제안'}
            if label == 'may' and modal.i == words[0].i and '?' not in text:
                return 'wish', f'문두의 「{modal.text}」 뒤에 주어와 동사원형을 이어 기원이나 바람을 나타내는 형태로 읽습니다. 일반적인 평서문과 달리 조동사가 주어 앞에 옵니다.'
            return 'modal', f'「{phrase}」에서 조동사 {modal.text} 뒤에 동사원형 「{verb.text}」가 옵니다. {label}은 문맥에 따라 {meanings[label]} 등을 나타냅니다.'
        if do:
            tense = '과거' if do.lower_ == 'did' else '현재'
            if neg:
                return 'do-negative', f'「{phrase}」는 {tense}의 부정 표현입니다. do/does/did 뒤에서는 본동사 「{verb.text}」를 원형으로 씁니다.'
            return 'do-support', f'조동사 「{do.text}」가 본동사 「{verb.text}」와 함께 쓰였습니다. 의문문을 만들거나 동작을 강조할 때 do/does/did 뒤의 본동사는 원형을 유지합니다.'
        if verb.lemma_ == 'be' and verb.tag_ in {'VBD', 'VBP', 'VBZ'}:
            tense = '과거형' if verb.tag_ == 'VBD' else '현재형'
            if any(t.dep_ == 'expl' and t.lower_ == 'there' for t in children):
                there = next(t for t in children if t.dep_ == 'expl' and t.lower_ == 'there')
                existence = quote_span(doc, [there.i, verb.i])
                return 'existential', f'「{existence}」는 어떤 것의 존재를 나타내는 구문입니다. 여기서 {verb.text}는 be동사의 {tense}입니다.'
            return 'be', f'「{verb.text}」는 be동사의 {tense}입니다. 문맥에 따라 주어의 상태·성질·위치 또는 존재를 나타내는 동사입니다.'
        if verb.tag_ in {'VBD', 'VBP', 'VBZ'}:
            if verb.tag_ == 'VBD':
                return 'past', f'동사 「{verb.text}」는 {verb.lemma_}의 과거형입니다. 이 절은 과거에 일어난 일이나 당시의 상태를 말합니다.'
            if verb.tag_ == 'VBZ':
                return 'present', f'동사 「{verb.text}」는 {verb.lemma_}의 3인칭 단수 현재형입니다. 현재의 상태나 반복되는 일, 일반적인 사실을 나타낼 때 쓰는 형태입니다.'
            return 'present', f'동사 「{verb.text}」는 현재형입니다. 현재의 상태나 반복되는 일, 일반적인 사실을 나타낼 때 쓰며, 이 형태에는 3인칭 단수의 -s가 붙지 않습니다.'

    # Explicit infinitives are safe to discuss even in a larger fragment.
    for t in doc:
        if t.tag_ == 'TO' and t.i + 1 < len(doc) and doc[t.i + 1].tag_ == 'VB':
            phrase = doc[t.i:t.i + 2].text
            return 'infinitive', f'「{phrase}」는 to + 동사원형으로 된 to부정사입니다. 문맥에 따라 행동의 내용·목적·설명 등을 나타내는 데 쓰입니다.'
    ing = next((t for t in doc if t.tag_ == 'VBG'), None)
    if ing:
        if ing.dep_ in {'pobj', 'pcomp', 'nsubj', 'dobj'}:
            return 'gerund', f'「{ing.text}」는 {ing.lemma_}의 -ing형으로, 여기서는 행동을 명사처럼 가리킵니다. -ing형만 있다고 현재진행형인 것은 아니며, 문장 속 역할을 함께 살펴야 합니다.'
        return 'ing-fragment', f'「{ing.text}」는 {ing.lemma_}의 -ing형입니다. -ing형은 문장 속에서 행동을 명사처럼 가리키거나 다른 말과 이어 상황을 설명할 수 있으므로, 이 형태만으로 현재진행형이라고 판단하지 않습니다.'
    noun = next((t for t in doc if t.pos_ in {'NOUN', 'PROPN'}), None)
    if noun:
        return 'nominal-fragment', f'명사 「{noun.text}」를 중심으로 한 짧은 표현입니다. 완전한 서술문에 필요한 정형동사 없이, 문맥에 기대어 인사·강조·보충 내용을 전합니다.'
    adjective = next((t for t in doc if t.pos_ == 'ADJ'), None)
    if adjective:
        return 'adjective-fragment', f'형용사 「{adjective.text}」를 중심으로 상태나 느낌을 전하는 짧은 표현입니다. 주어와 be동사를 모두 쓴 평서문 대신 문맥 속에서 뜻을 읽습니다.'
    return 'short-expression', f'「{text.strip()}」는 문맥과 함께 읽는 짧은 표현입니다. 독립된 완전한 서술문과 달리 주어·동사 관계를 모두 갖추어 쓰지 않았습니다.'


def vocabulary_targets(doc):
    candidates = [t for t in doc if t.is_alpha and not t.is_stop and t.pos_ in {'NOUN', 'VERB', 'ADJ', 'ADV'} and t.lemma_ not in {'be', 'have', 'do'}]
    if not candidates:
        candidates = [t for t in doc if t.is_alpha and t.lower_ not in {'i', 'the', 'a', 'an'}]
    if not candidates:
        candidates = [t for t in doc if t.is_alpha]
    found = {}
    for token in sorted(candidates, key=lambda t: (-len(t.text), t.i)):
        found.setdefault(token.lemma_.lower(), token)
    chosen = list(found.values())[:3 if len(doc.text) > 120 else 2]
    return [t.text for t in sorted(chosen, key=lambda t: t.i)]
