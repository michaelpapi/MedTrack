FROM python:3.11

# Ensure Python prints logs immediately (unbuffered)
ENV PYTHONUNBUFFERED=1

# Install apt dependencies if needed (for FAISS, OpenSSL, etc.)
RUN apt-get update && apt-get install -y \
    build-essential \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first to allow Docker caching
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Now copy the entire project
COPY . .

# Expose FASTAPI port 
EXPOSE 8000

# Run server 
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
