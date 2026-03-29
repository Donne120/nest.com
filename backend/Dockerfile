FROM python:3.12-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Create data dirs
RUN mkdir -p /app/data /app/uploads

# Start server (run migrations first, then seed scripts manually: docker exec -it <container> python seed_ai_ethics_course.py)
CMD alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}

EXPOSE 8000
