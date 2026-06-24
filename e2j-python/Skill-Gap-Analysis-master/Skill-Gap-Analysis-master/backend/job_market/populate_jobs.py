import asyncio

import pandas as pd

from backend.job_market.jobs_client import Jobs
from backend.job_market.scrapers.monster.monster_scraper import run_monster_scraper_async

def prepare_dataframe_for_insertion(df):
    """
    Convert date strings to Python date objects and handle None values.
    
    Args:
        df: pandas DataFrame
        
    Returns:
        pandas DataFrame with converted date columns
    """
    df = df.copy()
    
    # Convert posted_on from string to date object
    if 'posted_on' in df.columns:
        df['posted_on'] = pd.to_datetime(df['posted_on'], errors='coerce').dt.date
    
    # Replace NaN with None for PostgreSQL NULL
    df = df.where(pd.notna(df), None)
    
    return df


async def main():
    # Initialize Jobs class
    jobs_db = await Jobs.create()
    
    try:
        # Get jobs data
        num_sample_jobs = 40
        designations = ['Data Scientist', 'Data Engineer', 'Civil Engineer', 
                       'Software Engineer', 'Electronics Engineer']
        
        # Run scrapers concurrently
        tasks = []
        for designation in designations:
            tasks.append(run_monster_scraper_async(num_sample_jobs, designation))
        
        results = await asyncio.gather(*tasks)
        
        # Process results
        all_jobs = []
        for designation, result in zip(designations, results):
            if isinstance(result, Exception):
                print(f"Failed to scrape {designation}: {result}")
            else:
                for item in result:
                    item['designation'] = designation
                print(f"Successfully scraped {designation}: {len(result)} jobs")
                all_jobs.extend(result)
        
        # Prepare and convert to list of dicts
        if all_jobs:
            df = pd.DataFrame(all_jobs)
            df_prepared = prepare_dataframe_for_insertion(df)
            
            # Convert DataFrame to list of dictionaries
            rows = df_prepared.to_dict('records')
            
            # Insert into database using Jobs class
            await jobs_db.insert_into_database(rows, "jobs_data")
            print(f"Successfully inserted {len(rows)} jobs into database")
        else:
            print("No jobs to insert")
            
    finally:
        # Clean up the connection pool
        await jobs_db.close()


if __name__ == "__main__":
    asyncio.run(main())
