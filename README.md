# Bank

가계부 데이터를 입력하고, 사용자의 투자 조건을 바탕으로 Gemini API에 ETF 중심 투자 조언을 요청하는 프로젝트입니다.

## 프로젝트 구성

- `frontend`
  - React + Vite 기반 프론트엔드
  - 가계부 입력, 월별 수입/지출 요약, 카테고리 비중, AI 투자 조언 UI 제공
- `backend`
  - Node.js 기본 `http` 서버
  - `backend/.env`에 저장된 Gemini API 키를 읽어 투자 조언 API 제공

## 주요 기능

- 수입/지출 거래 내역 추가, 수정, 삭제
- 월별 수입/지출 시각화
- 카테고리별 수입/지출 비중 표시
- 사용자 투자 조건 입력
- Gemini API를 통한 ETF 추천, 투자 비율, 단기 유망 산업 조언 생성

## 폴더 구조

```text
bank/
├─ backend/
│  ├─ .env
│  ├─ .env.example
│  ├─ .gitignore
│  ├─ package.json
│  └─ server.js
├─ frontend/
│  ├─ index.html
│  ├─ package.json
│  ├─ vite.config.js
│  └─ src/
│     ├─ App.jsx
│     ├─ index.css
│     └─ main.jsx
└─ README.md
```

## 실행 방법

### 1. 백엔드 환경 변수 설정

`backend/.env` 파일에 Gemini API 키를 입력합니다.

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=8787
```

### 2. 백엔드 실행

```bash
cd backend
npm run dev
```

기본 주소:

```text
http://localhost:8787
```

API 경로:

```text
GET  /api/health
POST /api/investment-advice
```

### 3. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

기본 주소:

```text
http://localhost:5173
```

프론트의 `/api` 요청은 `vite.config.js`에서 백엔드 `http://localhost:8787`로 프록시되도록 설정되어 있습니다.

## 화면 설명

- 가계부 요약 카드
  - 총 잔액, 총 수입, 총 지출 표시
- 월별 수입/지출 차트
  - 월 단위 수입/지출 비교
- 카테고리 비중 차트
  - 수입/지출 분포 확인
- 거래 입력 폼
  - 날짜, 카테고리, 금액 기준으로 거래 추가
- AI 투자 조언 영역
  - 투자 가능 금액, 현금, 부채, 투자 성향 등을 입력하고 Gemini 조언 요청

## 스크린샷

실제 서비스 화면 캡처를 추가하려면 `README.md` 기준 상대 경로로 이미지를 넣으면 됩니다.

```md
![메인 화면](./docs/screenshots/main.png)
![AI 투자 조언 화면](./docs/screenshots/advice.png)
```

예시 섹션:

```md
### 메인 화면
![메인 화면](./docs/screenshots/main.png)

### AI 투자 조언 화면
![AI 투자 조언 화면](./docs/screenshots/advice.png)
```

현재 프로젝트에는 README에 바로 연결할 실제 앱 스크린샷 파일이 없어서, 위 형식으로 추가하면 됩니다.

## 백엔드 동작 방식

- `server.js`가 `backend/.env`를 읽어 Gemini API 키를 로드합니다.
- 프론트에서 전달한 투자 조건과 거래 요약 데이터를 바탕으로 프롬프트를 생성합니다.
- Gemini API 호출 결과를 프론트에 JSON 형태로 반환합니다.

## 참고 사항

- 투자 조언은 참고용이며 실제 투자 판단과 책임은 사용자 본인에게 있습니다.
- `backend/.env`는 민감 정보가 포함되므로 Git에 포함하지 않도록 `backend/.gitignore`에 등록되어 있습니다.
- `frontend/dist`는 프론트 빌드 결과물입니다.
