FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .

# Set environment variables
ENV PORT=8080
ENV GCP_PROJECT=${GCP_PROJECT}

# Run the application
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT}
