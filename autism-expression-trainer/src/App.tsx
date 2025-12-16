import { useState, useEffect } from 'react'
import DatabasePanel from './components/DatabasePanel'
import ServerPanel from './components/ServerPanel'
import AppPreviewPanel from './components/AppPreviewPanel'
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
    model: 'gpt-4o'
  })

  const [childProfile, setChildProfile] = useState<ChildProfile>({
    name: '민수',
    age: 8,
    difficulty: 3,
    targetEmotion: '기쁨',
    theme: '공룡'
  })

  const [promptVersion, setPromptVersion] = useState<'v1' | 'v2' | 'v3'>('v3')
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

  const [editablePromptTemplate, setEditablePromptTemplate] = useState(promptTemplateV3)

  const [scenarioResponse, setScenarioResponse] = useState<ScenarioResponse | null>(null)
  const [rawJsonResponse, setRawJsonResponse] = useState('')
  const [error, setError] = useState('')

  // 프롬프트 버전 변경 시 템플릿 업데이트
  useEffect(() => {
    if (promptVersion === 'v1') {
      setEditablePromptTemplate(promptTemplateV1)
    } else if (promptVersion === 'v2') {
      setEditablePromptTemplate(promptTemplateV2)
    } else {
      setEditablePromptTemplate(promptTemplateV3)
    }
  }, [promptVersion, promptTemplateV1, promptTemplateV2, promptTemplateV3])

  const handleGenerate = async () => {
    if (!apiSettings.apiKey) {
      setError('API Key를 입력해주세요.')
      return
    }

    setIsGenerating(true)
    setError('')
    setScenarioResponse(null)
    setRawJsonResponse('')

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
                temperature: 0.7,
                maxOutputTokens: 500
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
            temperature: 0.7,
            max_tokens: 500
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
