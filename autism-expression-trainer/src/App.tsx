import { useState } from 'react'
import DatabasePanel from './components/DatabasePanel'
import ServerPanel from './components/ServerPanel'
import AppPreviewPanel from './components/AppPreviewPanel'
import './App.css'

export interface ChildProfile {
  name: string
  age: number
  difficulty: number
  targetEmotion: string
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
    targetEmotion: '기쁨'
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [editablePromptTemplate, setEditablePromptTemplate] = useState(`당신은 자폐 아동을 위한 표정 훈련 전문가입니다.

다음 조건에 맞는 상황극 시나리오를 JSON 포맷으로 생성해주세요.

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

중요: 반드시 JSON 형식으로만 답변하세요. 다른 설명은 포함하지 마세요.`)

  const [scenarioResponse, setScenarioResponse] = useState<ScenarioResponse | null>(null)
  const [rawJsonResponse, setRawJsonResponse] = useState('')
  const [error, setError] = useState('')

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
