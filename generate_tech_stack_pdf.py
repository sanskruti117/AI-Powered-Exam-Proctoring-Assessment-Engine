import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def create_tech_stack_pdf(output_path="Tech_Stack_Breakdown_Exam_Proctoring_System.pdf"):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    PRIMARY = colors.HexColor("#1E1B4B")      # Deep Indigo
    ACCENT = colors.HexColor("#4F46E5")       # Vibrant Indigo
    SECONDARY = colors.HexColor("#312E81")    # Slate Indigo
    BG_LIGHT = colors.HexColor("#F8FAFC")     # Slate 50
    BORDER_COLOR = colors.HexColor("#E2E8F0") # Slate 200
    TEXT_DARK = colors.HexColor("#0F172A")    # Slate 900
    TEXT_MUTED = colors.HexColor("#475569")   # Slate 600
    HEADER_BG = colors.HexColor("#4338CA")    # Indigo 700

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=PRIMARY,
        alignment=0,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=TEXT_MUTED,
        spaceAfter=12
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=PRIMARY,
        spaceBefore=12,
        spaceAfter=6
    )

    th_style = ParagraphStyle(
        'TableHeader',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white
    )

    cell_bold = ParagraphStyle(
        'CellBold',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=TEXT_DARK
    )

    cell_tech = ParagraphStyle(
        'CellTech',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=ACCENT
    )

    cell_desc = ParagraphStyle(
        'CellDesc',
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=TEXT_MUTED
    )

    story = []

    # Title & Metadata
    story.append(Paragraph("AI-Powered Exam Proctoring & Assessment Engine", title_style))
    story.append(Paragraph("Architecture & Technical Stack Specification | Springboard Internship 2026", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT, spaceAfter=10))

    sections_data = [
        {
            "title": "1. Frontend Tier (UI & Client-Side Logic)",
            "rows": [
                ["Framework", "Next.js 14 (App Router)", "High-performance React framework with hybrid SSR/CSR architecture and routing."],
                ["Language & Core UI", "React 18 + TypeScript", "Type-safe, component-driven reactive user interface."],
                ["Styling & Theme", "Tailwind CSS v3 + PostCSS", "CyberHUD dark theme, ambient aurora animations, glassmorphism UI."],
                ["Iconography", "Lucide React", "Icons for controls, timers, dashboard stats, and violation badges."],
                ["Code Editor", "Monaco Editor (@monaco-editor/react)", "VS Code browser IDE engine with multi-language syntax highlighting & indentation."],
                ["Client AI Vision", "Google MediaPipe (@mediapipe/tasks-vision)", "Real-time client-side face landmarking, eye gaze, and head pose estimation."],
                ["Internationalization", "i18next + react-i18next", "Seamless multi-language switching across 6 global locales."],
                ["Validation & Auth", "Zod + jose + bcryptjs", "Schema validation, client-side cryptographic hashing, and JWT handling."],
                ["PWA & Offline", "Progressive Web App Architecture", "Service workers enabling offline resilience and connectivity recovery."]
            ]
        },
        {
            "title": "2. AI Proctoring & Computer Vision Pipeline",
            "rows": [
                ["Object Detection", "Ultralytics YOLOv8 (yolov8n.pt)", "Sub-15ms real-time detection of phones, tablets, laptops, books & earbuds."],
                ["Deep Face Tracking", "OpenCV YuNet (ONNX runtime)", "Lightweight deep neural network face detector for instant identity verification."],
                ["Cascade Face Tracker", "OpenCV Haar Cascades", "Multi-angle facial landmark verification fallback (frontal + profile XMLs)."],
                ["Gaze & Orientation", "MediaPipe Face Mesh", "Calculates eye gaze deviation and suspicious head turning in degrees."],
                ["Violation Engine", "Custom Proctor Vision (proctor_vision.py)", "Automated anomaly flags: Candidate Absence, Multi-Person, Device Detection, Tab Switch."]
            ]
        },
        {
            "title": "3. Generative AI & Automated Evaluation Engine",
            "rows": [
                ["LLM Core Engine", "Google Gemini AI (google-genai SDK)", "Intelligent question synthesis, subjective grading, and constructive feedback."],
                ["PDF Ingestion", "pypdf + Gemini Vision/Text", "Automated extraction of MCQs, coding prompts, & answer keys from PDF exam sheets."],
                ["Subjective Grading", "Semantic Evaluator (ai_evaluator.py)", "Rubric-grounded grading of descriptive answers with concept coverage scoring."],
                ["Translation Service", "Custom AI Translator (translator.py)", "Real-time multi-language translation of questions, options, and explanations."]
            ]
        },
        {
            "title": "4. Multi-Language Sandbox Code Execution Engine",
            "rows": [
                ["Supported Runtimes", "Python 3, JavaScript (Node.js), C, C++, Java", "Multi-language compilation and execution runner."],
                ["Execution Runner", "Subprocess Isolation (code_executor.py)", "Sandboxed child process execution per test case with strict resource boundaries."],
                ["Timeout Guard", "2.5s Strict Execution Limit", "Guards against infinite loops, excessive recursion, and Denial-of-Service code."],
                ["Verification", "Automated I/O Matcher", "Standard Input/Output comparison against public and hidden test cases."]
            ]
        },
        {
            "title": "5. Backend REST API & Business Logic Layer",
            "rows": [
                ["API Framework", "FastAPI (Python)", "High-throughput asynchronous REST API backend."],
                ["ASGI Server", "Uvicorn (Standard)", "Production ASGI server powering fast concurrent request dispatching."],
                ["Data Modeling", "Pydantic v2", "Strict serialization, request validation, and OpenAPI documentation schema."],
                ["Security & RBAC", "OAuth2 with JWT + Bcrypt", "Role-Based Access Control enforcing Student, Examiner, and Admin privileges."],
                ["Admin Console", "SQLAdmin", "Web administrative portal for direct entity monitoring and inspection."]
            ]
        },
        {
            "title": "6. Database & Persistent Storage Layer",
            "rows": [
                ["Database Engine", "SQLite (proctoring.db) / PostgreSQL", "Relational persistence for users, exams, submissions, logs, and questions."],
                ["ORM Layer", "SQLAlchemy 2.0", "Enterprise Object-Relational Mapper with declarative relational mappings."],
                ["Schema Migrations", "Alembic", "Automated, version-controlled database schema migrations."]
            ]
        }
    ]

    col_widths = [130, 180, 230]

    for section in sections_data:
        table_content = [[
            Paragraph("Domain / Component", th_style),
            Paragraph("Technology / Library", th_style),
            Paragraph("Purpose & Implementation", th_style)
        ]]

        for row in section["rows"]:
            table_content.append([
                Paragraph(row[0], cell_bold),
                Paragraph(row[1], cell_tech),
                Paragraph(row[2], cell_desc)
            ])

        t = Table(table_content, colWidths=col_widths, repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HEADER_BG),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [BG_LIGHT, colors.white]),
        ]))

        section_elements = [
            Paragraph(section["title"], section_heading),
            Spacer(1, 2),
            t,
            Spacer(1, 8)
        ]
        story.append(KeepTogether(section_elements))

    doc.build(story)
    print(f"PDF successfully generated at: {output_path}")

if __name__ == "__main__":
    create_tech_stack_pdf()
