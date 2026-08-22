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

# Start server (migrations run via app startup in main.py _run_db_setup()).
# --proxy-headers + --forwarded-allow-ips=* : behind Render's proxy, honor
# X-Forwarded-Proto so request.url.scheme is "https" — needed for HSTS to emit
# and for the Secure cookie/scheme checks to be correct.
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips="*"

EXPOSE 8000
