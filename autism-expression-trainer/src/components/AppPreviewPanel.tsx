import { Smartphone, Sparkles, AlertCircle, Lightbulb } from 'lucide-react'
import type { ScenarioResponse } from '../App'

interface AppPreviewPanelProps {
  scenarioResponse: ScenarioResponse | null
  isGenerating: boolean
  hasApiKey: boolean
  error: string
}

export default function AppPreviewPanel({
  scenarioResponse,
  isGenerating,
  hasApiKey,
  error
}: AppPreviewPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Smartphone className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-bold text-gray-800">App Preview (Child's View)</h2>
      </div>

      {/* 스마트폰 목업 */}
      <div className="mx-auto max-w-sm">
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-6 shadow-2xl border-8 border-gray-800">
          {/* 상태 바 */}
          <div className="flex justify-between items-center mb-4 text-xs text-gray-600">
            <span>9:41</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
              <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
              <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
            </div>
          </div>

          {/* 앱 컨텐츠 */}
          <div className="bg-white rounded-2xl p-6 min-h-[500px] shadow-inner">
            {!hasApiKey ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
                <h3 className="text-lg font-bold text-gray-700 mb-2">API Key 필요</h3>
                <p className="text-sm text-gray-600">
                  좌측 패널에서 OpenAI API Key를<br />
                  입력해주세요!
                </p>
              </div>
            ) : isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="relative">
                  <Sparkles className="w-16 h-16 text-purple-500 animate-pulse" />
                  <div className="absolute inset-0 w-16 h-16 border-4 border-purple-300 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="text-xl font-bold text-purple-700 mt-6 mb-2 font-cute">
                  AI가 재미있는 이야기를
                </h3>
                <h3 className="text-xl font-bold text-purple-700 mb-4 font-cute">
                  만들고 있어요...
                </h3>
                <div className="flex gap-1 mt-4">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-lg font-bold text-gray-700 mb-2">오류 발생</h3>
                <p className="text-sm text-red-600 break-words px-4">
                  {error}
                </p>
              </div>
            ) : scenarioResponse ? (
              <div className="space-y-6">
                {/* 카테고리 뱃지 */}
                <div className="flex items-center justify-between">
                  <span className="inline-block px-3 py-1 bg-purple-200 text-purple-800 text-xs font-semibold rounded-full">
                    {scenarioResponse.metadata.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    난이도 {scenarioResponse.metadata.difficulty}/5
                  </span>
                </div>

                {/* 제목 */}
                <h3 className="text-2xl font-bold text-purple-900 text-center font-cute">
                  {scenarioResponse.metadata.title}
                </h3>

                {/* 아바타 */}
                <div className="flex justify-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-5xl">😊</span>
                  </div>
                </div>

                {/* 시나리오 스크립트 - 말풍선 형태 */}
                <div className="relative bg-purple-50 rounded-3xl p-6 border-2 border-purple-200">
                  {/* 말풍선 꼬리 */}
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-purple-50 border-l-2 border-t-2 border-purple-200 rotate-45"></div>

                  <p className="text-gray-800 leading-relaxed text-center whitespace-pre-line">
                    {scenarioResponse.scenario_script}
                  </p>
                </div>

                {/* 표정 선택 영역 (시뮬레이션) */}
                <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-4">
                  <p className="text-center text-sm font-semibold text-purple-800 mb-3">
                    어떤 표정을 지어야 할까요?
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {['😊', '😢', '😠', '😲'].map((emoji, idx) => (
                      <button
                        key={idx}
                        className="bg-white hover:bg-purple-200 rounded-xl p-3 text-3xl transition-colors shadow-sm"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 피드백 힌트 */}
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 flex gap-3">
                  <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-yellow-800 mb-1">힌트</p>
                    <p className="text-sm text-yellow-900">
                      {scenarioResponse.feedback_prompt}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Sparkles className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-700 mb-2">시나리오 대기 중</h3>
                <p className="text-sm text-gray-600">
                  좌측 패널에서<br />
                  "시나리오 생성 요청" 버튼을<br />
                  눌러주세요!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 앱 정보 */}
        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-xs text-purple-800">
            💡 <strong>실제 앱:</strong> 아동은 이 화면에서 카메라를 통해 표정을 만들고,
            AI가 실시간으로 표정을 인식하여 피드백을 제공합니다.
          </p>
        </div>
      </div>
    </div>
  )
}
