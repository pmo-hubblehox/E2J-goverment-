import os
import json
import re
import time
from pathlib import Path
from datetime import datetime
from rq import get_current_job
import asyncio
import pandas as pd

# Import your actual pipeline and service functions

from backend.skill_gap_analysis.llm_operations.llm_tasks import jd_to_key_skills

from backend.skill_gap_analysis.pipeline import skill_gap_analysis_async

from backend.job_market.jobs_client import Jobs

def update_task_progress(task, progress: int, message: str):
    task.meta['progress'] = progress
    task.meta['message'] = message
    task.meta['updated_at'] = datetime.now().isoformat()
    task.save()

async def run_analysis_task(job_designation: str, resume_path: str, curriculum_path: str, 
                     num_sample_jobs: int, analysis_mode: str):
    task = get_current_job()
    try:
        # Step 1: Initialize webdriver (if needed)
        update_task_progress(task, 10, "Initializing web driver...")

        # Step 2: Scrape job data
        update_task_progress(task, 25, f"Studying Market Trends...")

        #Get jobs from jobs DB (PostgresSQL)
        jobs_data = {}
        jobs_db = await Jobs.create()
        try:
            jobs_data = await jobs_db.query_from_database(
                designation=job_designation, 
                limit=num_sample_jobs
            )
        finally:
            await jobs_db.close()

        scraped_jobs_df = pd.DataFrame(jobs_data)

        # Step 3: Extract skills from job descriptions
        update_task_progress(task, 40, "Extracting key skills from job descriptions...")
        
        scraped_jobs_df = await jd_to_key_skills(scraped_jobs_df)

        # Step 4: Skill gap analysis
        update_task_progress(task, 60, "Analyzing skill gaps and generating recommendations...")
        result = await skill_gap_analysis_async(
            scraped_jobs=scraped_jobs_df,
            curriculum_path=curriculum_path,
            cv_path=resume_path,
            designation=job_designation
        )

        # Step 5: Load and process results
        update_task_progress(task, 80, "Processing results...")
        
        # (Optionally add extra processing for curriculum mode as in your old app)
        if analysis_mode == "Curriculum Recommendation":
            recommendations = result.get('curriculum_recommendations', {})
            for skill_type in recommendations:
                for cluster_name, cluster_data in recommendations.get(skill_type, {}).items():
                    llm_text = cluster_data.get('llm_recommendation', '')
                    # Parse ORIGINAL SECTION, REVISED SECTION, EXPLANATION if present
                    if isinstance(llm_text, str):
                        # You may need to adapt regex/group parsing here
                        match = re.search(
                            r'ORIGINAL SECTION:(.*?)REVISED SECTION:(.*?)EXPLANATION:(.*)',
                            llm_text,
                            re.DOTALL
                        )
                        if match:
                            original, revised, explanation = match.groups()
                            result['curriculum_recommendations'][skill_type][cluster_name]["llm_recommendation"] = {
                                "Original Section": original.strip(),
                                "Revised Section": revised.strip(),
                                "Explanation": explanation.strip()
                            }


        update_task_progress(task, 100, "Analysis complete!")
        task.meta['status'] = 'completed'
        task.meta['result'] = result
        task.save()

        # Cleanup resources
        try:
            os.unlink(resume_path)
        except Exception:
            pass
        return result

    except Exception as e:
        update_task_progress(task, 0, "Analysis failed")
        task.meta['status'] = 'failed'
        task.meta['error'] = str(e)
        task.save()
        try:
            os.unlink(resume_path)
            # os.unlink(curriculum_path)
        except Exception:
            pass
        raise
