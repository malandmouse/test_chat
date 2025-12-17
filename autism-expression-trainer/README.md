# 🎭 자폐 아동 표정 훈련 앱 - LLM 시나리오 생성 데모

자폐 아동을 위한 표정 훈련 앱의 **LLM 기반 상황극 생성 기능**을 시연하는 데모 웹사이트입니다.

## 📖 프로젝트 개요

이 데모 사이트는 실제 백엔드 없이 프론트엔드(React)에서 동작하지만, **"데이터베이스 → Spring Boot → LLM → 앱 클라이언트"**로 이어지는 데이터 흐름을 시각적으로 보여줍니다.

### 🎯 주요 목적
- 아동 프로필 정보를 기반으로 맞춤형 표정 훈련 시나리오 생성
- 백엔드 시스템 구조와 LLM 통합 프로세스 시연
- 실제 앱 UI/UX 미리보기 제공

## 🛠 기술 스택

- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **LLM Integration**: OpenAI API & Google Gemini API (Client-side)

## 🎨 화면 구성

### 1️⃣ 좌측 패널: Database & User Settings
- **API 설정**: OpenAI API Key 입력 및 모델 선택
- **아동 프로필**: 이름, 나이, 난이도, 목표 감정 설정
- 실제 DB 연동을 시뮬레이션

### 2️⃣ 중앙 패널: Server Side (Spring Boot & LLM)
- **Java Logic 탭**: Spring Boot 백엔드 로직 시뮬레이션
- **Actual Prompt 탭**: LLM에 전송될 프롬프트 (편집 가능)
- **Raw JSON 탭**: LLM 응답 결과 (JSON)

### 3️⃣ 우측 패널: App Preview
- 아동이 실제로 보게 될 앱 화면
- 시나리오, 표정 선택 UI, 힌트 표시
- 모바일 디바이스 목업으로 표현

## 🚀 설치 및 실행

### 로컬 개발 환경

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 빌드

```bash
npm run build
```

### GitHub Pages 배포

```bash
npm run deploy
```

## 🔑 사용 방법

1. **모델 선택 및 API Key 입력** (좌측 패널)
   - **OpenAI 모델**: [OpenAI Platform](https://platform.openai.com/api-keys)에서 API Key 발급
   - **Gemini 모델**: [Google AI Studio](https://aistudio.google.com/app/apikey)에서 API Key 발급
   - 모델 선택 후 해당 API Key 입력

2. **지원 모델**
   - OpenAI: GPT-4o, GPT-4o Mini, GPT-3.5 Turbo
   - Google Gemini: Gemini 2.5 Pro, Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash

3. **아동 프로필 설정** (좌측 패널)
   - 이름, 나이, 난이도, 목표 감정 입력

4. **시나리오 생성 요청** 버튼 클릭

5. **중앙 패널**에서 백엔드 로직 및 프롬프트 확인

6. **우측 패널**에서 생성된 시나리오를 앱 화면으로 미리보기

## 📝 프롬프트 템플릿

LLM에 전송되는 프롬프트는 다음 변수를 사용합니다:
- `{name}`: 아동의 이름
- `{age}`: 아동의 나이
- `{difficulty}`: 훈련 난이도 (1-5)
- `{emotion}`: 목표 감정 (기쁨, 슬픔, 화남, 놀람 등)

프롬프트는 중앙 패널의 "Actual Prompt" 탭에서 **Edit 버튼**을 통해 실시간으로 수정 가능합니다.

## 🏗 향후 확장 계획

### 백엔드 구현
- **Spring Boot** REST API 서버 구축
- **MySQL** 데이터베이스 연동 (JPA)
- JWT 기반 인증 시스템

### 앱 기능
- 카메라 기반 실시간 표정 인식 (ML Kit / TensorFlow)
- 진행도 트래킹 및 분석
- 보호자용 대시보드

## 📂 프로젝트 구조

```
src/
├── components/
│   ├── DatabasePanel.tsx     # 좌측: DB & 설정
│   ├── ServerPanel.tsx        # 중앙: 백엔드 로직
│   └── AppPreviewPanel.tsx    # 우측: 앱 미리보기
├── App.tsx                    # 메인 앱
├── App.css
└── index.css

tailwind.config.js             # Tailwind 설정
vite.config.ts                 # Vite 설정 (GitHub Pages base)
package.json
```

## 🌐 배포

이 프로젝트는 GitHub Pages를 통해 배포됩니다.

**Live Demo**: `https://[username].github.io/test_chat/`

## 📄 라이선스

MIT

## 🤝 기여

이 프로젝트는 데모 목적으로 제작되었습니다. 개선 사항이나 버그 리포트는 이슈로 등록해주세요.

---

**Made with ❤️ for children with autism**
