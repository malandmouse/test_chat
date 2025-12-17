import { useState, useEffect } from 'react'
import DatabasePanel from './components/DatabasePanel'
import ServerPanel from './components/ServerPanel'
import AppPreviewPanel from './components/AppPreviewPanel'
import { ScenarioValidator, type ValidationResult } from './utils/scenarioValidator'
import './App.css'

export interface ChildProfile {
  name: string
  age: number
  difficulty: number
  targetEmotion: string
  theme: string
}

export interface ApiSettings {
  apiKey: string
  model: string
  temperature: number
  topP: number
  maxTokens: number
}

export interface ScenarioResponse {
  metadata: {
    title: string
    difficulty: number
    category: string
  }
  scenario_script: string
  feedback_prompt: string
}

function App() {
  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    apiKey: '',
    model: 'gpt-4o',
    temperature: 0.7,
    topP: 1.0,
    maxTokens: 500
  })

  const [childProfile, setChildProfile] = useState<ChildProfile>({
    name: '민수',
    age: 8,
    difficulty: 3,
    targetEmotion: '기쁨',
    theme: '공룡'
  })

  const [promptVersion, setPromptVersion] = useState<'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7'>('v7')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPrompt, setGeneratedPrompt] = useState('')

  // v1 프롬프트 템플릿 (테마 없음)
  const promptTemplateV1 = `Role: Childhood specialist

Task: Create a situational scenario in JSON format that meets the following conditions.

[입력 변수]
- 아동 이름: {name}
- 나이: {age}세
- 난이도: {difficulty}/5
- 목표 감정: {emotion}

시나리오에서 아동의 이름({name})을 자연스럽게 사용해주세요.

[출력 형식: JSON만 반환]
{
  "metadata": {
    "title": "10자 이내의 시나리오 제목",
    "difficulty": 난이도 숫자,
    "category": "학교/집/놀이터 중 하나"
  },
  "scenario_script": "4~5문장으로 구성된 상황 묘사. 아동 이름을 포함하고, 아동이 표정을 지어야 하는 결정적 순간에서 종료되어야 합니다.",
  "feedback_prompt": "아동이 반응하지 않을 때 줄 수 있는 힌트 1문장"
}

중요: 반드시 JSON 형식으로만 답변하세요. 다른 설명은 포함하지 마세요.`

  // v2 프롬프트 템플릿 (테마 반영)
  const promptTemplateV2 = `Role: Childhood specialist and fairy tale writer

Task: create an 'Emotional Learning Scenario' in JSON format, reflecting the child's information and preference

[Input Variable from DB]
- Name: {name}
- Age: {age}세
- Difficulty: {difficulty}/5
- Target Emotion: {emotion}
- Preferred Theme: {theme}

[Design Guidelines]
1. Safety: 폭력적이거나 지나치게 부정적인 묘사는 피하고, 교육적인 어조를 유지해야 한다.
2. Personalization: 아동이 좋아하는 {theme} 요소를 이야기에 자연스럽게 녹여내야 한다.
3. Difficulty level {difficulty}: 단순한 원인과 결과가 드러나는 사회적 상황을 묘사해야 한다.

[Few-Shot Example]
Input: Name=민수, Age=6, Diff=1, Emotion=기쁨, Theme=자동차
Output: {"scenario_script": "민수가 좋아하는 빨간 자동차 장난감을 선물 받았어요! 너무 신이 나서 소리를 질렀어요.", ...}

[Output Format: JSON Only]
{
  "metadata": {
    "title": "10자 이내의 시나리오 제목",
    "difficulty": 난이도 숫자,
    "category": "학교/집/놀이터 중 하나"
  },
  "scenario_script": "4~5문장으로 구성된 상황 묘사. 아동이 표정을 지어야 하는 결정적 순간에서 종료되어야 합니다.",
  "feedback_prompt": "아동이 반응하지 않을 때 줄 수 있는 힌트 1문장"
}

중요: 반드시 JSON 형식으로만 답변하세요. 다른 설명은 포함하지 마세요.`

  // v3 프롬프트 템플릿 (상세 가이드라인 포함)
  const promptTemplateV3 = `Role: Childhood specialist and fairy tale writer

Task: create an 'Emotional Learning Scenario' in JSON format, reflecting the child's information and preference

[Input Variable from DB]
- Name: {name}
- Age: {age}세
- Difficulty: {difficulty}/5
- Target Emotion: {emotion}
- Preferred Theme: {theme}

[Design Guidelines]
1. Safety: 폭력적이거나 지나치게 부정적인 묘사는 피하고, 교육적인 어조를 유지해야 한다.
2. Personalization: 아동이 좋아하는 {theme} 요소를 이야기에 자연스럽게 녹여내야 한다.
3. Difficulty level {difficulty}: 단순한 원인과 결과가 드러나는 사회적 상황을 묘사해야 한다.

[Emotion Guide for 'Joy']
- level 1-2: Sensory pleasure (Eating treats, playing toys)
- level 3-5: Social Joy & Achievement
DO: Sharing, helping, succeeding after effort, feeling happy for others (Vicarious Joy)
 DON'T: Schadenfreude (laughing at others), Selfishness (rejecting friends to play alone)

[Safety Constraint]
1. Conflicts Resolution: If a conflict arises, it must be resolved positively
2. No Anti-Social Behavior: Do not portray rejection or bullying a cause of happiness
3. Friendship First: In 'Playground' scenarios, prioritizing friends over toys leads to greater happiness.

[Few-Shot Example]
Input: Name=민수, Age=6, Diff=1, Emotion=기쁨, Theme=자동차
Output: {"scenario_script": "민수가 좋아하는 빨간 자동차 장난감을 선물 받았어요! 너무 신이 나서 소리를 질렀어요.", ...}

[Output Format: JSON Only]
{
  "metadata": {
    "title": "10자 이내의 시나리오 제목",
    "difficulty": 난이도 숫자,
    "category": "학교/집/놀이터 등 일상적인 장소 중 하나"
  },
  "scenario_script": "4~5문장으로 구성된 상황 묘사. 아동이 표정을 지어야 하는 결정적 순간에서 종료되어야 합니다.",
  "feedback_prompt": "아동이 반응하지 않을 때 줄 수 있는 힌트 1문장"
}

중요: 반드시 JSON 형식으로만 답변하세요. 다른 설명은 포함하지 마세요.`

  // v4 프롬프트 템플릿 (전문적인 ASD 교육 가이드라인)
  const promptTemplateV4 = `Role: Childhood development specialist and children's story writer specialized in ASD education

Task: Generate an 'Emotional Learning Scenario' in JSON format for children with autism spectrum disorders

[Input Variables]
- Name: {name}
- Age: {age} (3-12세)
- Difficulty: {difficulty} (1-5)
- Target Emotion: {emotion}
- Preferred Theme: {theme}

[Input Validation]
- If difficulty is out of range (1-5), default to level 3
- If emotion or theme is missing, generate a neutral scenario
- Age must be between 3-12; adjust language complexity accordingly

[Core Design Principles]
1. Safety-First: 절대 금지 - 폭력, 따돌림, 기만, 고정관념
2. Concrete & Clear: 추상적 은유보다 구체적 감각 표현 우선
3. Child-Centered: 아동이 통제 가능한 상황과 해결책
4. Personalization: {theme} 요소를 자연스럽게 통합
5. Positive Resolution: 모든 갈등은 긍정적으로 해결

[Difficulty-Emotion Matrix]

Joy (기쁨):
- Level 1-2: 감각적 즐거움 (맛있는 간식, 좋아하는 장난감, 부드러운 촉감)
- Level 3-4: 사회적 기쁨 (친구와 나누기, 도와주기, 함께 성공하기)
- Level 5: 대리 기쁨과 성취 (친구의 성공을 함께 기뻐함, 노력 후 달성)

Sadness (슬픔):
- Level 1-2: 물건 잃어버림, 원하는 것 못 얻음
- Level 3-4: 작별, 기대 불일치, 친구의 슬픔 공감
- Level 5: 깊은 실망, 변화에 대한 적응

Anger (화남):
- Level 1-2: 과제 좌절, 장난감 갈등
- Level 3-4: 불공평함 느낌, 약속 어김
- Level 5: 복합적 좌절, 오해로 인한 분노

Fear (두려움):
- Level 1-2: 큰 소리, 어둠, 낯선 물체
- Level 3-4: 새로운 환경, 실수에 대한 걱정
- Level 5: 사회적 불안, 수행 압박

Surprise (놀람):
- Level 1-2: 예상 밖의 사건, 갑작스런 소리
- Level 3-4: 반전 상황, 예상 밖의 선물
- Level 5: 복잡한 반전, 예상 밖의 친절

[Language Complexity Guidelines]

Difficulty 1-2:
- 단문 중심 (주어+서술어)
- 구체적 감각 표현 ("배고파요", "친구가 왔어요")
- 2-3음절 단어 우선

Difficulty 3:
- 단순 인과관계 ("~해서 ~했어요")
- 기본 감정 어휘 (기쁘다, 속상하다)

Difficulty 4-5:
- 복합 인과관계
- 타인 감정 추론 포함 ("친구가 속상해 보여서...")
- 추상적 감정 표현 (뿌듯하다, 아쉽다)

Age-Specific Vocabulary:
- Age 3-5: 일상 어휘, 단순 문장
- Age 6-8: 기본 감정 어휘 추가
- Age 9-12: 복잡한 감정 표현 가능

[Mandatory Safety Rules]

NEVER include:
- Physical harm or violence (even mild pushing)
- Exclusion as solution (leaving someone out deliberately)
- Deception as positive behavior
- Stereotypes (gender, disability, appearance-based)
- Schadenfreude (laughing at others' misfortune)
- Selfish behavior without consequences

ALWAYS include:
- Clear emotion trigger
- Positive role models
- Inclusive language
- Resolution within child's control
- Korean cultural context (한국 일상 상황)

Special Rules for Joy:
- Playground scenarios: Prioritizing friends over toys = greater happiness
- Conflicts must resolve positively
- No anti-social behavior as happiness source

[Few-Shot Examples]

Example 1:
Input: Name=민수, Age=5, Diff=1, Emotion=기쁨, Theme=자동차
Output:
{
  "metadata": {
    "title": "빨간 자동차",
    "difficulty": 1,
    "category": "집"
  },
  "scenario_script": "민수가 좋아하는 빨간 자동차 장난감을 선물 받았어요. 자동차가 빵빵 소리를 내요. 바퀴가 빙글빙글 잘 돌아가요. 민수는 자동차를 앞으로 밀어봤어요.",
  "feedback_prompt": "민수 기분이 어떨까요?"
}

Example 2:
Input: Name=지우, Age=6, Diff=2, Emotion=슬픔, Theme=강아지
Output:
{
  "metadata": {
    "title": "사라진 강아지",
    "difficulty": 2,
    "category": "집"
  },
  "scenario_script": "지우는 강아지 인형을 항상 안고 다녔어요. 오늘 공원에서 놀다가 인형을 잃어버렸어요. 집에 돌아와서 보니 인형이 없었어요. 지우는 빈 손을 보았어요.",
  "feedback_prompt": "지우는 어떤 얼굴일까요?"
}

Example 3:
Input: Name=서연, Age=8, Diff=4, Emotion=기쁨, Theme=그림
Output:
{
  "metadata": {
    "title": "친구의 칭찬",
    "difficulty": 4,
    "category": "학교"
  },
  "scenario_script": "서연이는 미술 대회를 준비했어요. 열심히 그렸지만 상을 받지 못했어요. 속상했지만 친구가 다가와 '네 그림이 제일 예뻐!'라고 말해줬어요. 선생님도 교실에 서연이 그림을 걸어주셨어요.",
  "feedback_prompt": "지금 서연이 기분은요?"
}

Example 4:
Input: Name=준호, Age=7, Diff=3, Emotion=화남, Theme=로봇
Output:
{
  "metadata": {
    "title": "부서진 로봇",
    "difficulty": 3,
    "category": "놀이터"
  },
  "scenario_script": "준호는 새 로봇 장난감을 가져왔어요. 친구들에게 보여주려고 했어요. 그런데 친구가 실수로 로봇을 떨어뜨렸어요. 로봇 팔이 부러졌어요.",
  "feedback_prompt": "준호는 어떤 표정일까요?"
}

[Output JSON Schema]
{
  "metadata": {
    "title": "string (한글 10자 이내, 이모지 불포함)",
    "difficulty": number (1-5),
    "category": "string (학교|집|놀이터|유치원|공원 중 선택)"
  },
  "scenario_script": "string (60-200자, 4-5문장, 감정 표현이 필요한 결정적 순간에서 종료)",
  "feedback_prompt": "string (의문문으로 종료, 20자 이내)"
}

CRITICAL: Respond ONLY with valid JSON. No additional text, explanations, or markdown formatting.`

  // v5 프롬프트 템플릿 (Special Interest 통합 중심)
  const promptTemplateV5 = `Role: Childhood development specialist and children's story writer specialized in ASD education

Task: Generate an 'Emotional Learning Scenario' in JSON format that leverages the child's special interests while maintaining clear emotional learning objectives for children with autism spectrum disorders

[Input Variables]
- Name: {name}
- Age: {age} (3-12세)
- Difficulty: {difficulty} (1-5)
- Target Emotion: {emotion}
- Preferred Theme: {theme} (child's special interest)

[Input Validation]
- If difficulty is out of range (1-5), default to level 3
- If emotion or theme is missing, generate a neutral scenario
- Age must be between 3-12; adjust language complexity accordingly
- All themes are valid special interests - transform appropriately for ASD context

[Core Design Principles]
1. Special Interest Integration: {theme}은 아동의 special interest이므로 시나리오의 핵심 동기 요소로 활용
2. Concrete Grounding: 판타지 요소도 구체적 맥락(장난감, 책, 게임 등)으로 현실화
3. Predictable Structure: 명확한 인과관계와 예측 가능한 전개
4. Emotional Clarity: 감정 trigger는 실제 사회적 상호작용에서 발생
5. Safety-First: 폭력, 따돌림, 기만, 고정관념 절대 금지
6. Positive Resolution: 모든 갈등은 긍정적으로 해결

[Special Interest Theme Guidelines]

Philosophy: Special interests are powerful motivators for ASD children. Use {theme} to create engagement while teaching emotional recognition through realistic social interactions.

Theme Contextualization by Difficulty:

Difficulty 1-2 (Concrete Object Stage):
→ Physical, tangible forms ONLY
- Format: "{theme} 장난감/인형/그림책/카드"
- Examples:
  · theme=공룡 → "공룡 장난감", "공룡 스티커"
  · theme=요정 → "요정 인형", "요정 그림책"
  · theme=기차 → "기차 장난감", "기차역 그림"
  · theme=우주 → "우주 퍼즐", "우주비행사 인형"
- Emotion trigger: 소유, 감각, 단순 상호작용

Difficulty 3-4 (Pretend Play & Social Stage):
→ Shared interest activities with clear framing
- Format: "{theme}을(를) 좋아하는 활동", "~놀이", "~이야기"
- Examples:
  · theme=로봇 → "로봇 만화 함께 보기", "로봇 그림 그리기"
  · theme=포켓몬 → "포켓몬 카드 교환하기", "포켓몬 이야기하기"
  · theme=공주 → "공주 놀이하기", "공주 옷 입어보기"
- Emotion trigger: 공유, 협력, 타인의 반응

Difficulty 5 (Project & Achievement Stage):
→ Learning, creating, or mastering related to theme
- Format: "~배우기", "~만들기", "~프로젝트"
- Examples:
  · theme=자동차 → "자동차 작동 원리 배우기", "자동차 모형 만들기"
  · theme=동물 → "동물 발표 준비하기", "동물원 관찰 기록"
  · theme=음악 → "악기 연습하기", "노래 공연 준비"
- Emotion trigger: 성취, 인정, 발전

Reality Anchoring Rules:

ALWAYS ground fantasy elements:
- "진짜 요정" ✗ → "요정 인형" ✓
- "마법이 일어났어요" ✗ → "마법사 그림책을 봤어요" ✓
- "공룡이 나타났어요" ✗ → "공룡 박물관에 갔어요" ✓

ALWAYS maintain logical consistency:
- Theme elements follow predictable rules
- No sudden unexplained transformations
- Cause-effect relationships stay clear

ALWAYS keep emotion source realistic:
- Emotion comes from social interaction, NOT from fantasy element
- Example: Joy from "friend sharing interest", not "magic happening"

[Difficulty-Emotion Matrix]

Joy (기쁨):
- Level 1-2:
  · Theme object ownership/discovery
  · Sensory pleasure with theme items
  · 예: "좋아하는 {theme} 장난감을 선물 받음"

- Level 3-4:
  · Sharing theme interest with others
  · Finding someone who likes same theme
  · Joint activity around theme
  · 예: "{theme}을 좋아하는 친구를 만남", "함께 {theme} 놀이"

- Level 5:
  · Achievement in theme-related project
  · Recognition for theme expertise
  · Vicarious joy (friend's theme success)
  · 예: "{theme} 발표 성공", "친구가 {theme} 완성함"

Sadness (슬픔):
- Level 1-2:
  · Loss of theme object
  · Theme item broken/damaged
  · 예: "{theme} 장난감 잃어버림"

- Level 3-4:
  · Can't share theme with others
  · Theme activity interrupted
  · Friend doesn't like theme (rejection)
  · 예: "{theme} 놀이 시간 끝남", "친구가 {theme} 안 좋아함"

- Level 5:
  · Theme project failure after effort
  · Others don't appreciate theme interest
  · 예: "{theme} 발표 실수", "노력했지만 {theme} 프로젝트 안됨"

Anger (화남):
- Level 1-2:
  · Theme object taken/blocked
  · Can't access theme item
  · 예: "동생이 {theme} 장난감 가져감"

- Level 3-4:
  · Unfair treatment in theme activity
  · Rules broken in theme play
  · 예: "친구가 {theme} 놀이 약속 어김"

- Level 5:
  · Theme expertise dismissed
  · Misunderstood about theme
  · 예: "{theme}에 대해 잘못 설명함", "선생님이 {theme} 관심 무시"

Fear (두려움):
- Level 1-2:
  · Theme object making unexpected noise
  · Unfamiliar aspect of theme
  · 예: "새로운 {theme} 소리가 큼"

- Level 3-4:
  · Worried about theme performance
  · Anxious in new theme situation
  · 예: "{theme} 발표 걱정", "처음 가는 {theme} 장소"

- Level 5:
  · Fear of failing at theme skill
  · Social anxiety around theme sharing
  · 예: "{theme} 실력이 부족할까 걱정"

Surprise (놀람):
- Level 1-2:
  · Unexpected theme item appears
  · Theme object does something new
  · 예: "갑자기 {theme} 선물 받음"

- Level 3-4:
  · Unexpected person shares theme interest
  · Surprising theme discovery
  · 예: "선생님도 {theme}을 좋아하심", "새로운 {theme} 발견"

- Level 5:
  · Unexpected theme achievement
  · Surprising theme connection
  · 예: "{theme} 대회 우승", "예상 못한 {theme} 결과"

[Language Complexity Guidelines]

Difficulty 1-2:
- 단문 중심 (주어+서술어)
- 구체적 감각 표현 활용
- Theme vocabulary 직접적 사용
- 예: "{theme} 장난감이 있어요. 만져봤어요. 부드러워요."

Difficulty 3:
- 단순 인과관계 ("~해서 ~했어요")
- 기본 감정 어휘 추가
- Theme sharing 표현
- 예: "{theme}을 좋아해서 친구에게 보여줬어요"

Difficulty 4-5:
- 복합 인과관계
- 타인 감정 추론 포함
- Theme expertise 언어
- 예: "친구도 {theme}을 좋아해서 함께 이야기를 나눴어요"

Age-Specific Vocabulary:
- Age 3-5: 일상 어휘 + 단순 theme 단어
- Age 6-8: 기본 감정 어휘 + theme 세부 표현
- Age 9-12: 복잡한 감정 + theme 전문 용어 가능

[Mandatory Safety Rules]

NEVER include:
- Physical harm or violence (even in theme context)
- Exclusion as solution ("혼자 {theme} 하는게 더 좋아")
- Deception as positive behavior
- Stereotypes (gender roles with themes)
- Theme obsession portrayed negatively
- Others mocking theme interest

ALWAYS include:
- Clear emotion trigger from social interaction
- Positive role models who respect theme interest
- Inclusive language
- Resolution within child's control
- Korean cultural context
- Respect for theme as valid interest

Special Safety for Special Interests:
- NEVER portray theme interest as "weird" or "too much"
- ALWAYS show theme interest as bridge to social connection
- Conflicts resolved through communication, not abandoning interest
- Others may have different interests (diversity is positive)

[Few-Shot Examples]

Example 1 - Concrete Object Stage:
Input: Name=민수, Age=5, Diff=1, Emotion=기쁨, Theme=공룡
Output:
{
  "metadata": {
    "title": "공룡 장난감",
    "difficulty": 1,
    "category": "집"
  },
  "scenario_script": "민수는 공룡을 정말 좋아해요. 오늘 엄마가 티라노 공룡 장난감을 사주셨어요. 공룡이 초록색이에요. 민수는 공룡을 손에 들었어요. 공룡 다리를 움직여봤어요.",
  "feedback_prompt": "민수 기분이 어떨까요?"
}

Example 2 - Object Loss Sadness:
Input: Name=지우, Age=6, Diff=2, Emotion=슬픔, Theme=인형
Output:
{
  "metadata": {
    "title": "잃어버린 인형",
    "difficulty": 2,
    "category": "공원"
  },
  "scenario_script": "지우는 토끼 인형을 항상 가지고 다녀요. 오늘 공원에서 그네를 탔어요. 집에 돌아와서 가방을 열었어요. 토끼 인형이 없었어요. 지우는 빈 가방을 들여다봤어요.",
  "feedback_prompt": "지우는 어떤 표정일까요?"
}

Example 3 - Shared Interest Joy:
Input: Name=서연, Age=7, Diff=3, Emotion=기쁨, Theme=그림
Output:
{
  "metadata": {
    "title": "그림 친구",
    "difficulty": 3,
    "category": "학교"
  },
  "scenario_script": "서연이는 그림 그리기를 정말 좋아해요. 오늘 새로 온 친구 민지가 있어요. 쉬는 시간에 민지도 그림을 그리고 있었어요. 서연이가 다가가서 '나도 그림 좋아해!'라고 말했어요. 민지가 웃으며 '같이 그릴까?'라고 했어요.",
  "feedback_prompt": "서연이는 지금 어떨까요?"
}

Example 4 - Shared Interest Conflict:
Input: Name=준호, Age=8, Diff=4, Emotion=화남, Theme=로봇
Output:
{
  "metadata": {
    "title": "로봇 놀이 약속",
    "difficulty": 4,
    "category": "놀이터"
  },
  "scenario_script": "준호는 친구 민수와 로봇 장난감을 가지고 놀기로 약속했어요. 준호는 좋아하는 로봇을 모두 가져왔어요. 그런데 민수가 '나 축구할래'라고 했어요. 준호는 로봇 놀이를 하고 싶었는데 민수는 로봇에 관심이 없어 보였어요.",
  "feedback_prompt": "준호는 어떤 기분일까요?"
}

Example 5 - Achievement & Recognition:
Input: Name=하은, Age=9, Diff=5, Emotion=기쁨, Theme=우주
Output:
{
  "metadata": {
    "title": "우주 발표 성공",
    "difficulty": 5,
    "category": "학교"
  },
  "scenario_script": "하은이는 우주에 대해 많이 알아요. 과학 시간에 태양계 발표를 준비했어요. 처음에는 친구들 앞에서 말하는 게 떨렸어요. 하지만 좋아하는 우주 이야기라서 용기를 냈어요. 발표를 마치자 친구들이 박수를 쳤어요. 선생님이 '하은이가 우주 박사네!'라고 칭찬하셨어요.",
  "feedback_prompt": "하은이는 어떤 표정일까요?"
}

Example 6 - Theme as Social Bridge:
Input: Name=도윤, Age=10, Diff=5, Emotion=놀람, Theme=기차
Output:
{
  "metadata": {
    "title": "기차 친구 발견",
    "difficulty": 5,
    "category": "학교"
  },
  "scenario_script": "도윤이는 기차를 좋아하지만 같은 관심사를 가진 친구가 없었어요. 점심시간에 혼자 기차 그림을 그리고 있었어요. 옆 반 친구가 다가와서 '그거 KTX야? 나도 기차 좋아해!'라고 말했어요. 도윤이는 깜짝 놀랐어요.",
  "feedback_prompt": "도윤이 기분이 어떨까요?"
}

[Output JSON Schema]
{
  "metadata": {
    "title": "string (한글 10자 이내, 이모지 불포함, theme 관련 제목)",
    "difficulty": number (1-5, input과 일치),
    "category": "string (학교|집|놀이터|유치원|공원 중 선택)"
  },
  "scenario_script": "string (80-220자, 4-6문장, {theme}을 자연스럽게 통합하며 감정 표현이 필요한 결정적 순간에서 종료)",
  "feedback_prompt": "string (의문문으로 종료, 25자 이내, 감정 상태 질문)"
}

[Theme Integration Checklist]
Before generating, verify:
□ Theme appears in concrete, age-appropriate form
□ Theme is source of engagement, not confusion
□ Emotion trigger comes from social interaction involving theme
□ No negative portrayal of special interest
□ Theme helps (not hinders) emotional learning
□ Reality anchoring is clear

CRITICAL: Respond ONLY with valid JSON. No additional text, explanations, or markdown formatting.`

  // v6 프롬프트 템플릿 (아동 주인공 중심 + 감정 명확성 + AU 가시성)
  const promptTemplateV6 = `Role: Childhood development specialist and children's story writer specialized in ASD education

Task: Generate an 'Emotional Learning Scenario' in JSON format for children with autism spectrum disorders, featuring the child as the protagonist in realistic daily situations

[Input Variables]
- Name: {name}
- Age: {age} (3-12세)
- Difficulty: {difficulty} (1-5)
- Target Emotion: {emotion}
- Preferred Theme: {theme} (child's special interest)

[Input Validation]
- If difficulty is out of range (1-5), default to level 3
- If emotion or theme is missing, generate a neutral scenario
- Age must be between 3-12; adjust language complexity accordingly
- All themes are valid special interests - transform appropriately for ASD context

[Core Design Principles]
1. Child as Protagonist: {name} is ALWAYS the main character experiencing the emotion
2. Special Interest Integration: {theme} appears as toys, books, activities, or topics in realistic contexts
3. Concrete Grounding: All elements exist in real, observable daily life situations
4. Predictable Structure: Clear cause-effect relationships with single timeline
5. Emotional Clarity: ONE target emotion with unambiguous trigger and endpoint
6. Safety-First: No violence, exclusion, deception, or stereotypes
7. Positive Resolution: All conflicts resolve constructively

[Theme Integration Strategy]

Philosophy: Use {theme} as motivational element while maintaining realistic social contexts.

Reality-Based Integration by Difficulty:

Difficulty 1-2 (Tangible Objects):
→ Theme as physical items child can touch/see
- Format: "{theme} 장난감/인형/그림책/카드/스티커"
- Examples:
  · theme=공룡 → "공룡 장난감", "공룡 그림책"
  · theme=기차 → "기차 장난감", "기차역 그림"
  · theme=요정 → "요정 인형", "요정 스티커"
  · theme=로봇 → "로봇 피규어", "로봇 그림"
- Context: Home, toy store, receiving gifts
- Emotion source: Possession, sensory experience, simple interaction

Difficulty 3-4 (Activities & Sharing):
→ Theme-related activities with others
- Format: "{theme} 놀이/그리기/만들기/이야기하기/보기"
- Examples:
  · theme=공룡 → "공룡 박물관 가기", "친구와 공룡 그림 그리기"
  · theme=우주 → "우주 다큐 보기", "우주 퍼즐 맞추기"
  · theme=음악 → "악기 연습하기", "노래 부르기"
- Context: School, playground, museum, home with family
- Emotion source: Sharing interest, collaboration, recognition

Difficulty 5 (Projects & Achievement):
→ Theme-related learning and accomplishment
- Format: "{theme} 발표/프로젝트/대회/배우기"
- Examples:
  · theme=동물 → "동물 발표 준비", "동물원 관찰 기록"
  · theme=자동차 → "자동차 모형 만들기", "자동차 원리 배우기"
- Context: School projects, competitions, skill development
- Emotion source: Achievement, peer/teacher recognition, mastery

Reality Anchoring Rules:

ALWAYS keep scenarios realistic:
- Real places: 집, 학교, 놀이터, 유치원, 공원, 박물관, 가게
- Real people: 친구, 선생님, 엄마, 아빠, 동생, 언니/오빠
- Real objects: 장난감, 책, 그림, 카드, 학용품
- Real activities: 놀기, 그리기, 만들기, 보기, 듣기, 배우기

NEVER include:
- Fantasy characters as real entities (요정이 나타났어요 ✗)
- Magical events (마법이 일어났어요 ✗)
- Impossible situations (하늘을 날았어요 ✗)
- Anthropomorphic objects talking (장난감이 말했어요 ✗)

Theme appears as:
- Objects child owns/receives
- Topics child learns/discusses
- Activities child does
- Media child consumes (책, 만화, 다큐)

[Difficulty-Emotion Matrix]

Joy (기쁨):
- Level 1-2:
  · Receiving theme object as gift
  · Sensory pleasure with theme item
  · Simple success with theme toy
  예: "좋아하는 {theme} 장난감 받음", "{theme} 스티커 붙이기 성공"

- Level 3-4:
  · Finding peer who shares theme interest
  · Successfully sharing theme knowledge
  · Participating in theme activity together
  · Praise for theme skill/knowledge
  예: "{theme} 좋아하는 친구 만남", "{theme} 그림 칭찬받음"

- Level 5:
  · Achievement in theme project/presentation
  · Recognition as theme expert
  · Overcoming challenge in theme activity
  예: "{theme} 발표 성공", "{theme} 대회 입상", "어려운 {theme} 문제 해결"

Sadness (슬픔):
- Level 1-2:
  · Losing theme object
  · Theme item broken/damaged
  · Not receiving expected theme item
  예: "{theme} 장난감 잃어버림", "{theme} 그림책 찢어짐"

- Level 3-4:
  · Theme activity cancelled/interrupted
  · Peer doesn't share theme interest (gentle rejection)
  · Can't participate in theme activity
  예: "{theme} 박물관 못 감", "친구가 {theme} 관심 없음"

- Level 5:
  · Theme project/presentation difficulty
  · Others don't value theme expertise
  · Expected theme achievement not met
  예: "{theme} 발표 실수", "{theme} 대회 탈락"

Anger (화남):
- Level 1-2:
  · Theme object taken by sibling
  · Can't access theme toy (blocked)
  · Theme item misused by others
  예: "동생이 {theme} 장난감 가져감", "{theme} 차례 안 지킴"

- Level 3-4:
  · Unfair treatment in theme activity
  · Promise about theme broken
  · Rules violated in theme play
  예: "{theme} 놀이 약속 어김", "{theme} 순서 새치기"

- Level 5:
  · Theme expertise dismissed/ignored
  · Unfair judgment in theme competition
  · Misunderstood about theme knowledge
  예: "{theme} 의견 무시됨", "{theme} 평가 불공정"

Fear (두려움):
- Level 1-2:
  · Theme object making unexpected loud noise
  · Unfamiliar aspect of theme
  · New theme situation (first time)
  예: "{theme} 소리 큼", "처음 보는 {theme}"

- Level 3-4:
  · Worried about theme performance/presentation
  · Anxious in new theme environment
  · Afraid of failing theme activity
  예: "{theme} 발표 걱정", "새로운 {theme} 장소"

- Level 5:
  · Performance anxiety in theme competition
  · Fear of social judgment about theme interest
  · Worried about complex theme challenge
  예: "{theme} 대회 긴장", "{theme} 관심 놀림받을까 걱정"

Surprise (놀람):
- Level 1-2:
  · Unexpected theme gift
  · Theme object does something new
  · Theme item appears unexpectedly
  예: "갑자기 {theme} 선물", "{theme} 장난감 새 기능 발견"

- Level 3-4:
  · Unexpected person shares theme interest
  · Surprising theme discovery/information
  · Unexpected invitation to theme activity
  예: "선생님도 {theme} 좋아하심", "새로운 {theme} 발견"

- Level 5:
  · Unexpected theme achievement
  · Surprising recognition for theme expertise
  · Unexpected theme opportunity
  예: "{theme} 대회 우승", "{theme} 전문가 만남"

[Emotion Clarity Rules]

Single Emotion Principle:
Each scenario focuses ONLY on the target emotion. No mixed or conflicting emotions.

NEVER mix emotions within scenario:
✗ "떨렸지만 기뻤어요" (fear + joy)
✗ "화났지만 웃었어요" (anger + joy)
✗ "슬펐지만 재미있었어요" (sadness + joy)

Emotion Endpoint Requirements:

MUST end with clear emotional trigger:
- Joy: Success visible, praise heard, positive surprise occurred
- Sadness: Loss confirmed, disappointment realized, rejection clear
- Anger: Unfairness revealed, rule broken, promise violated
- Fear: Threat present, danger imminent, worry justified
- Surprise: Unexpected event just occurred, revelation made

MUST include emotion indicator in final sentences:
- Explicit: "웃었어요", "울먹였어요", "화난 표정", "깜짝 놀랐어요"
- Implicit: "박수를 쳤어요" (joy), "고개를 떨어뜨렸어요" (sadness)

NEVER end with:
✗ Ambiguous situations ("~하려고 했어요", "~할 거예요")
✗ Process without outcome ("준비했어요" without result)
✗ Questions ("어떻게 될까요?")
✗ Anticipation before event ("드디어 발표 날이 되었어요")

ALWAYS end with:
✓ Completed action + clear emotional result
✓ Others' observable reaction (말, 표정, 행동)
✓ Child's response indicating target emotion

[Temporal Simplicity Rules]

Difficulty 1-2:
→ Single moment or simple sequence (2-3 steps)
→ Present tense focus
→ Example: "받았어요 → 봤어요 → 웃었어요"

Difficulty 3-4:
→ Simple cause-effect (before → after)
→ Maximum 2 time points
→ Example: "놀이 중 → 문제 발생 → 해결/반응"

Difficulty 5:
→ Brief context + main event + result
→ Maximum 3 time segments
→ Example: "준비(1문장) → 실행(2문장) → 결과(2문장)"

NEVER use:
✗ Complex timelines ("다음 주", "그 동안", "며칠 동안")
✗ Multiple flashbacks or flash-forwards
✗ Extended durations without clear progression

ALWAYS use:
✓ Clear sequential markers ("그런데", "그때", "그러자")
✓ Immediate cause-effect
✓ Present-focused narration

[Language Complexity Guidelines]

Difficulty 1-2:
- Sentence structure: 단문 (주어+서술어)
- Vocabulary: 2-3음절 일상 단어
- Grammar: 현재형 중심, "~했어요" 종결
- Sentences: 3-4개
- Length: 60-120자
- Example: "민수는 공룡 장난감을 받았어요. 초록색이에요. 만졌어요. 웃었어요."

Difficulty 3:
- Sentence structure: 단순 복문 ("~해서 ~했어요")
- Vocabulary: 기본 감정어휘 추가 (기쁘다, 속상하다)
- Grammar: 단순 인과관계
- Sentences: 4-5개
- Length: 100-180자
- Example: "민수는 친구와 공룡 그림을 그렸어요. 친구가 잘 그렸다고 했어요. 민수는 기뻤어요."

Difficulty 4-5:
- Sentence structure: 복합 인과관계, 배경 설명 가능
- Vocabulary: 추상 감정어휘 (뿌듯하다, 억울하다, 아쉽다)
- Grammar: 타인 감정 추론 포함
- Sentences: 5-6개
- Length: 150-220자
- Example: "민수는 공룡 발표를 준비했어요. 열심히 연습했어요. 발표를 잘 마쳤어요. 선생님이 칭찬하셨어요."

Age-Specific Vocabulary:
- Age 3-5: 명사 중심, 단순 동사, 구체적 표현
- Age 6-8: 감정 형용사, 단순 부사, 기본 접속사
- Age 9-12: 추상 개념, 복합 문장, 다양한 표현

[Mandatory Safety Rules]

NEVER include:
- Physical harm or violence (때리기, 밀기, 다치기)
- Bullying or exclusion (따돌림, 놀림, 거부)
- Deception as positive (거짓말로 해결)
- Stereotypes (성별 역할, 외모 평가, 장애 편견)
- Dangerous behaviors (위험한 행동 권장)
- Inappropriate content (부적절한 상황/언어)

ALWAYS include:
- Safe, age-appropriate situations
- Respectful interactions
- Positive role models
- Inclusive language
- Constructive conflict resolution
- Korean cultural context (한국 일상 상황)

Special Safety for Special Interests:
- NEVER portray theme interest negatively ("이상하다", "유치하다")
- ALWAYS show theme as valid interest
- Others may have different interests (diversity is positive)
- Theme interest can be bridge to social connection

[Few-Shot Examples]

Example 1 - Simple Joy (Diff 1):
Input: Name=민수, Age=5, Diff=1, Emotion=기쁨, Theme=공룡
Output:
{
  "metadata": {
    "title": "공룡 선물",
    "difficulty": 1,
    "category": "집"
  },
  "scenario_script": "민수는 공룡을 좋아해요. 엄마가 공룡 장난감을 주셨어요. 초록색 티라노예요. 민수는 공룡을 들었어요. 민수는 웃었어요.",
  "feedback_prompt": "민수 얼굴이 어떨까요?"
}

Example 2 - Object Loss Sadness (Diff 2):
Input: Name=지우, Age=6, Diff=2, Emotion=슬픔, Theme=인형
Output:
{
  "metadata": {
    "title": "잃어버린 인형",
    "difficulty": 2,
    "category": "공원"
  },
  "scenario_script": "지우는 토끼 인형을 좋아해요. 공원에서 그네를 탔어요. 집에 와서 가방을 열었어요. 토끼 인형이 없었어요. 지우는 슬픈 표정을 지었어요.",
  "feedback_prompt": "지우는 어떤 표정일까요?"
}

Example 3 - Shared Interest Joy (Diff 3):
Input: Name=서연, Age=7, Diff=3, Emotion=기쁨, Theme=그림
Output:
{
  "metadata": {
    "title": "그림 친구",
    "difficulty": 3,
    "category": "학교"
  },
  "scenario_script": "서연이는 그림 그리기를 좋아해요. 새로 온 친구 민지가 그림을 그리고 있었어요. 서연이가 '나도 그림 좋아해!'라고 말했어요. 민지가 웃으며 '같이 그릴까?'라고 했어요.",
  "feedback_prompt": "서연이는 지금 어떨까요?"
}

Example 4 - Broken Promise Anger (Diff 4):
Input: Name=준호, Age=8, Diff=4, Emotion=화남, Theme=로봇
Output:
{
  "metadata": {
    "title": "로봇 놀이 약속",
    "difficulty": 4,
    "category": "놀이터"
  },
  "scenario_script": "준호는 친구 민수와 로봇 놀이 약속을 했어요. 준호는 좋아하는 로봇을 모두 가져왔어요. 그런데 민수가 '나 축구할래'라고 했어요. 약속을 지키지 않았어요. 준호는 화난 표정을 지었어요.",
  "feedback_prompt": "준호는 어떤 기분일까요?"
}

Example 5 - Achievement Joy (Diff 5):
Input: Name=하은, Age=9, Diff=5, Emotion=기쁨, Theme=우주
Output:
{
  "metadata": {
    "title": "우주 발표 성공",
    "difficulty": 5,
    "category": "학교"
  },
  "scenario_script": "하은이는 과학 시간에 태양계 발표를 했어요. 좋아하는 우주 이야기라서 열심히 준비했어요. 발표를 마치자 친구들이 박수를 쳤어요. 선생님이 '하은이는 우주 박사구나!'라고 칭찬하셨어요. 하은이는 뿌듯해서 웃었어요.",
  "feedback_prompt": "하은이는 어떤 표정일까요?"
}

Example 6 - Presentation Fear (Diff 4):
Input: Name=도윤, Age=8, Diff=4, Emotion=두려움, Theme=동물
Output:
{
  "metadata": {
    "title": "발표 걱정",
    "difficulty": 4,
    "category": "학교"
  },
  "scenario_script": "도윤이는 동물 발표를 준비했어요. 오늘이 발표하는 날이에요. 친구들이 모두 도윤이를 보고 있어요. 도윤이는 떨리는 목소리로 시작했어요.",
  "feedback_prompt": "도윤이 얼굴이 어떨까요?"
}

[Output JSON Schema]
{
  "metadata": {
    "title": "string (한글 10자 이내, 이모지 불포함)",
    "difficulty": number (1-5, must match input),
    "category": "string (학교|집|놀이터|유치원|공원 중 정확히 하나 선택)"
  },
  "scenario_script": "string (난이도별 권장 길이 준수, {name} 주인공, {theme} 자연스럽게 통합, 명확한 감정 표현으로 종료)",
  "feedback_prompt": "string (의문문, 25자 이내, 감정이나 표정 질문)"
}

[Quality Checklist - Internal Verification]
Before generating, verify:
□ {name} is the protagonist (not theme character)
□ {theme} appears in realistic form (toy, book, activity, topic)
□ Setting is realistic daily location
□ Single clear emotion (no mixing)
□ Ends with observable emotional moment
□ Age-appropriate language
□ Difficulty-appropriate complexity
□ No safety violations
□ Proper JSON format

CRITICAL: Respond ONLY with valid JSON. No additional text, explanations, markdown formatting, or preamble.`

  // v7 프롬프트 템플릿 (완전 자유 편집 가능한 빈 템플릿)
  const promptTemplateV7 = `Role: Childhood development specialist and children's story writer specialized in ASD education

Task: Generate an 'Emotional Learning Scenario' in JSON format for children with autism spectrum disorders

[Input Variables]
- Name: {name}
- Age: {age}
- Difficulty: {difficulty}
- Target Emotion: {emotion}
- Preferred Theme: {theme}

[Instructions]
(여기에 원하는 가이드라인을 작성하세요)

[Output JSON Schema]
{
  "metadata": {
    "title": "string",
    "difficulty": number,
    "category": "string"
  },
  "scenario_script": "string",
  "feedback_prompt": "string"
}

CRITICAL: Respond ONLY with valid JSON.`

  const [editablePromptTemplate, setEditablePromptTemplate] = useState(promptTemplateV7)

  const [scenarioResponse, setScenarioResponse] = useState<ScenarioResponse | null>(null)
  const [rawJsonResponse, setRawJsonResponse] = useState('')
  const [error, setError] = useState('')
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

  // 프롬프트 버전 변경 시 템플릿 업데이트
  useEffect(() => {
    if (promptVersion === 'v1') {
      setEditablePromptTemplate(promptTemplateV1)
    } else if (promptVersion === 'v2') {
      setEditablePromptTemplate(promptTemplateV2)
    } else if (promptVersion === 'v3') {
      setEditablePromptTemplate(promptTemplateV3)
    } else if (promptVersion === 'v4') {
      setEditablePromptTemplate(promptTemplateV4)
    } else if (promptVersion === 'v5') {
      setEditablePromptTemplate(promptTemplateV5)
    } else if (promptVersion === 'v6') {
      setEditablePromptTemplate(promptTemplateV6)
    } else {
      setEditablePromptTemplate(promptTemplateV7)
    }
  }, [promptVersion, promptTemplateV1, promptTemplateV2, promptTemplateV3, promptTemplateV4, promptTemplateV5, promptTemplateV6, promptTemplateV7])

  const handleGenerate = async () => {
    if (!apiSettings.apiKey) {
      setError('API Key를 입력해주세요.')
      return
    }

    setIsGenerating(true)
    setError('')
    setScenarioResponse(null)
    setRawJsonResponse('')
    setValidationResult(null)

    try {
      // 프롬프트 템플릿에 실제 값 채우기
      const filledPrompt = editablePromptTemplate
        .replace(/{name}/g, childProfile.name)
        .replace(/{age}/g, childProfile.age.toString())
        .replace(/{difficulty}/g, childProfile.difficulty.toString())
        .replace(/{emotion}/g, childProfile.targetEmotion)
        .replace(/{theme}/g, childProfile.theme)

      setGeneratedPrompt(filledPrompt)

      let content: string

      // 모델에 따라 다른 API 호출
      if (apiSettings.model.startsWith('gemini')) {
        // Google Gemini API 호출
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${apiSettings.model}:generateContent?key=${apiSettings.apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: filledPrompt
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: apiSettings.temperature,
                topP: apiSettings.topP,
                maxOutputTokens: apiSettings.maxTokens
              }
            })
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error?.message || 'Gemini API 호출 실패')
        }

        const data = await response.json()
        content = data.candidates[0].content.parts[0].text
      } else {
        // OpenAI API 호출
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiSettings.apiKey}`
          },
          body: JSON.stringify({
            model: apiSettings.model,
            messages: [
              {
                role: 'user',
                content: filledPrompt
              }
            ],
            temperature: apiSettings.temperature,
            top_p: apiSettings.topP,
            max_tokens: apiSettings.maxTokens
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error?.message || 'OpenAI API 호출 실패')
        }

        const data = await response.json()
        content = data.choices[0].message.content
      }

      // JSON 파싱
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('JSON 형식의 응답을 찾을 수 없습니다.')
      }

      const parsedJson = JSON.parse(jsonMatch[0])
      setRawJsonResponse(JSON.stringify(parsedJson, null, 2))
      setScenarioResponse(parsedJson)

      // Validation
      const validator = new ScenarioValidator()
      const validation = validator.validate(
        jsonMatch[0],
        childProfile.targetEmotion,
        childProfile.difficulty,
        childProfile.name,
        childProfile.theme
      )
      setValidationResult(validation)

    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">
            🎭 자폐 아동 표정 훈련 앱 - LLM 시나리오 생성 데모
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            데이터베이스 → Spring Boot → LLM → 앱 클라이언트 데이터 흐름 시연
          </p>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DatabasePanel
            apiSettings={apiSettings}
            childProfile={childProfile}
            onApiSettingsChange={setApiSettings}
            onChildProfileChange={setChildProfile}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            promptVersion={promptVersion}
            onPromptVersionChange={setPromptVersion}
          />

          <ServerPanel
            childProfile={childProfile}
            generatedPrompt={generatedPrompt}
            rawJsonResponse={rawJsonResponse}
            isGenerating={isGenerating}
            promptTemplate={editablePromptTemplate}
            onPromptTemplateChange={setEditablePromptTemplate}
            validationResult={validationResult}
            promptVersion={promptVersion}
          />

          <AppPreviewPanel
            scenarioResponse={scenarioResponse}
            isGenerating={isGenerating}
            hasApiKey={!!apiSettings.apiKey}
            error={error}
            targetEmotion={childProfile.targetEmotion}
          />
        </div>
      </main>
    </div>
  )
}

export default App
