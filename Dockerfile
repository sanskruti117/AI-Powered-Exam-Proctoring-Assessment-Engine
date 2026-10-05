# Base image
FROM python:3.11-slim

# Set environment variables for minimal memory usage and instant reclamation
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    MALLOC_TRIM_THRESHOLD_=100000 \
    OMP_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    PORT=8000

# Install system dependencies required for OpenCV, PostgreSQL, and media processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    ffmpeg \
    libsm6 \
    libxext6 \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency definition and install Python packages
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend codebase and database migration files
COPY backend/ ./backend/
COPY alembic/ ./alembic/
COPY alembic.ini .

# Expose the default port
EXPOSE 8000

# Start FastAPI using uvicorn (respecting $PORT provided dynamically by cloud hosts)
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
