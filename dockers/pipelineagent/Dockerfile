FROM python:3.11

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libpq-dev \
    cron \
    && rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /app

# Set permissions for /app directory
RUN chmod -R 777 /app

# Install uv
RUN pip install uv==0.6.11

# Copy requirements file
COPY requirements.txt .


# Install Python dependencies
RUN uv pip install --no-cache-dir -r requirements.txt --system

# Copy execution service and utilities
COPY execution_service.py .
COPY utils/ ./utils/

# Create necessary directories
RUN mkdir -p /data/pipelines /data/results /var/log /data/cron

# Set permissions
RUN chmod -R 755 /app /data

# Expose port for API
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Command to run the service
CMD ["python", "execution_service.py"]