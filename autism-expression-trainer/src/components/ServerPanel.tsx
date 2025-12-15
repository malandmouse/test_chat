import { useState } from 'react'
import { Server, Code, FileJson, Edit2, Save, X, Copy, Check } from 'lucide-react'
import type { ChildProfile } from '../App'

interface ServerPanelProps {
  childProfile: ChildProfile
  generatedPrompt: string
  rawJsonResponse: string
  isGenerating: boolean
  promptTemplate: string
  onPromptTemplateChange: (template: string) => void
}

export default function ServerPanel({
  childProfile,
  generatedPrompt,
  rawJsonResponse,
  isGenerating,
  promptTemplate,
  onPromptTemplateChange
}: ServerPanelProps) {
  const [activeTab, setActiveTab] = useState<'java' | 'prompt' | 'json'>('java')
  const [isEditingPrompt, setIsEditingPrompt] = useState(false)
  const [tempPromptTemplate, setTempPromptTemplate] = useState(promptTemplate)
  const [isCopied, setIsCopied] = useState(false)

  const handleEditPrompt = () => {
    setTempPromptTemplate(promptTemplate)
    setIsEditingPrompt(true)
  }

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(rawJsonResponse)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleSavePrompt = () => {
    onPromptTemplateChange(tempPromptTemplate)
    setIsEditingPrompt(false)
  }

  const handleCancelEdit = () => {
    setTempPromptTemplate(promptTemplate)
    setIsEditingPrompt(false)
  }

  // Java 코드 - 실제 childProfile 값을 반영
  const javaCode = `// ChildService.java
@Service
public class ChildService {

    @Autowired
    private ChildRepository childRepository;

    @Autowired
    private LLMClient llmClient;

    /**
     * 아동 ID로 맞춤형 시나리오 생성
     * @param childId 아동 고유 ID
     * @return LLM이 생성한 시나리오 JSON
     */
    public String generateScenario(Long childId) {
        // 1. DB에서 아동 정보 조회
        Child child = childRepository.findById(childId)
            .orElseThrow(() -> new ChildNotFoundException(childId));

        // 현재 선택된 아동 정보:
        // - 이름: "${childProfile.name}"
        // - 나이: ${childProfile.age}세
        // - 난이도: ${childProfile.difficulty}/5
        // - 목표 감정: ${childProfile.targetEmotion}

        // 2. 프롬프트 템플릿에 값 주입
        String prompt = PromptTemplate.SCENARIO_GEN
            .replace("{age}", child.getAge().toString())        // ${childProfile.age}
            .replace("{difficulty}", child.getDifficulty().toString())  // ${childProfile.difficulty}
            .replace("{emotion}", child.getTargetEmotion());    // ${childProfile.targetEmotion}

        // 3. LLM API 호출
        String response = llmClient.call(prompt);

        // 4. 응답 로깅 및 반환
        log.info("Scenario generated for child: {}", child.getName());
        return response;
    }
}

// Child.java (Entity)
@Entity
@Table(name = "children")
public class Child {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;           // "${childProfile.name}"
    private Integer age;           // ${childProfile.age}
    private Integer difficulty;    // ${childProfile.difficulty}
    private String targetEmotion;  // "${childProfile.targetEmotion}"

    // getters, setters...
}`

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Server className="w-6 h-6 text-green-600" />
        <h2 className="text-xl font-bold text-gray-800">Server Side (Spring Boot & LLM)</h2>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab('java')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'java'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Java Logic
          </div>
        </button>
        <button
          onClick={() => setActiveTab('prompt')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'prompt'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Edit2 className="w-4 h-4" />
            Actual Prompt
          </div>
        </button>
        <button
          onClick={() => setActiveTab('json')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'json'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileJson className="w-4 h-4" />
            Raw JSON
          </div>
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="bg-gray-900 rounded-lg p-4 overflow-auto" style={{ maxHeight: '600px' }}>
        {activeTab === 'java' && (
          <div>
            <pre className="text-sm text-gray-100 font-mono leading-relaxed overflow-x-auto">
              <code>{javaCode}</code>
            </pre>
          </div>
        )}

        {activeTab === 'prompt' && (
          <div>
            {!isEditingPrompt ? (
              <>
                <div className="flex justify-end mb-2">
                  <button
                    onClick={handleEditPrompt}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                </div>
                <pre className="text-sm text-gray-100 font-mono leading-relaxed whitespace-pre-wrap">
                  {generatedPrompt || promptTemplate.replace(/{age}/g, childProfile.age.toString())
                    .replace(/{difficulty}/g, childProfile.difficulty.toString())
                    .replace(/{emotion}/g, childProfile.targetEmotion)}
                </pre>
              </>
            ) : (
              <>
                <div className="flex justify-end gap-2 mb-2">
                  <button
                    onClick={handleSavePrompt}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                  >
                    <Save className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                </div>
                <textarea
                  value={tempPromptTemplate}
                  onChange={(e) => setTempPromptTemplate(e.target.value)}
                  className="w-full h-96 bg-gray-800 text-gray-100 font-mono text-sm p-3 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
                  style={{ resize: 'vertical' }}
                />
              </>
            )}
            {!generatedPrompt && !isGenerating && (
              <p className="mt-4 text-yellow-400 text-sm">
                ⚠️ 시나리오 생성 버튼을 눌러 프롬프트를 생성하세요
              </p>
            )}
          </div>
        )}

        {activeTab === 'json' && (
          <div>
            {rawJsonResponse ? (
              <>
                <div className="flex justify-end mb-2">
                  <button
                    onClick={handleCopyJson}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3" />
                        복사됨!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        복사하기
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-sm text-green-400 font-mono leading-relaxed">
                  {rawJsonResponse}
                </pre>
              </>
            ) : isGenerating ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-gray-400 text-sm">LLM 응답 대기 중...</p>
                </div>
              </div>
            ) : (
              <p className="text-yellow-400 text-sm">
                ⚠️ 시나리오를 생성하면 여기에 LLM의 JSON 응답이 표시됩니다
              </p>
            )}
          </div>
        )}
      </div>

      {/* 서버 정보 */}
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-xs text-green-800">
          💡 <strong>실제 구현 시:</strong> Spring Boot의 @RestController가 이 로직을 실행하고,
          프론트엔드는 REST API를 통해 결과를 받아옵니다.
        </p>
      </div>
    </div>
  )
}
