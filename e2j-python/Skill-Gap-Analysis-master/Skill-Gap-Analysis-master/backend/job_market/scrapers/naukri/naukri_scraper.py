from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import time
import csv
import re

# Global driver variable
driver = None

def initialize_driver():
    """Initialize and return the Chrome WebDriver"""
    global driver
    if driver is not None:
        return driver
        
    # Configure Chrome for headless operation with user-agent
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--log-level=3")
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")

    # Initialize the WebDriver with Service and Options
    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=chrome_options
    )
    return driver
 
# List to store job data
job_data_list = []
global_job_id = 1
 
def get_text(xpath):
    try:
        element = driver.find_element(By.XPATH, xpath)
        return element.text.strip()
    except:
        return "NA"
 
def get_html(xpath):
    try:
        element = driver.find_element(By.XPATH, xpath)
        return element.get_attribute('innerHTML')
    except:
        return "NA"
 
def extract_company_and_reviews(company_text):
    reviews = "NA"
    match = re.search(r'(\d+\.\d+)\s*Reviews', company_text)
    if match:
        reviews = match.group(1)
        company_text = company_text.replace(match.group(0), "").strip()
    return company_text, reviews
 
def clean_key_skills(key_skills_html):
    try:
        soup = BeautifulSoup(key_skills_html, 'html.parser')
        spans = soup.find_all('span')
        return ', '.join(span.get_text(strip=True) for span in spans)
    except:
        return "NA"
 
def clean_education(education_text):
    return education_text.replace("Education", "").strip()
 
def get_elements(xpath):
    return driver.find_elements(By.XPATH, xpath)
 
def extract_job_details(job_element, job_uid):
    global global_job_id
    try:
        job_url = job_element.find_element(By.TAG_NAME, 'a').get_attribute('href')
        driver.execute_script("window.open(arguments[0], '_blank');", job_url)
        driver.switch_to.window(driver.window_handles[-1])
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'styles_job-header-container___0wLZ')))
 
        job_title_text = get_text("//h1[contains(@class, 'styles_jd-header-title__rZwM1')]")
        company_text_raw = get_text("//div[contains(@class, 'styles_jd-header-comp-name__MvqAI')]")
        company_text, reviews_text = extract_company_and_reviews(company_text_raw)
        location_text = get_text("//div[contains(@class, 'styles_jhc__loc___Du2H')]")
        experience_text = get_text("//div[contains(@class, 'styles_jhc__exp__k_giM')]")
        salary_text = get_text("//div[contains(@class, 'styles_jhc__salary__jdfEC')]")
        job_description = get_text("//*[contains(@class, 'styles_JDC__dang-inner-html__h0K4t')]")
 
        job_details_parent_xpath = "//div[contains(@class, 'styles_jhc__jd-stats__KrId0')]"
        posted_on_text = get_text(f"{job_details_parent_xpath}//span[normalize-space(label)='Posted:']/span")
        openings_text = get_text(f"{job_details_parent_xpath}//span[normalize-space(label)='Openings:']/span")
        applications_text = get_text(f"{job_details_parent_xpath}//span[normalize-space(label)='Applicants:']/span")
 
        other_details_parent_xpath = "//div[contains(@class, 'styles_other-details__oEN4O')]"
        role_text = get_text(f"{other_details_parent_xpath}//div[contains(label, 'Role:')]/span")
        industry_type_text = get_text(f"{other_details_parent_xpath}//div[contains(label, 'Industry Type:')]/span")
        department_text = get_text(f"{other_details_parent_xpath}//div[contains(label, 'Department:')]/span")
        employment_type_text = get_text(f"{other_details_parent_xpath}//div[contains(label, 'Employment Type:')]/span")
        role_category_text = get_text(f"{other_details_parent_xpath}//div[contains(label, 'Role Category:')]/span")
 
        education_text_raw = get_text("//div[contains(@class, 'styles_education__KXFkO')]")
        education_text = clean_education(education_text_raw)
 
        key_skills_html = get_html("//div[contains(@class, 'styles_key-skill__GIPn_')]")
        key_skills_text = clean_key_skills(key_skills_html)
 
        job_data_list.append({
            "Job ID": job_uid,
            "Job Title": job_title_text,
            "Company": company_text,
            "Reviews": reviews_text,
            "Location": location_text,
            "Experience": experience_text,
            "Salary": salary_text,
            "Posted On": posted_on_text,
            "Openings": openings_text,
            "Applications": applications_text,
            "Job Description": job_description,
            "Role": role_text,
            "Industry Type": industry_type_text,
            "Department": department_text,
            "Employment Type": employment_type_text,
            "Role Category": role_category_text,
            "Education": education_text,
            "Key Skills": key_skills_text,
        })
 
        global_job_id += 1
        driver.close()
        driver.switch_to.window(driver.window_handles[0])
 
    except Exception as e:
        print(f"Error processing job {global_job_id}: {e}")
        if len(driver.window_handles) > 1:
            driver.close()
            driver.switch_to.window(driver.window_handles[0])
 
def scrape_jobs_from_category(uid, url, job_count):
    page_number = 1
    total_jobs_collected = 0
 
    while total_jobs_collected < job_count:
        print(f"Scraping page {page_number}...")
 
        current_url = url if page_number == 1 else f"{url.rstrip('-')}-{page_number}"
        driver.get(current_url)
        driver.save_screenshot(f"debug_page_{page_number}.png")  # Debug screenshot
 
        try:
            WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((By.CLASS_NAME, "srp-jobtuple-wrapper"))
            )
        except Exception as e:
            print(f"Timeout waiting for job listings on page {page_number}.")
            break
 
        job_list = driver.find_elements(By.CLASS_NAME, "srp-jobtuple-wrapper")
        if not job_list:
            print("No more jobs found or page not loaded correctly.")
            break
 
        for i in range(len(job_list)):
            if total_jobs_collected >= job_count:
                break
            try:
                extract_job_details(job_list[i], uid)
                total_jobs_collected += 1
                time.sleep(2)
            except Exception as e:
                print(f"Error processing job element {total_jobs_collected + 1}: {e}")
 
        if total_jobs_collected < job_count:
            page_number += 1
            time.sleep(3)
 
def run_naukri_scraper(num_of_sample_job: int, job_categories: dict):
    # Job categories and URLs
    # job_categories = {
    #     "Software Engineer": ["001", "https://www.naukri.com/software-engineer-jobs"]
    # }
    # num_of_sample_job = 10
    
    # Initialize the driver if not already initialized
    global driver
    if driver is None:
        driver = initialize_driver()
    
    # Scrape jobs from each category
    for category, url in job_categories.items():
        print(f"Scraping {category} jobs from Naukri...")
        scrape_jobs_from_category(url[0], url[1], num_of_sample_job)
        print(f"Finished scraping {category} jobs from Naukri.")
    
    return job_data_list

    # # Save to CSV
    # try:
    #     with open('Scraped_Job_Data_Naukri.csv', 'w', newline='', encoding='utf-8') as csvfile:
    #         fieldnames = [
    #             "Job ID", "Job Title", "Company", "Reviews", "Location", "Experience", "Salary",
    #             "Posted On", "Openings", "Applications", "Role", "Job Description",
    #             "Industry Type", "Department", "Employment Type", "Role Category",
    #             "Education", "Key Skills"
    #         ]
    #         writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    #         writer.writeheader()
    #         for job_data in job_data_list:
    #             writer.writerow(job_data)
    # finally:
    #     csvfile.close()
    
def close_driver():
    """Close the webdriver if it's open"""
    global driver
    if driver is not None:
        driver.quit()
        driver = None

if __name__ == "__main__":
    def generate_job_info(job_titles):
        job_data = {}
        job_id = 101  # Start job ID from 101

        for title in job_titles:
            formatted_title = title.lower().replace(' ', '-')
            url = f"https://www.naukri.com/{formatted_title}-jobs"
            job_data[title] = [str(job_id), url]
            job_id += 1

        return job_data
    job_titles = ["Data Scientist"]    
    job_info = generate_job_info(job_titles)
    run_naukri_scraper(num_of_sample_job=5, job_categories=job_info)
    close_driver()
    print("Scraping completed and data saved to CSV.")
    