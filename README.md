# 🎓 AI-Powered Intelligent Examination Platform & Automated Proctoring Engine

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?style=flat&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=flat&logo=python)](https://python.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-orange?style=flat)](https://ultralytics.com)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Generative%20AI-8E75B2?style=flat&logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An enterprise-grade, end-to-end intelligent examination and automated proctoring platform. Features deep-learning cheating detection, real-time computer vision (YOLOv8, OpenCV, MediaPipe), Google Gemini AI automated evaluation, in-browser Monaco IDE with multi-language code execution sandboxes, multilingual support across 6 locales, and comprehensive performance analytics.

---

## 🌟 Key Features

### 👁️ 1. Intelligent AI Proctoring & Computer Vision
- **Prohibited Object & Device Detection**: Real-time camera stream analysis using **Ultralytics YOLOv8** to catch cell phones, tablets, laptops, books, and unauthorized secondary screens.
- **Deep Face Verification & Tracking**: Uses **OpenCV YuNet** (ONNX) and **Haar Cascades** for fast, high-accuracy facial verification.
- **Gaze & Head Pose Tracking**: In-browser **Google MediaPipe Face Mesh** detects head turns, looking away, or abnormal eye movements.
- **Cheating Anomaly Triggers**: Automatically flags **Candidate Absence**, **Multiple Persons in Camera**, **Tab Switching**, and **Fullscreen Exits**.

### 💻 2. Multi-Language Sandbox Code Assessment
- **Monaco Code Editor**: Fully featured VS Code browser editor with syntax highlighting, autocomplete, and indentation.
- **Multi-Language Runtimes**: Supports **Python 3, JavaScript (Node.js), C (GCC), C++ (G++), and Java (JVM)**.
- **Secure Sandbox Execution**: Automated test-case verification against standard I/O with strict **2.5-second execution limits** to prevent infinite loops.

### 🧠 3. Generative AI Question Synthesis & Evaluation
- **AI-Powered Subjective Grading**: Google Gemini AI grades candidate essays/theory answers against rubrics with marks breakdowns, key concept coverage %, and constructive suggestions.
- **PDF Question Bank Extractor**: Automatically parses uploaded PDF exam papers with `pypdf` and extracts MCQs, coding challenges, and theory questions along with answer keys.
- **Multilingual Support (i18n)**: Real-time UI & question translation across 6 languages via `react-i18next`.

### 👨‍🎓 4. Student Portal & Exam Environment
- **Secure Exam Room**: Fullscreen locked workspace with section timers, question jump palette, and real-time proctoring indicators.
- **Granular Telemetry**: Records per-question time allocation to detect struggle points and timing anomalies.
- **Instant Result Breakdowns**: Clear visual scorecards, performance metrics, and question-by-question analysis.

### 👩‍🏫 5. Examiner & Administrator Workflows
- **Comprehensive Exam Builder**: Create custom exams with multiple sections, negative marking, passing criteria, and customizable proctoring strictness.
- **Rich Question Management**: Supports Multiple Choice (Single/Multi-select), Coding Sandbox, True/False, and Subjective questions with media attachments.
- **Examiner Approval Gate**: Admin verification workflow before newly registered examiners can publish exams.
- **Visual Database Studio**: Integrated **SQLAdmin** dashboard for database administration.

---

## 🛠️ Complete Tech Stack Breakdown

| Tier / Subsystem | Technologies Used | Key Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14** (App Router), **React 18**, **TypeScript** | Hybrid Server/Client components, dynamic routing, type safety. |
| **Styling & Design** | **Tailwind CSS v3**, **PostCSS**, **Lucide React** | CyberHUD dark theme, ambient aurora animations, glassmorphism UI. |
| **Coding IDE** | **Monaco Editor** (`@monaco-editor/react`) | In-browser VS Code engine for coding assessments. |
| **Client Vision** | **MediaPipe** (`@mediapipe/tasks-vision`) | Real-time face landmarking and gaze tracking in browser. |
| **Multilingual** | **i18next**, **react-i18next** | Internationalization across 6 locales. |
| **Validation & Security** | **Zod**, **jose**, **bcryptjs** | Client validation, JWT handling, and cryptography. |
| **AI Proctoring Engine** | **Ultralytics YOLOv8**, **OpenCV YuNet**, **Haar Cascades** | Object/device detection, face verification, and multi-person anomaly tracking. |
| **Generative AI** | **Google Gemini AI** (`google-genai` SDK), **pypdf** | PDF question ingestion, subjective grading, constructive feedback. |
| **Code Execution Sandbox** | **Python Subprocess Engine** | Isolated execution for Python, JS, C, C++, and Java with timeout protection. |
| **Backend REST API** | **FastAPI**, **Uvicorn**, **Pydantic v2** | High-performance asynchronous API, schema serialization. |
| **Database & ORM** | **SQLAlchemy 2.0**, **Alembic**, **SQLite** / **PostgreSQL** | Relational persistence, automated migrations, and schema management. |
| **Admin Console** | **SQLAdmin** | Web database management console. |

---

## 📁 Repository Structure

```
├── alembic/                # Database version migrations
├── backend/
│   ├── models/             # Neural network weights (YuNet, cascades)
│   ├── routers/            # FastAPI route controllers (auth, exams, questions, admin)
│   ├── services/           # AI evaluator, vision proctor, code executor, translator
│   │   ├── ai_evaluator.py     # Gemini AI subjective grading & PDF extraction
│   │   ├── code_executor.py    # Multi-language sandbox execution runner
│   │   ├── proctor_vision.py   # YOLOv8 & OpenCV proctoring anomaly pipeline
│   │   └── translator.py       # Multilingual translation service
│   ├── models.py           # SQLAlchemy database entities
│   ├── schemas.py          # Pydantic data schemas & validators
│   ├── seed.py             # Database seeder script
│   └── main.py             # FastAPI application entrypoint & SQLAdmin config
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── (auth)/         # Student & Examiner Login / Registration
│   │   └── (dashboard)/    # Student, Examiner, and Admin portals
│   ├── components/         # CyberHUD, QuestionForm, Monaco editor, modals, visualizers
│   └── middleware.ts       # Route guards & RBAC authorization
├── public/                 # Static assets & icons
├── .env.example            # Environment configuration template
├── package.json            # Node.js frontend dependencies
├── requirements.txt        # Python backend dependencies
└── start-app.bat           # One-click Windows launch script
```

---

## ⚙️ Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **C/C++/Java compilers** (Optional, if running local C/C++/Java code execution)

---

### 2. Clone & Configure Environment

```bash
git clone https://github.com/sanskruti117/AI-Powered-Exam-Proctoring-Assessment-Engine.git
cd AI-Powered-Exam-Proctoring-Assessment-Engine
```

Copy the example environment file:
```bash
cp .env.example .env
```

Set your configuration keys in `.env`:
```env
DATABASE_URL="sqlite:///./backend/proctoring.db"
JWT_SECRET="your_super_secret_jwt_key_at_least_32_chars_long"
ADMIN_EMAIL="admin@proctor.com"
ADMIN_PASSWORD="AdminSecurePass123!"
ADMIN_NAME="Super Administrator"
GEMINI_API_KEY="your_google_gemini_api_key"
```

---

### 3. Backend Setup

```bash
# 1. Create and activate virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Apply database migrations
alembic upgrade head

# 4. Seed initial accounts and demo exams
python -m backend.seed

# 5. Start FastAPI server
uvicorn backend.main:app --reload --port 8000
```

- **Swagger API Docs**: `http://127.0.0.1:8000/docs`
- **Database Studio**: `http://127.0.0.1:8000/admin`

---

### 4. Frontend Setup

In a new terminal:
```bash
# Install packages
npm install

# Start development server
npm run dev
```

- **Web Application**: `http://localhost:3000`

---

### ⚡ Windows One-Click Launcher

On Windows, double-click **`start-app.bat`** to start both the FastAPI backend and Next.js frontend concurrently!

---

## 🔑 Default Credentials (After Seeding)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@proctor.com` | `AdminSecurePass123!` |
| **Demo Examiner** | `examiner@proctor.com` | `ExaminerPass123!` |
| **Demo Student** | `student@proctor.com` | `StudentPass123!` |

---

## 📄 License
This project is open-source software licensed under the [MIT License](LICENSE).
