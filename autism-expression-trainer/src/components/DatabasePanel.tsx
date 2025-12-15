import { Database, Settings, User } from 'lucide-react'
import type { ApiSettings, ChildProfile } from '../App'

interface DatabasePanelProps {
  apiSettings: ApiSettings
  childProfile: ChildProfile
  onApiSettingsChange: (settings: ApiSettings) => void
  onChildProfileChange: (profile: ChildProfile) => void
  onGenerate: () => void
  isGenerating: boolean
}

export default function DatabasePanel({
  apiSettings,
  childProfile,
  onApiSettingsChange,
  onChildProfileChange,
  onGenerate,
  isGenerating
}: DatabasePanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 h-fit">
      <div className="flex items-center gap-2 mb-6">
        <Database className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-800">Database & User Settings</h2>
      </div>

      {/* API 설정 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-700">API 설정</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              모델 선택
            </label>
            <select
              value={apiSettings.model}
              onChange={(e) => onApiSettingsChange({ ...apiSettings, model: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <optgroup label="OpenAI">
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </optgroup>
              <optgroup label="Google Gemini">
                <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key {apiSettings.model.startsWith('gemini') ? '(Google AI Studio)' : '(OpenAI)'}
            </label>
            <input
              type="password"
              value={apiSettings.apiKey}
              onChange={(e) => onApiSettingsChange({ ...apiSettings, apiKey: e.target.value })}
              placeholder={apiSettings.model.startsWith('gemini') ? 'AI...' : 'sk-...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 아동 프로필 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-700">아동 프로필 설정</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이름
            </label>
            <input
              type="text"
              value={childProfile.name}
              onChange={(e) => onChildProfileChange({ ...childProfile, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              나이 (세)
            </label>
            <input
              type="number"
              value={childProfile.age}
              onChange={(e) => onChildProfileChange({ ...childProfile, age: parseInt(e.target.value) || 0 })}
              min="1"
              max="18"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              훈련 난이도: {childProfile.difficulty}/5
            </label>
            <input
              type="range"
              value={childProfile.difficulty}
              onChange={(e) => onChildProfileChange({ ...childProfile, difficulty: parseInt(e.target.value) })}
              min="1"
              max="5"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>쉬움</span>
              <span>어려움</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              목표 감정
            </label>
            <select
              value={childProfile.targetEmotion}
              onChange={(e) => onChildProfileChange({ ...childProfile, targetEmotion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="기쁨">😊 기쁨</option>
              <option value="슬픔">😢 슬픔</option>
              <option value="화남">😠 화남</option>
              <option value="놀람">😲 놀람</option>
              <option value="두려움">😨 두려움</option>
              <option value="혐오">🤢 혐오</option>
            </select>
          </div>
        </div>
      </div>

      {/* 생성 버튼 */}
      <button
        onClick={onGenerate}
        disabled={isGenerating || !apiSettings.apiKey}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>생성 중...</span>
          </>
        ) : (
          <span>🎬 시나리오 생성 요청</span>
        )}
      </button>

      {!apiSettings.apiKey && (
        <p className="mt-3 text-sm text-amber-600 text-center">
          ⚠️ API Key를 입력해주세요
        </p>
      )}

      {/* DB 연동 힌트 */}
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-xs text-green-800">
          💡 <strong>향후 확장:</strong> 이 폼 데이터는 실제 MySQL DB와 연동되어
          Spring Boot의 JPA Repository를 통해 관리될 예정입니다.
        </p>
      </div>
    </div>
  )
}
