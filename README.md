# ConnectDot Bank AI Agent 시스템

AI 기반 금융 상품 추천 및 분석 서비스 플랫폼

## 개요

ConnectDot Bank AI Agent는 OpenAI GPT-4를 활용하여 고객에게 맞춤형 예금 및 대출 상품을 추천하는 지능형 금융 서비스입니다. 실시간 AI 분석을 통해 개인의 금융 니즈에 최적화된 솔루션을 제공합니다.

## 주요 기능

### 예금 AI 분석
- OpenAI GPT-4 기반 고객 프로필 분석
- 맞춤형 예금 상품 추천
- 실시간 대기열 관리
- 참여 포인트 지급 시스템

### 대출 AI 심사
- AI 기반 대출 적격성 사전 심사
- 신용도 분석 및 위험도 평가
- 맞춤형 대출 상품 추천
- 실시간 승인 확률 계산

### 다국어 지원
- 한국어, 영어, 일본어, 중국어, 베트남어
- 실시간 언어 전환
- 현지화된 사용자 경험

### 보안 및 성능
- 256비트 SSL 암호화
- Rate Limiting 및 DDoS 방어
- 백업 분석 시스템 (AI 서비스 장애시)
- 반응형 웹 디자인

## 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **AI**: OpenAI GPT-4 API
- **보안**: Helmet, CORS, Express Rate Limit
- **스타일링**: 커스텀 CSS with Modern Design
- **아키텍처**: RESTful API, 모듈형 구조

## 설치 및 실행

### 사전 요구사항
- Node.js 18.0.0 이상
- npm 8.0.0 이상
- OpenAI API 키

### 설치 과정

1. **프로젝트 다운로드**
   ```bash
   # Git 클론 또는 ZIP 다운로드
   git clone <repository-url>
   cd connectdot-bank
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 설정**
   ```bash
   # 환경 파일 복사
   cp env-example .env
   
   # .env 파일 편집 (OpenAI API 키 필수)
   nano .env
   ```

4. **Git 설정** (선택사항)
   ```bash
   # .gitignore 파일 생성
   cp gitignore-template .gitignore
   ```

### 실행 명령어

**개발 모드 실행**
```bash
npm run dev
```

**프로덕션 모드 실행**
```bash
npm start
```

**코드 품질 검사**
```bash
npm run lint
npm run format
```

**테스트 실행**
```bash
npm test
```

### 접속 확인

서버 실행 후 브라우저에서 접속:
- 로컬: http://localhost:3000
- 네트워크: http://[your-ip]:3000

## 환경 변수 설정

### 필수 설정
```env
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
PORT=3000
```

### 선택적 설정
```env
# 보안
SESSION_SECRET=random_secret_string
JWT_SECRET=jwt_secret_string

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
AI_RATE_LIMIT_MAX=10

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

## API 엔드포인트

### 예금 관련
- `POST /api/deposit/analyze-customer` - 고객 분석
- `POST /api/deposit/recommend-products` - 상품 추천
- `GET /api/deposit/products` - 상품 목록

### 대출 관련
- `POST /api/loan/analyze-customer` - 고객 분석
- `POST /api/loan/recommend-products` - 상품 추천
- `POST /api/loan/simulate-repayment` - 상환 시뮬레이션

### 일반
- `GET /api/status` - 시스템 상태
- `GET /api/waiting-info` - 대기 정보
- `POST /api/issue-ticket` - 번호표 발급

## 프로젝트 구조

```
connectdot-bank/
├── index.html                    # 메인 랜딩 페이지
├── assets/
│   ├── css/                      # 스타일시트
│   ├── js/                       # JavaScript 모듈
│   └── images/                   # 이미지 리소스
├── pages/
│   ├── deposit.html              # 예금 서비스 페이지
│   └── loan.html                 # 대출 서비스 페이지
├── api/
│   ├── server.js                 # 메인 서버
│   ├── routes/                   # API 라우트
│   └── ai/                       # AI 분석 모듈
└── package.json                  # 프로젝트 설정
```

## 사용 방법

1. **서비스 선택**: 메인 페이지에서 예금 또는 대출 서비스 선택
2. **정보 입력**: 개인정보 및 금융 요구사항 입력
3. **AI 분석**: 설문 응답을 통한 심층 분석
4. **결과 확인**: 맞춤형 상품 추천 및 포인트 지급

## 개발 가이드

### 새로운 기능 추가
1. `api/routes/` 에서 라우트 추가
2. `assets/js/` 에서 프론트엔드 로직 구현
3. `assets/css/` 에서 스타일 정의

### AI 분석 로직 수정
- `api/ai/deposit-analyzer.js` - 예금 분석
- `api/ai/loan-analyzer.js` - 대출 분석
- `api/ai/openai-client.js` - AI 클라이언트

### 다국어 추가
- `assets/js/translations.js` 에서 번역 데이터 추가

## 보안 고려사항

- OpenAI API 키를 안전하게 보관
- HTTPS 사용 권장 (프로덕션)
- 정기적인 보안 업데이트
- 사용자 데이터 암호화

## 문제 해결

### 일반적인 문제
1. **AI 분석이 작동하지 않음**: OpenAI API 키 확인
2. **서버 시작 실패**: 포트 충돌 확인 (PORT 환경변수 변경)
3. **스타일이 적용되지 않음**: 캐시 삭제 후 새로고침

### 로그 확인
```bash
# 서버 로그 실시간 확인
npm run dev

# 에러 로그 확인
tail -f logs/app.log
```

## 라이센스

MIT License

## 지원

- 이슈 리포팅: GitHub Issues
- 기술 문의: callijisu@gmail.com
- 문서: 프로젝트 Wiki

## 기여하기

1. Fork 프로젝트
2. Feature 브랜치 생성
3. 변경사항 커밋
4. Pull Request 생성

---

**주의**: 이 시스템은 데모 목적으로 제작되었습니다. 실제 금융 서비스에 사용시 추가적인 보안 검토와 규제 준수가 필요합니다.
