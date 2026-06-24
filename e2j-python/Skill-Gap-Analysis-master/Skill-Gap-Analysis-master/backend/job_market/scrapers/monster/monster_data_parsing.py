from datetime import datetime
import pandas as pd

def get_job_id(job):
    if 'id' in job:
        return job['id']
    elif 'jobId' in job:
        return job['jobId']
    else:
        return None

def get_job_title(job):
    if 'title' in job:
        return job['title']
    elif 'jobTitle' in job:
        return job['jobTitle']
    else:
        return None
    
def get_job_company(job):
    if 'companyName' in job:
        return job['companyName']
    elif 'company' in job:
        return job['company']
    else:
        return None
    
def get_job_location(job):
    location = [item['city'] for item in job['locations'] if 'city' in item]
    if location:
        location = location[0]
    else:
        location = [item['city'] for item in job['locations'] if 'city' in item]
        if location:
            location = location[0]
        else:
            location = None
    return location

def get_job_salary_bracket(job):
    min_sal = job['minimumSalary']
    lower_bound = min_sal.get('absoluteValue', None)

    max_sal  = job['maximumSalary']
    upper_bound = max_sal.get('absoluteValue', None)

    if lower_bound is not None and upper_bound is not None:
        if lower_bound is 0 and upper_bound is 0:
            return "Not Disclosed"
        return f"{lower_bound} - {upper_bound} {min_sal.get('currency', 'INR')}"
    elif lower_bound is None:
        return f"Up to {upper_bound} {max_sal.get('currency', 'INR')}"
    elif upper_bound is None:
        return f"From {lower_bound} {min_sal.get('currency', 'INR')}"
    else:
        return "Not Disclosed"

def get_job_experience(job):
    min_exp = job['minimumExperience']
    min_exp_time_unit = [item[0] for item in list(min_exp.items())]
    max_exp = job['maximumExperience']
    max_exp_time_unit = [item[0] for item in list(max_exp.items())]
    for time_unit in min_exp_time_unit:
        if time_unit in max_exp_time_unit:
            return f"{min_exp[time_unit]} - {max_exp[time_unit]} {time_unit}"
    return None

def get_posted_on(job):
    if 'createdAt' in job and job['createdAt'] is not None:
        def unix_to_date(unix_timestamp):
            try:
                # Handle both seconds and milliseconds timestamps
                if unix_timestamp > 1e10:  # Likely milliseconds
                    unix_timestamp = unix_timestamp / 1000
                return datetime.fromtimestamp(unix_timestamp).strftime('%Y-%m-%d')
            except (ValueError, OSError, OverflowError):
                return None
        return unix_to_date(job['createdAt'])
    else:
        return None

def get_job_description(job):
    if 'description' in job:
        return job['description']
    else:
        return None

def get_industry_type(job):
    if 'industries' in job:
        try:
            return ",".join(job['industries'])
        except TypeError:
            if isinstance(job['industries'], str):
                return job['industries']
        except:
            return None
    else:
        return None
    
def get_total_applicants(job):
    if 'totalApplicants' in job:
        return job['totalApplicants']
    else:
        return None

def get_employement_type(job):
    if 'employmentTypes' in job:
        return ",".join(job['employmentTypes'])
    else:
        return None

def get_desired_skills(job):
    all_skills = []
    if 'skills' in job:
        all_skills.extend([item['text'] for item in job['skills']])
    if 'itSkills' in job:
        all_skills.extend([item['text'] for item in job['itSkills']])
    
    return ",".join(all_skills) if all_skills else None

def convert_monster_data_to_compatible_format(jobs):
    """
    Converts the job data from Monster to a compatible format for further processing.
    
    Args:
        jobs (list): The job data from Monster.
        
    Returns:
        dict: A dictionary with the job data in a compatible format.
    """
    if not isinstance(jobs, list):
        raise ValueError("Jobs data must be a list.")
    
    data = []
    for job in jobs:
        row = {
    "job_id": get_job_id(job),
    "job_title":get_job_title(job),
    "company":get_job_company(job),
    "reviews":None,
    "location":get_job_location(job),
    "experience":get_job_experience(job),
    "salary":get_job_salary_bracket(job),
    "posted_on":get_posted_on(job),
    "openings":None,
    "applications":get_total_applicants(job),
    "role":get_job_title(job),
    "job_description":get_job_description(job),
    "industry_type":get_industry_type(job),
    "department":None,
    "employment_type":get_employement_type(job),
    "role_category":None,
    "education":None,
    "key_skills":get_desired_skills(job),
}
        data.append(row)

    return data