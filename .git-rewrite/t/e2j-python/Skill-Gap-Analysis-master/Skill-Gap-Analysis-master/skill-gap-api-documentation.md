#  Skill Gap Analysis API Documentation

---

## **Overview**

This API lets users:
1. Get job suggestions for a field
2. Upload a resume for career analysis
3. Check analysis progress
4. Retrieve results

---

| Endpoint | Method | Purpose | Key Output |
|----------|--------|---------|------------|
| `/api/suggest-positions` | POST | Get 10 job titles | `suggestions[]` |
| `/api/analyze` | POST | Upload & queue analysis | `task_id` |
| `/api/status/{task_id}` | GET | Check progress | `status`, `progress` |
| `/api/result/{task_id}` | GET | Fetch final results | Analysis `result` object |


---

##  **Endpoints**

---

### 1️⃣ **Suggest Job Positions**

**POST** `/api/suggest-positions`

Get exactly 10 job position suggestions for a career field.

**Request Body:**
```json
{
  "field": "data science"
}
```

**Response (Success 200):**
```json
{
  "suggestions": [
    "Data Scientist",
    "Machine Learning Engineer",
    "Data Analyst",
    "Business Intelligence Analyst",
    "Data Engineer",
    "AI Research Scientist",
    "Data Science Manager",
    "Statistical Analyst",
    "Data Consultant",
    "Deep Learning Specialist"
  ]
}
```

**Response (Validation Error 400):**
```json
{
  "detail": "Field must be at least 3 characters"
}
```

**Notes:**
- Results are cached for 24 hours—same field returns quickly
- Returns exactly 10 positions or empty array if field too short

---

### 2️⃣ **Submit Analysis**

**POST** `/api/analyze`

Upload a resume and start career analysis. Returns a task ID to check progress.

**Form Data Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `job_designation` | string | yes | Target job role (e.g., "Software Engineer") |
| `analysis_mode` | string | yes | Analysis type (" Course Recommendation” only for now) |
| `num_sample_jobs` | integer | yes | Number of sample jobs to analyze (e.g., 10) |
| `resume_file` | file | yes | PDF/DOCX resume file |
| `curriculum_choice` | string | yes | Curriculum name (currently only "Computer Science", "Civil Engineering", "Mechanical Engineering", "Electrical Engineering") |

**Response (Success 200):**
```json
{
  "task_id": "abc123def456",
  "message": "Analysis started",
  "estimated_time": "2-5 minutes",
  "job_status": "queued",
  "queue_position": 3
}
```

**Response (Error 500):**
```json
{
  "detail": "Failed to start analysis: <error message>"
}
```

**Notes:**
- `task_id` is used in status/result endpoints
- `queue_position` shows your position in queue (0 = running)
- File is saved server-side with unique name

---

### 3️⃣ **Check Task Status**

**GET** `/api/status/{task_id}`

Poll this endpoint to see if analysis is complete.

**URL Parameter:**
- `task_id` (string) – from `/api/analyze` response

**Response (Success 200):**
```json
{
  "task_id": "abc123def456",
  "status": "processing",
  "progress": 45,
  "message": "Analyzing resume sections...",
  "updated_at": "2025-02-17T10:30:00.123456",
  "result_available": false,
  "error": null
}
```

**Status Values:**
- `queued` – waiting in queue
- `started` / `processing` – currently running
- `finished` – complete, ready for `/api/result`
- `failed` – error occurred (check `error` field)

**Response (Not Found 404):**
```json
{
  "detail": "Task not found: Job ... does not exist"
}
```

**Notes:**
- Poll every 3–5 seconds
- `progress` is 0–100 percentage
- `result_available` true only when status is `finished`

---

### 4️⃣ **Get Task Result**

**GET** `/api/result/{task_id}`

Retrieve the completed analysis results.

**URL Parameter:**
- `task_id` (string) – from `/api/analyze` response

**Response (Success 200):**
```json
{
  "skill_clusters_w_classification": {
    "Soft": { /* cluster_name: [ [skill, weight, is_core], ... ] */ },
    "Technical": { /* ... */ },
    "Knowledge": { /* ... */ }
  },
  "cluster_wise_course_recommendation": {
    "Soft": { /* cluster_name: { "courses": { ... } } */ },
    "Technical": { /* ... */ },
    "Knowledge": { /* ... */ }
  }
}
```


**Errors:**
- `400` if task not finished:
  ```json
  { "detail": "Task not completed. Status: processing" }
  ```
- `404` if result missing:
  ```json
  { "detail": "No result found" }
  ```
- `500` on server error

**Notes:**
- Results expire after 1 hour
- Call only when `result_available` is true from status endpoint

---
