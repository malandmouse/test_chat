// ============================================
// 백엔드 다양성 보장 로직
// Context Pool for diverse scenario generation
// ============================================

export type ContextType = 'creative' | 'observation' | 'social' | 'outdoors' | 'food'

export interface ContextPool {
  [key: string]: string[]
}

export const CONTEXT_POOL: ContextPool = {
  creative: [
    '미술 시간에 {theme} 그림을 그리고 있어요',
    '{theme} 색칠 공부를 하고 있어요',
    '점토로 {theme}를 만들고 있어요',
    '{theme} 종이접기를 하고 있어요'
  ],
  observation: [
    '도서관에서 {theme} 책을 읽고 있어요',
    'TV에서 {theme} 다큐멘터리를 보고 있어요',
    '교실에 {theme} 포스터가 새로 붙었어요',
    '{theme} 사진을 구경하고 있어요'
  ],
  social: [
    '친구와 {theme}에 대해 이야기하고 있어요',
    '친구와 {theme} 역할놀이를 하고 있어요',
    '{theme} 퀴즈 놀이를 하고 있어요',
    '친구에게 {theme}를 설명해주고 있어요'
  ],
  outdoors: [
    '{theme} 박물관에 견학을 갔어요',
    '공원에서 {theme} 모양을 찾고 있어요',
    '산책하다가 {theme} 조형물을 발견했어요',
    '하늘에서 {theme} 모양 구름을 봤어요'
  ],
  food: [
    '점심시간에 {theme} 모양 주먹밥을 받았어요',
    '간식으로 {theme} 쿠키를 먹고 있어요',
    '{theme} 그릇에 밥을 담아주셨어요',
    '{theme} 모양 젤리를 발견했어요'
  ]
}

/**
 * 최근 사용한 컨텍스트를 추적하고 다양성을 보장하는 클래스
 */
export class ContextSelector {
  private recentContexts: ContextType[] = []
  private readonly maxHistorySize = 5
  private readonly avoidRecentCount = 2

  constructor() {
    // 로컬 스토리지에서 최근 사용 기록 불러오기
    this.loadFromStorage()
  }

  /**
   * 로컬 스토리지에서 최근 사용 기록 불러오기
   */
  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('recentContexts')
      if (saved) {
        this.recentContexts = JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Failed to load recent contexts from localStorage:', error)
      this.recentContexts = []
    }
  }

  /**
   * 로컬 스토리지에 최근 사용 기록 저장
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('recentContexts', JSON.stringify(this.recentContexts))
    } catch (error) {
      console.warn('Failed to save recent contexts to localStorage:', error)
    }
  }

  /**
   * 백엔드에서 다양성을 보장하는 컨텍스트 선택
   * @param theme - 테마 (예: "공룡", "자동차")
   * @returns [contextType, contextDetail] - 선택된 컨텍스트 타입과 구체적인 컨텍스트
   */
  selectDiverseContext(theme: string): [ContextType, string] {
    // 사용 가능한 컨텍스트 타입 (최근 2개 제외)
    const contextTypes = Object.keys(CONTEXT_POOL) as ContextType[]
    let availableContexts = contextTypes.filter(
      (ctx) => !this.recentContexts.slice(-this.avoidRecentCount).includes(ctx)
    )

    // 모든 컨텍스트가 최근에 사용되었다면 히스토리 초기화
    if (availableContexts.length === 0) {
      availableContexts = contextTypes
      this.recentContexts = []
    }

    // 랜덤 선택
    const contextType = availableContexts[Math.floor(Math.random() * availableContexts.length)]
    const contextTemplates = CONTEXT_POOL[contextType]
    const contextTemplate = contextTemplates[Math.floor(Math.random() * contextTemplates.length)]
    const contextDetail = contextTemplate.replace(/{theme}/g, theme)

    // 기록
    this.recentContexts.push(contextType)
    if (this.recentContexts.length > this.maxHistorySize) {
      this.recentContexts.shift()
    }

    // 로컬 스토리지에 저장
    this.saveToStorage()

    return [contextType, contextDetail]
  }

  /**
   * 최근 사용 기록 초기화
   */
  resetHistory(): void {
    this.recentContexts = []
    this.saveToStorage()
  }

  /**
   * 최근 사용 기록 조회
   */
  getRecentContexts(): ContextType[] {
    return [...this.recentContexts]
  }
}

// 싱글톤 인스턴스
export const contextSelector = new ContextSelector()
