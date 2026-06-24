import json
from haystack.dataclasses import ChatMessage

from backend.common.shared_variables import llm

from backend.skill_gap_analysis.llm_operations.llm_prompts import gemini_jd_to_key_skills


async def jd_to_key_skills(data):
    def process_response(response):
        # Parse and return the response
        try:
            res = response['llm_generator']['replies'][0].text
            ret = res.replace("```json", "").replace("```", "").strip()
            ret = json.loads(ret)
            return ret  # Assuming response.text contains the JSON as requested
        except Exception as e:
            print(f"Error parsing response: {e}")
            return None
    # Initialize an empty column for skills
    data['Desired Key Skills'] = None
    sys_instruct = gemini_jd_to_key_skills()
    llm.set_system_prompts([ChatMessage.from_system(sys_instruct)])
    # Process each job description ---> FOR MAIN DATA
    for i, (jd, key_skills) in enumerate(zip(data['job_description'], data['key_skills'])):
        try:
            print(f"Processing job description {i+1}")
            llm.add([ChatMessage.from_user("""Key Skills: {{key_skills}}, Job Description: {{jd}}""")],datas = {"key_skills":key_skills,"jd":jd})
        except Exception as e:
            raise ValueError(f"Error processing job description {i+1}: {e}")

    responses = await llm.async_run()

    for i,response in enumerate(responses):
        extracted_skills = process_response(response)
        str_skills = ','.join(extracted_skills['Keywords and Key Skills'])
        data.at[i, 'Desired Key Skills'] = str_skills
    # Save or inspect the modified DataFrame
    # print(data[['Job Description', 'Desired Key Skills']])
    return data
