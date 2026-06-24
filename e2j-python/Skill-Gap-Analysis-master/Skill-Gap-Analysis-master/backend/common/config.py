# config.py
import os
from pathlib import Path

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6380")
    
# API Configuration
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", 8000))

# Worker Configuration
WORKER_TIMEOUT = os.getenv("WORKER_TIMEOUT", "30m")
RESULT_TTL = int(os.getenv("RESULT_TTL", 3600))  # 1 hour

# File Storage
UPLOAD_DIR = Path("backend/common/uploads")
CURCLM_DIR = Path("backend/common/reference_docs/curriculum")
TEMP_DIR = Path("temp")

# Create directories
for dir_path in [UPLOAD_DIR, CURCLM_DIR, TEMP_DIR]:
    dir_path.mkdir(exist_ok=True)

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

FEATURES = ['direct_course_recommendation']