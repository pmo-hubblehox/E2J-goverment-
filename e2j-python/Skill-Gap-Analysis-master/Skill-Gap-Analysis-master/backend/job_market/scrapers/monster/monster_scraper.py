import os
import requests
import json
import html2text
from backend.job_market.scrapers.monster.monster_data_parsing import *
from dotenv import load_dotenv
import base64
import asyncio
import aiohttp
import pandas as pd

load_dotenv()

# ----------- JSON Extraction Utilities -----------

def find_json_end(s):
    """
    Finds the likely end index of a valid JSON substring in s.
    """
    openers = {'{': '}', '[': ']'}
    stack = []
    for i, c in enumerate(s):
        if c in openers:
            stack.append(openers[c])
        elif c in openers.values():
            if stack: stack.pop()
            if not stack:
                return i+1
    return None

def extract_valid_json(s):
    """
    Extract the first valid JSON object from the string s.
    """
    end = find_json_end(s)
    if end:
        try:
            return json.loads(s[:end])
        except Exception:
            pass
    return None

def extract_section(json_string):
    """
    Extracts the JSON section from the HTML+JS string.
    """
    def extract_json(raw_text, start):
        # Find all closing braces after start position
        end_positions = [i for i, char in enumerate(raw_text[start:], start) if char == '}']
        
        # Try from longest to shortest substring
        for end in reversed(end_positions):
            try:
                valid_json = json.loads('{' + raw_text[start-1:end+1])
                return valid_json
            except json.JSONDecodeError:
                continue
        
        return None  # No valid JSON found
    
    start = json_string.find("jobSearchAPIData")
    json_dict = extract_json(json_string,start)
    return json_dict if json_dict else {}

# ----------- HTML and Description Extraction -----------

def html_to_markdown(html_string):
    """
    Converts HTML content to Markdown.
    """
    h = html2text.HTML2Text()
    h.ignore_links = False
    h.ignore_images = False
    h.body_width = 0
    return h.handle(html_string)

def extract_desc_id(item):
    try:
        return item[item.find('"')+1:item.find(':')]
    except:
        return "Error"

def extract_desc_content(item):
    try:
        start = item.find("<")
        end = item.find("<button")
        if start == -1:
            start = 0
        if end == -1:
            end = len(item)
        desc_content = item[start:end]
    except:
        desc_content = ""
    return html_to_markdown(desc_content)

def get_job_descriptions(decoded_string):
    """
    Extracts descriptions for job IDs from the decoded string.
    Returns a dictionary mapping IDs to markdown descriptions.
    """
    strings = decoded_string.replace(',"])</script><script>self.__next_f.push(',',"])').split("<script>self.__next_f.push(")
    relevant_strings = [item for item in strings if item and len(item) > 6 and item[6] == ':']
    return {extract_desc_id(item): extract_desc_content(item) for item in relevant_strings}

# ----------- Job Data Utilities -----------

def add_job_descriptions(job_api_data, jd_dict):
    """
    Replace job description references with full text if available.
    """
    job_api_data_w_desc = []
    for item in job_api_data:
        desc_id = item.get('description', '').strip("$")
        if len(desc_id) > 10:  # Heuristic: unchanged, keep as is
            job_api_data_w_desc.append(item)
        else:
            if desc_id in jd_dict:
                item['description'] = jd_dict[desc_id]
                job_api_data_w_desc.append(item)
            # else: skip jobs with no description found
    return job_api_data_w_desc

def deduplicate_by_id(data_list):
    """
    Deduplicates a list of dicts based on their 'id' key (keeping first occurrence).
    """
    seen_ids = set()
    deduped = []
    for item in data_list:
        if 'id' in item and item['id'] not in seen_ids:
            seen_ids.add(item['id'])
            deduped.append(item)
    return deduped

def remove_no_desc_jobs(data_list):
    """
    Removes jobs that do not have a description.
    """
    return [item for item in data_list if 'description' in item and len(item['description']) > 10]


# ----------- Scraping Pipeline -----------

async def fetch_and_parse_jobs_async(query, pg_no=1):
    """
    Async version: Fetches job postings and parses/cleans them based on the provided query.
    Returns deduplicated list of job dicts with descriptions extracted.
    """
    query = query.replace(' ', '-').lower()

    payload = {
        'url': f'https://www.foundit.in/search/{query}-jobs-{pg_no}',
        "httpResponseBody": True,
        "followRedirect": True
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://api.zyte.com/v1/extract",
            auth=aiohttp.BasicAuth(os.getenv("ZYTE_API_KEY"), ""),
            json=payload,
            timeout=aiohttp.ClientTimeout(total=60)
        ) as response:
            response_json = await response.json()
    
    data_string = response_json['httpResponseBody']
    decoded_string = base64.b64decode(data_string).decode('unicode_escape')
    result_dict = extract_section(decoded_string)
    jd_dict = get_job_descriptions(decoded_string)

    # These paths may differ depending on foundit.in's page structure
    job_api_data_no_desc = result_dict['jobSearchAPIData']['data']
    seo_top_strip_no_desc = result_dict['layoutObject']['MODULE_SEO_MSITE_JOB_TOP_STRIP_SKILL_JOBS'][0]['data']['data']
    seo_similar_no_desc = result_dict['layoutObject']['MODULE_SEO_MSITE_SIMILAR_SKILL_JOBS'][0]['data']['parentData']['data']
    seo_top_locs_no_desc = result_dict['layoutObject']['MODULE_MSITE_SEO_JOBS_IN_TOP_LOCATIONS'][0]['data']['data']
    seo_above_footer_no_desc = result_dict['layoutObject']['MODULE_SEO_MSITE_SEARCH_ABOVE_FOOTER_LINKS'][0]['data']['data']

    job_api_data_w_desc = add_job_descriptions(job_api_data_no_desc, jd_dict)
    seo_top_strip_w_desc = add_job_descriptions(seo_top_strip_no_desc, jd_dict)
    seo_similar_w_desc = add_job_descriptions(seo_similar_no_desc, jd_dict)
    seo_top_locs_w_desc = add_job_descriptions(seo_top_locs_no_desc, jd_dict)
    seo_above_footer_w_desc = add_job_descriptions(seo_above_footer_no_desc, jd_dict)

    all_job_data = (
        job_api_data_w_desc
        + seo_top_strip_w_desc
        + seo_similar_w_desc
        + seo_top_locs_w_desc
        + seo_above_footer_w_desc
    )
    all_job_data_deduped = deduplicate_by_id(all_job_data)
    all_job_data_deduped = remove_no_desc_jobs(all_job_data_deduped)
    return all_job_data_deduped


async def run_monster_scraper_async(num_of_sample_job: int, job_query: str, save_csv: bool = False):
    """
    Async version of the Monster job scraper.
    """

    print(f"Scraping {job_query} jobs from Monster...")

    collected_jobs = []
    pg_no = 1
    max_retries = 3
    exception = None

    while len(collected_jobs) < num_of_sample_job:
        print(f"Extracting Monster data for pg_no:{pg_no}")
        retry_count = 0
        success = False

        while retry_count < max_retries and not success:
            try:
                clean_job_data = await fetch_and_parse_jobs_async(
                    f"{job_query}-{pg_no}", 
                    pg_no=pg_no
                )
                collected_jobs.extend(clean_job_data)
                success = True
            except Exception as e:
                exception = str(e)
                retry_count += 1
                print(f"Attempt {retry_count} failed for page {pg_no}: {str(e)}")

                if retry_count < max_retries:
                    print(f"Retrying... ({retry_count}/{max_retries})")
                    await asyncio.sleep(2)  # Wait 2 seconds before retry
        
        # If all retries failed, raise the last exception
        if not success:
            print(f"Failed to scrape page {pg_no} after {max_retries} attempts.")
            raise Exception(f"Scraping failed for page {pg_no} after {max_retries} attempts. Error: {exception}")
        
        pg_no += 1

    collected_jobs = collected_jobs[:num_of_sample_job]

    print("Finished scraping Monster jobs.")

    if collected_jobs:
        monster_compatible_dict = convert_monster_data_to_compatible_format(collected_jobs)
        
        print(f"Collected {len(collected_jobs)} jobs for {job_query}")

        if save_csv:
            monster_df = pd.DataFrame(monster_compatible_dict)
            monster_df.to_csv('Scraped_Job_Data_Monster.csv', index=False, encoding='utf-8')
            print('and saved to Scraped_Job_Data_Monster.csv')

        return monster_compatible_dict
    else:   
        print("No jobs found from Monster or an error occurred during scraping.")
        return {}
    

if __name__ == '__main__':
    import asyncio
    results = asyncio.run(run_monster_scraper_async(5,"Data Science",True))
    print('test')