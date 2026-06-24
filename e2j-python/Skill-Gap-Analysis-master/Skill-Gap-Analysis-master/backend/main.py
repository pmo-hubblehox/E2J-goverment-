# fastapi_backend.py
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
import uuid
from datetime import datetime
from pathlib import Path

# Import configuration and Redis connection
from backend.common.config import REDIS_URL, API_HOST, API_PORT, UPLOAD_DIR, CURCLM_DIR, LOG_LEVEL
from redis import Redis
from rq import Queue
import json

from pydantic import BaseModel

from haystack.dataclasses import ChatMessage

from backend.common.shared_variables import llm
from workers.tasks import run_analysis_task

import os
import certifi

# This forces requests to use the certified bundle inside your .venv
os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()
os.environ['CURL_CA_BUNDLE'] = certifi.where()

# Configure logging
logging.basicConfig(level=getattr(logging, LOG_LEVEL))
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="Career Recommendation API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ EXPLICIT Redis connection for RQ
logger.info(f"Using Redis URL: {REDIS_URL}")

redis_conn = Redis.from_url(
    REDIS_URL,
    decode_responses=False  # Critical: NO decode_responses for RQ!
)

# Test Redis connection
try:
    redis_conn.ping()
    logger.info("✅ Redis connection successful")
except Exception as e:
    logger.error(f"❌ Redis connection failed: {e}")
    raise

# Create RQ queue with explicit connection
task_queue = Queue(
    connection=redis_conn, 
    default_timeout='30m',
    default_result_ttl=3600  # Keep results for 1 hour
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "OK", 
        "message": "Career Recommendation API is running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    try:
        redis_conn.ping()
        worker_count = len([w for w in redis_conn.keys('rq:worker:*')])
        queue_size = len(task_queue)  # ✅ Added missing variable
        
        return {
            "status": "healthy", 
            "redis": "connected",
            "workers": worker_count,
            "queue_size": queue_size,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@app.get("/api/debug-redis")
async def debug_redis():
    """Debug Redis connection info"""
    try:
        info = redis_conn.info()
        return {
            "redis_version": info.get('redis_version'),
            "connected_clients": info.get('connected_clients'),
            "used_memory_human": info.get('used_memory_human'),
            "role": info.get('role'),
            "tcp_port": info.get('tcp_port'),
            "uptime_in_seconds": info.get('uptime_in_seconds')
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/analyze")
async def analyze_career(
    job_designation: str = Form(...),
    analysis_mode: str = Form(...),
    num_sample_jobs: int = Form(...),
    resume_file: UploadFile = File(...),
    curriculum_choice: str = Form(...),
    
):
    """Submit analysis request to backend"""
    try:
        # Generate unique task ID
        task_id = str(uuid.uuid4())  # ✅ Now uuid is imported
        logger.info(f"Starting analysis task {task_id} for {job_designation}")
        
        # Save uploaded files
        resume_path = UPLOAD_DIR / f"{task_id}_resume_{resume_file.filename}"
        curriculum_path = CURCLM_DIR / f"{curriculum_choice.replace(' ','_')}.pdf"
        
        with open(resume_path, "wb") as f:
            f.write(await resume_file.read())
        
        logger.info(f"File saved: {resume_path}")
        
        # Get current queue size for response
        queue_size = len(task_queue)  # ✅ Added missing variable
        
        # Enqueue job with explicit connection
        job = task_queue.enqueue(
            run_analysis_task,
            job_designation,
            str(resume_path),
            str(curriculum_path),
            num_sample_jobs,
            analysis_mode,
            job_id=task_id,
            result_ttl=3600  # Keep result for 1 hour
        )
        
        logger.info(f"Job enqueued successfully: {job.id}")
        
        return {
            "task_id": task_id,
            "message": "Analysis started",
            "estimated_time": "2-5 minutes",
            "job_status": job.get_status(),
            "queue_position": queue_size  # ✅ Now queue_size is defined
        }
        
    except Exception as e:
        logger.error(f"Failed to enqueue job: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start analysis: {str(e)}")

@app.get("/api/status/{task_id}")
async def get_task_status(task_id: str):
    """Get task status from backend"""
    try:
        from rq.job import Job
        
        job = Job.fetch(task_id, connection=redis_conn)
        status = job.get_status()
        
        # Get job metadata
        meta = job.meta if job.meta else {}
        
        return {
            "task_id": task_id,
            "status": status,
            "progress": meta.get('progress', 0),
            "message": meta.get('message', 'Processing...'),
            "updated_at": meta.get('updated_at', datetime.now().isoformat()),
            "error": meta.get('error'),
            "result_available": status == 'finished' and job.result is not None
        }
        
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Task not found: {str(e)}")

@app.get("/api/result/{task_id}")
async def get_task_result(task_id: str):
    """Get task result from backend"""
    try:
        from rq.job import Job
        
        job = Job.fetch(task_id, connection=redis_conn)
        status = job.get_status()
        
        if status != 'finished':
            raise HTTPException(status_code=400, detail=f"Task not completed. Status: {status}")
        
        result = job.result
        if result is None:
            # Try to get from metadata
            result = job.meta.get('result')
        
        if result is None:
            raise HTTPException(status_code=404, detail="No result found")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get result: {str(e)}")

@app.get("/api/worker-status")
async def get_worker_status():
    """Check RQ worker status"""
    try:
        from rq import Worker
        workers = Worker.all(connection=redis_conn)
        queue_size = len(task_queue)  # ✅ Added missing variable
        
        return {
            "workers_available": len(workers),
            "workers": [{"name": w.name, "state": w.get_state()} for w in workers],
            "queue_size": queue_size  # ✅ Now queue_size is defined
        }
    except Exception as e:
        return {
            "workers_available": 0,
            "error": str(e)
        }

class SuggestRequest(BaseModel):
    field: str

@app.post("/api/suggest-positions")
async def suggest_positions(request: SuggestRequest):
    """Suggest top 10 field positions based on input"""

    field = request.field

    if not field or len(field) < 3:
        return {"suggestions": []}
    
    # Check cache first
    cache_key = f"suggestions:{field.lower()}"
    cached = redis_conn.get(cache_key)
    if cached:
        return json.loads(cached)
    
    try:
        # LLM call

        llm.set_system_prompts([ChatMessage.from_system('Follow the user prompt word by word. Do not provide verbose explanations. Only required output.')])

        user_prompt = ChatMessage.from_user("Based on the field '{{field}}', suggest exactly 10 specific job positions or roles. Return only a JSON array of strings.")

        llm.add([user_prompt],
        datas={"field": field})

        results = await llm.async_run(include_outputs=['llm_generator', 'prompt_builder'])

        llm_text = results[0]['llm_generator']['replies'][0].text
        suggestions = json.loads(llm_text.strip('```json'))
        
        # Cache for 24 hours
        redis_conn.setex(cache_key, 86400, json.dumps({"suggestions": suggestions}))
        
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=API_HOST, port=API_PORT, log_level=LOG_LEVEL.lower())