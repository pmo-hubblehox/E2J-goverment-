import uvicorn
from backend.main import app
from backend.common.config import API_HOST,API_PORT,LOG_LEVEL

uvicorn.run(app, host=API_HOST, port=API_PORT, log_level=LOG_LEVEL.lower())