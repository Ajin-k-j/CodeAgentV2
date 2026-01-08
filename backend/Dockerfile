# Use official Python image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy service account for local run (ensure it's in .dockerignore if deploying to public repo)
COPY service_account.json .

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Command to run the application (Updated for new 'app' package)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
