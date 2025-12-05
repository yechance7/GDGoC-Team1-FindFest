# FindFest - 나만을 위한 서울 축제/이벤트 추천

**FindFest**는 서울의 다채로운 축제와 문화 행사를 쉽고 재미있게 찾아주는 스마트 웹 애플리케이션입니다. AI 챗봇과 대화하며 내 취향에 꼭 맞는 이벤트를 추천받아 보세요.

## 🌟 개요

활기 넘치는 도시 서울! 수많은 행사 속에서 내 마음에 쏙 드는 하나를 찾기란 쉽지 않죠. FindFest는 뮤직 페스티벌, 미술 전시회부터 전통 공연, 소소한 동네 축제까지, 서울의 모든 이벤트를 한곳에 모아 보여줍니다. 똑똑한 AI 챗봇이 당신의 기분과 취향, 일정에 맞춰 완벽한 이벤트를 찾아주니, 이제껏 경험하지 못한 즐거운 방법으로 새로운 이벤트를 발견해 보세요.

## ✨ 주요 기능

- **📅 종합 이벤트 정보:** 서울 열린 데이터 광장의 공공 데이터를 바탕으로 서울의 다양한 이벤트 정보를 제공합니다.
- **🤖 AI 챗봇 추천:** Upstage의 Solar LLM을 기반으로 한 AI 챗봇과 자유롭게 대화하며 나에게 꼭 맞는 이벤트를 추천받을 수 있습니다.
- **🔍 간편한 검색과 필터링:** 행사 종류, 날짜, 지역별 필터와 검색 기능으로 원하는 이벤트를 빠르게 찾아보세요.
- **❤️ '찜하기' 기능:** 마음에 드는 이벤트를 찜해서 나만의 위시리스트를 만들고 관리할 수 있습니다.
- **🔐 사용자 인증:** 간편하게 가입하고 로그인해서 '찜하기' 등 개인화된 기능을 이용해 보세요.
- **🔄 최신 정보 자동 업데이트:** 6시간마다 새로운 정보를 자동으로 가져와 언제나 최신 이벤트 소식을 확인할 수 있습니다.

## 🚀 주요 기술

FindFest는 아래와 같은 최신 기술을 바탕으로 안정적으로 동작합니다.

- **백엔드 (Backend):**
  - **프레임워크:** FastAPI (Python)
  - **데이터베이스:** PostgreSQL
  - **ORM:** SQLAlchemy
  - **AI & 언어 모델:** LangChain, Upstage Solar
- **프론트엔드 (Frontend):**
  - **프레임워크:** Next.js (React)
  - **언어:** TypeScript
  - **스타일링:** Tailwind CSS
- **배포 및 인프라 (DevOps):**
  - **컨테이너화:** Docker & Docker Compose

## 🏁 시작하기

FindFest를 로컬 환경에서 실행하는 방법은 크게 두 가지입니다. 전체 서비스를 한번에 실행하는 Docker 방식과, 개발을 위해 각 서비스를 따로 실행하는 수동 방식이 있습니다.

### 방법 1: Docker로 전체 서비스 실행 (권장)

가장 간편하게 전체 애플리케이션을 실행하는 방법입니다. Docker와 Docker Compose가 설치되어 있어야 합니다.

1.  **프로젝트 복제 (Clone):**
    ```bash
    git clone https://github.com/GDGoC-Team1/FindFest.git
    cd GDGoC-Team1-FindFest
    ```

2.  **환경 변수 설정:**
    백엔드 실행에 필요한 API 키와 데이터베이스 정보를 설정해야 합니다. `.env.example` 파일을 복사해서 `.env` 파일을 만드세요.
    ```bash
    cp .env.example .env
    ```
    이후 `.env` 파일을 열어 필요한 값들을 채워넣어야 합니다.

3.  **빌드 및 실행:**
    제공된 `Makefile`을 사용하면 편리합니다.
    ```bash
    # 모든 서비스의 Docker 이미지를 빌드합니다.
    make build

    # 백그라운드에서 전체 서비스를 실행합니다.
    make run
    ```

4.  **서비스 확인:**
    - **웹사이트:** 브라우저에서 `http://localhost:3000` 주소로 접속하세요.
    - **API 문서:** `http://localhost:8000/docs` 에서 백엔드 API 문서를 확인할 수 있습니다.

5.  **서비스 종료:**
    ```bash
    make stop
    ```

### 방법 2: 로컬 환경에서 수동으로 실행하기

프론트엔드나 백엔드 코드를 직접 수정하며 개발하고 싶을 때 사용하는 방법입니다.

**사전 준비:**
- **Node.js** (v22 이상) 와 **pnpm**
- **Python** (v3.10 이상) 과 **Poetry**
- 실행 중인 **PostgreSQL** 데이터베이스

---

#### 백엔드 (FastAPI)

1.  **디렉토리 이동:**
    `cd backend`

2.  **라이브러리 설치:**
    Poetry를 사용해 필요한 라이브러리를 설치합니다.
    ```bash
    pip install poetry
    poetry install
    ```

3.  **환경 변수 설정:**
    `backend` 폴더 안에 `.env` 파일을 만들고, 필요한 환경 변수들을 입력합니다. (루트 폴더의 `.env.example` 파일 참고)
    - `DATABASE_URL`: 로컬 PostgreSQL 데이터베이스 연결 정보
    - `JWT_SECRET_KEY`: 토큰 발급에 사용할 비밀 키 (e.g., `openssl rand -hex 32` 명령어로 생성)
    - `SEOUL_EVENT_API_KEY`: 서울 열린 데이터 광장에서 발급받은 API 키
    - `SOLAR_API_KEY`: Upstage Solar LLM 사용을 위한 API 키

4.  **개발 서버 실행:**
    ```bash
    # Poetry 가상 환경을 활성화합니다.
    poetry shell

    # FastAPI 개발 서버를 실행합니다.
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ```
    이제 `http://localhost:8000` 에서 백엔드 API가 실행됩니다.

---

#### 프론트엔드 (Next.js)

1.  **디렉토리 이동:**
    `cd frontend`

2.  **라이브러리 설치:**
    ```bash
    pnpm install
    ```

3.  **개발 서버 실행:**
    ```bash
    pnpm dev
    ```
    이제 `http://localhost:3000` 에서 프론트엔드 웹사이트가 실행됩니다.

4.  **백엔드 연동:**
    프론트엔드에서는 `/api`로 시작하는 모든 요청을 `http://localhost:8000` (백엔드)으로 전달하도록 설정되어 있습니다. 따라서 프론트엔드 실행 전에 백엔드 서버가 먼저 켜져 있어야 합니다.

---

FindFest와 함께 즐거운 축제 라이프를 즐겨보세요!
