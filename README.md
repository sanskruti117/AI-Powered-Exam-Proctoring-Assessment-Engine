# 🎓 AI-Powered Online Examination & Intelligent Proctoring Assessment Engine

An end-to-end intelligent exam proctoring and assessment platform featuring automated cheating detection, multi-role dashboards, question banks, AI evaluation using Google Gemini, and candidate performance analytics.

---

## 🚀 Key Features

### 👨‍🎓 1. Student Portal
- **Secure Exam Interface**: Fullscreen exam room with question timer, section navigation, and quick question jumping.
- **Granular Time Logging**: Tracks time spent per question to identify struggle areas or anomalies.
- **Results & Performance**: Breakdown of scores, answer comparisons, and instant feedback.

### 👩‍🏫 2. Examiner Portal
- **Exam Management**: Create exams with customizable sections, duration, passing criteria, and negative marking.
- **Question Bank**: Rich question builder supporting MCQs, multi-select, subjective, coding, and true/false questions with media attachments.
- **AI-Powered Evaluation**: Automated assessment and scoring of subjective candidate responses powered by Google Gemini.
- **Live Leaderboard & Analytics**: Track student submission metrics, score distributions, and violation logs.

### 🛡️ 3. Super Admin & Security
- **Examiner Approval Workflow**: New examiners require admin review before they can publish exams.
- **Proctoring Telemetry**: Logs suspicious activities like tab switches, window blurs, and abnormal events.
- **Visual Database Studio**: SQLAdmin dashboard integrated into the backend for convenient database administration.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | [Next.js 14](https://nextjs.org/) (App Router), [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/) |
| **Backend** | [FastAPI](https://fastapi.tiangolo.com/), [SQLAlchemy](https://www.sqlalchemy.org/), [Alembic](https://alembic.sqlalchemy.org/), [Pydantic v2](https://docs.pydantic.dev/), [SQLAdmin](https://aminalaee.dev/sqladmin/) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) (Local, Neon, Supabase, or Docker) |
| **AI / Evaluation** | [Google Gemini API](https://ai.google.dev/) |

---

## 📁 Project Structure

```
├── alembic/                # Database migrations
├── backend/
│   ├── routers/            # API route controllers (auth, exams, questions, admin)
│   ├── services/           # AI evaluator & business logic
│   ├── models.py           # SQLAlchemy ORM models
│   ├── schemas.py          # Pydantic request/response schemas
│   ├── seed.py             # Database seeder script
│   └── main.py             # FastAPI entrypoint & SQLAdmin config
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── (auth)/         # Login, Register (Student & Examiner)
│   │   └── (dashboard)/    # Admin, Examiner, and Student portals
│   ├── components/         # Reusable UI components & modals
│   └── middleware.ts       # Route protection & role guards
├── .env.example            # Environment variable template
├── requirements.txt        # Python dependencies
├── start-app.bat           # One-click Windows launch script
└── package.json
```

---

## ⚙️ Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **PostgreSQL Database** running locally or in the cloud (e.g. Supabase / Neon)

---

### 2. Clone the Repository & Configure Environment

```bash
git clone https://github.com/sanskruti117/AI-Powered-Exam-Proctoring-Assessment-Engine.git
cd AI-Powered-Exam-Proctoring-Assessment-Engine
```

Copy the example environment file:
```bash
cp .env.example .env
```

Update `.env` with your actual database and API credentials:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/exam_proctoring?schema=public"
JWT_SECRET="your_super_secret_jwt_key_at_least_32_chars_long"
ADMIN_EMAIL="admin@proctor.com"
ADMIN_PASSWORD="AdminSecurePass123!"
ADMIN_NAME="Super Administrator"
GEMINI_API_KEY="your_google_gemini_api_key"
```

---

### 3. Backend Setup

```bash
# Create and activate Python virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Seed initial admin and demo data
python -m backend.seed

# Start FastAPI server
uvicorn backend.main:app --reload --port 8000
```

- **API Documentation (Swagger UI)**: `http://127.0.0.1:8000/docs`
- **Database Studio**: `http://127.0.0.1:8000/admin`

---

### 4. Frontend Setup

In a new terminal:
```bash
# Install frontend packages
npm install

# Start Next.js development server
npm run dev
```
- **Web Application**: `http://localhost:3000`

---

### ⚡ Windows One-Click Launcher

If you are on Windows, simply double-click **`start-app.bat`** to start both the FastAPI backend and Next.js frontend concurrently!

---

## 🔑 Default Test Accounts

After running the database seed script:
- **Admin**: `admin@proctor.com` / `AdminSecurePass123!`

---

## 📄 License
This project is licensed under the MIT License.
