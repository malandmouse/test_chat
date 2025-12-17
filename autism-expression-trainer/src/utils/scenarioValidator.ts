export const Emotion = {
  JOY: "기쁨",
  SADNESS: "슬픔",
  ANGER: "화남",
  FEAR: "두려움",
  SURPRISE: "놀람"
} as const

export type EmotionValue = typeof Emotion[keyof typeof Emotion]

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  score: number  // 0-100
  details: Record<string, boolean>
}

export class ScenarioValidator {
  private EMOTION_KEYWORDS: Record<string, { explicit: string[], implicit: string[] }> = {
    "기쁨": {
      explicit: ['웃었어요', '기뻤어요', '신났어요', '즐거웠어요', '행복했어요', '뿌듯했어요'],
      implicit: ['박수', '칭찬', '성공', '좋아요', '잘했', '함께', '만났어요'],
    },
    "슬픔": {
      explicit: ['슬펐어요', '울었어요', '속상했어요', '우울했어요', '아쉬웠어요'],
      implicit: ['없었어요', '잃어버렸어요', '못했어요', '안됐어요', '떨어졌어요', '찢어졌어요'],
    },
    "화남": {
      explicit: ['화났어요', '짜증났어요', '억울했어요', '불만이었어요'],
      implicit: ['불공평', '약속 어김', '새치기', '뺏었어요', '안 지켰어요'],
    },
    "두려움": {
      explicit: ['무서웠어요', '떨렸어요', '두려웠어요', '불안했어요', '걱정했어요'],
      implicit: ['큰 소리', '어둠', '혼자', '처음', '낯선'],
    },
    "놀람": {
      explicit: ['놀랐어요', '깜짝', '놀라운', '예상 못한'],
      implicit: ['갑자기', '몰랐는데'],
    }
  }

  private MIXED_EMOTION_FLAGS: Record<string, string[]> = {
    "기쁨": ['슬펐어요', '울었어요', '화났어요', '떨렸어요', '무서웠어요', '속상했어요'],
    "슬픔": ['웃었어요', '기뻤어요', '신났어요', '즐거웠어요'],
    "화남": ['웃었어요', '기뻤어요', '즐거웠어요'],
    "두려움": ['웃었어요', '기뻤어요', '신났어요'],
    "놀람": [],  // 놀람은 다른 감정과 혼합 가능
  }

  private FORBIDDEN_WORDS = [
    '때렸어요', '맞았어요', '괴롭혔어요', '따돌렸어요',
    '놀렸어요', '무시했어요', '미워했어요',
    '죽었어요', '다쳤어요', '아팠어요',
    '거짓말', '속였어요', '이상해요', '유치해요',
    '못생겼어요', '뚱뚱해요', '바보', '멍청해요'
  ]

  private FANTASY_PATTERNS = [
    /요정이\s+(나타났|말했|날아갔)/,
    /마법이\s+일어났/,
    /공룡이\s+(말했|친구가\s+되었)/,
    /로봇이\s+(혼자\s+움직였|말을\s+했)/,
    /하늘을\s+날았/,
    /투명해졌/,
    /변신했/,
    /시간여행/,
  ]

  private AMBIGUOUS_ENDINGS = [
    /되었어요\.$/,  // "발표 날이 되었어요"
    /할\s+거예요\.$/,
    /하려고\s+했어요\.$/,
    /준비했어요\.$/,  // 결과 없이 준비만
    /어떻게\s+될까요\?$/,
    /궁금했어요\.$/,
  ]

  private LENGTH_CONSTRAINTS: Record<number, [number, number]> = {
    1: [60, 120],
    2: [80, 140],
    3: [100, 180],
    4: [120, 200],
    5: [150, 220],
  }

  private SENTENCE_CONSTRAINTS: Record<number, [number, number]> = {
    1: [3, 4],
    2: [3, 5],
    3: [4, 5],
    4: [4, 6],
    5: [5, 6],
  }

  validate(
    response: string,
    targetEmotion: string,
    difficulty: number,
    name: string,
    theme: string
  ): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const details: Record<string, boolean> = {}

    // 1. JSON 파싱 검증
    let data: any
    try {
      data = JSON.parse(response)
      details.json_valid = true
    } catch (e) {
      return {
        isValid: false,
        errors: [`JSON 파싱 실패: ${e instanceof Error ? e.message : String(e)}`],
        warnings: [],
        score: 0.0,
        details: { json_valid: false }
      }
    }

    // 2. 스키마 검증
    const [schemaValid, schemaErrors] = this.validateSchema(data)
    details.schema_valid = schemaValid
    errors.push(...schemaErrors)

    if (!schemaValid) {
      return {
        isValid: false,
        errors,
        warnings,
        score: 20.0,
        details
      }
    }

    const script = data.scenario_script

    // 3. 감정 명확성 검증
    const emotionEnum = this.getEmotionEnum(targetEmotion)
    const [emotionValid, emotionErrors, emotionWarnings] = this.validateEmotionClarity(script, emotionEnum)
    details.emotion_clarity = emotionValid
    errors.push(...emotionErrors)
    warnings.push(...emotionWarnings)

    // 4. 혼합 감정 검증
    const [mixedValid, mixedErrors] = this.checkMixedEmotions(script, emotionEnum)
    details.no_mixed_emotions = mixedValid
    errors.push(...mixedErrors)

    // 5. 안전성 검증
    const [safetyValid, safetyErrors] = this.validateSafety(script)
    details.safety_check = safetyValid
    errors.push(...safetyErrors)

    // 6. 현실성 검증
    const [realityValid, realityWarnings] = this.validateReality(script, theme)
    details.reality_check = realityValid
    warnings.push(...realityWarnings)

    // 7. 종료 명확성 검증
    const [endingValid, endingErrors] = this.validateEnding(script, emotionEnum)
    details.clear_ending = endingValid
    errors.push(...endingErrors)

    // 8. 주인공 검증
    const [protagonistValid, protagonistErrors] = this.validateProtagonist(script, name)
    details.protagonist_check = protagonistValid
    errors.push(...protagonistErrors)

    // 9. 길이 및 복잡도 검증
    const [lengthValid, lengthWarnings] = this.validateLengthComplexity(script, difficulty)
    details.length_appropriate = lengthValid
    warnings.push(...lengthWarnings)

    // 10. 난이도 일치 검증
    const diffMatch = data.metadata.difficulty === difficulty
    details.difficulty_match = diffMatch
    if (!diffMatch) {
      errors.push(`난이도 불일치: 입력 ${difficulty}, 출력 ${data.metadata.difficulty}`)
    }

    // 최종 점수 계산
    const score = this.calculateScore(details, errors.length, warnings.length)
    const isValid = errors.length === 0 && score >= 70.0

    return {
      isValid,
      errors,
      warnings,
      score,
      details
    }
  }

  private validateSchema(data: any): [boolean, string[]] {
    const errors: string[] = []

    // 필수 필드 확인
    if (!data.metadata) {
      errors.push("'metadata' 필드 누락")
    } else {
      const metadata = data.metadata
      if (!metadata.title) {
        errors.push("'metadata.title' 필드 누락")
      } else if (metadata.title.length > 10) {
        errors.push(`제목이 너무 깁니다: ${metadata.title.length}자 (최대 10자)`)
      }

      if (metadata.difficulty === undefined) {
        errors.push("'metadata.difficulty' 필드 누락")
      } else if (!Number.isInteger(metadata.difficulty) || metadata.difficulty < 1 || metadata.difficulty > 5) {
        errors.push(`난이도가 유효하지 않습니다: ${metadata.difficulty} (1-5 사이여야 함)`)
      }

      if (!metadata.category) {
        errors.push("'metadata.category' 필드 누락")
      } else if (!['학교', '집', '놀이터', '유치원', '공원'].includes(metadata.category)) {
        errors.push(`카테고리가 유효하지 않습니다: ${metadata.category}`)
      }
    }

    if (!data.scenario_script) {
      errors.push("'scenario_script' 필드 누락")
    }

    if (!data.feedback_prompt) {
      errors.push("'feedback_prompt' 필드 누락")
    } else if (data.feedback_prompt.length > 25) {
      errors.push(`피드백 프롬프트가 너무 깁니다: ${data.feedback_prompt.length}자 (최대 25자)`)
    } else if (!data.feedback_prompt.endsWith('?') && !data.feedback_prompt.endsWith('요?')) {
      errors.push("피드백 프롬프트는 의문문이어야 합니다")
    }

    return [errors.length === 0, errors]
  }

  private validateEmotionClarity(script: string, emotion: string): [boolean, string[], string[]] {
    const errors: string[] = []
    const warnings: string[] = []

    const keywords = this.EMOTION_KEYWORDS[emotion]

    // 명시적 키워드 체크
    const hasExplicit = keywords.explicit.some(kw => script.includes(kw))

    // 암시적 키워드 체크
    const hasImplicit = keywords.implicit.some(kw => script.includes(kw))

    if (!hasExplicit && !hasImplicit) {
      errors.push(`감정(${emotion}) 표현이 명확하지 않습니다. 관련 키워드가 없습니다.`)
    } else if (!hasExplicit) {
      warnings.push(`명시적 감정 표현이 없습니다. 암시적 표현만 있습니다.`)
    }

    return [hasExplicit || hasImplicit, errors, warnings]
  }

  private checkMixedEmotions(script: string, targetEmotion: string): [boolean, string[]] {
    const errors: string[] = []

    const conflictingWords = this.MIXED_EMOTION_FLAGS[targetEmotion]
    const foundConflicts = conflictingWords.filter(word => script.includes(word))

    if (foundConflicts.length > 0) {
      errors.push(
        `목표 감정(${targetEmotion})과 충돌하는 감정 표현 발견: ${foundConflicts.join(', ')}`
      )
    }

    return [foundConflicts.length === 0, errors]
  }

  private validateSafety(script: string): [boolean, string[]] {
    const errors: string[] = []

    const foundForbidden = this.FORBIDDEN_WORDS.filter(word => script.includes(word))

    if (foundForbidden.length > 0) {
      errors.push(`금지 단어 발견: ${foundForbidden.join(', ')}`)
    }

    return [foundForbidden.length === 0, errors]
  }

  private validateReality(script: string, theme: string): [boolean, string[]] {
    const warnings: string[] = []

    for (const pattern of this.FANTASY_PATTERNS) {
      if (pattern.test(script)) {
        warnings.push(`비현실적 요소 감지: '${pattern.source}' 패턴 발견`)
      }
    }

    // 테마가 주어로 행동하는지 확인 (나쁜 신호)
    const fantasySubjectPattern = new RegExp(`${theme}(이|가)\\s+(말했|웃었|슬펐|화났)`)
    if (fantasySubjectPattern.test(script)) {
      warnings.push(`판타지 캐릭터가 주인공처럼 행동합니다: ${theme}`)
    }

    return [warnings.length === 0, warnings]
  }

  private validateEnding(script: string, emotion: string): [boolean, string[]] {
    const errors: string[] = []

    // 모호한 종료 패턴 체크
    for (const pattern of this.AMBIGUOUS_ENDINGS) {
      if (pattern.test(script)) {
        errors.push(`모호한 종료: 명확한 감정 결과 없이 종료됩니다`)
        break
      }
    }

    // 마지막 1-2 문장에 감정 표현이 있는지 확인
    const sentences = script.split('.').filter(s => s.trim())
    const lastSentences = sentences.slice(-2).join('. ')

    const keywords = this.EMOTION_KEYWORDS[emotion]
    const hasEmotionInEnding = (
      keywords.explicit.some(kw => lastSentences.includes(kw)) ||
      keywords.implicit.some(kw => lastSentences.includes(kw))
    )

    if (!hasEmotionInEnding) {
      errors.push("시나리오 종료 부분에 감정 표현이 없습니다")
    }

    return [errors.length === 0, errors]
  }

  private validateProtagonist(script: string, name: string): [boolean, string[]] {
    const errors: string[] = []

    // 이름이 주어로 등장하는지 확인
    const nameAsSubjectPattern = new RegExp(`${name}(은|는|이|가)`)
    if (!nameAsSubjectPattern.test(script)) {
      errors.push(`아동 이름(${name})이 주어로 등장하지 않습니다`)
    }

    // 이름이 최소 2번 이상 등장하는지 확인
    const nameCount = (script.match(new RegExp(name, 'g')) || []).length
    if (nameCount < 2) {
      errors.push(`아동 이름이 충분히 등장하지 않습니다 (현재 ${nameCount}회)`)
    }

    return [errors.length === 0, errors]
  }

  private validateLengthComplexity(script: string, difficulty: number): [boolean, string[]] {
    const warnings: string[] = []

    // 길이 체크
    const length = script.length
    const [minLength, maxLength] = this.LENGTH_CONSTRAINTS[difficulty]

    if (length < minLength) {
      warnings.push(`시나리오가 너무 짧습니다: ${length}자 (최소 ${minLength}자)`)
    } else if (length > maxLength) {
      warnings.push(`시나리오가 너무 깁니다: ${length}자 (최대 ${maxLength}자)`)
    }

    // 문장 수 체크
    const sentences = script.split('.').filter(s => s.trim())
    const sentenceCount = sentences.length
    const [minSentences, maxSentences] = this.SENTENCE_CONSTRAINTS[difficulty]

    if (sentenceCount < minSentences) {
      warnings.push(`문장 수가 부족합니다: ${sentenceCount}개 (최소 ${minSentences}개)`)
    } else if (sentenceCount > maxSentences) {
      warnings.push(`문장 수가 과다합니다: ${sentenceCount}개 (최대 ${maxSentences}개)`)
    }

    return [warnings.length === 0, warnings]
  }

  private calculateScore(details: Record<string, boolean>, errorCount: number, warningCount: number): number {
    // 기본 점수
    let baseScore = 100.0

    // 치명적 오류 (-20점씩)
    const criticalChecks = ['json_valid', 'schema_valid', 'safety_check', 'protagonist_check']
    for (const check of criticalChecks) {
      if (!details[check]) {
        baseScore -= 20.0
      }
    }

    // 중요 오류 (-10점씩)
    const importantChecks = ['emotion_clarity', 'no_mixed_emotions', 'clear_ending']
    for (const check of importantChecks) {
      if (!details[check]) {
        baseScore -= 10.0
      }
    }

    // 경고 (-5점씩)
    const mediumChecks = ['reality_check', 'length_appropriate']
    for (const check of mediumChecks) {
      if (!details[check]) {
        baseScore -= 5.0
      }
    }

    // 추가 오류/경고 패널티
    baseScore -= errorCount * 3.0
    baseScore -= warningCount * 1.0

    return Math.max(0.0, baseScore)
  }

  private getEmotionEnum(emotionStr: string): string {
    const emotionMap: Record<string, string> = {
      '기쁨': Emotion.JOY,
      'joy': Emotion.JOY,
      '슬픔': Emotion.SADNESS,
      'sadness': Emotion.SADNESS,
      '화남': Emotion.ANGER,
      'anger': Emotion.ANGER,
      '두려움': Emotion.FEAR,
      'fear': Emotion.FEAR,
      '놀람': Emotion.SURPRISE,
      'surprise': Emotion.SURPRISE,
    }
    return emotionMap[emotionStr.toLowerCase()] || Emotion.JOY
  }

  generateReport(result: ValidationResult): string {
    const lines: string[] = []
    lines.push("=" + "=".repeat(59))
    lines.push("시나리오 검증 리포트")
    lines.push("=" + "=".repeat(59))
    lines.push(`\n전체 점수: ${result.score.toFixed(1)}/100`)
    lines.push(`검증 결과: ${result.isValid ? '✓ 통과' : '✗ 실패'}\n`)

    if (result.errors.length > 0) {
      lines.push("오류 (Errors):")
      result.errors.forEach((error, i) => {
        lines.push(`  ${i + 1}. ${error}`)
      })
      lines.push("")
    }

    if (result.warnings.length > 0) {
      lines.push("경고 (Warnings):")
      result.warnings.forEach((warning, i) => {
        lines.push(`  ${i + 1}. ${warning}`)
      })
      lines.push("")
    }

    lines.push("세부 체크:")
    Object.entries(result.details).forEach(([check, passed]) => {
      const status = passed ? "✓" : "✗"
      lines.push(`  ${status} ${check}`)
    })

    lines.push("=" + "=".repeat(59))

    return lines.join("\n")
  }
}
