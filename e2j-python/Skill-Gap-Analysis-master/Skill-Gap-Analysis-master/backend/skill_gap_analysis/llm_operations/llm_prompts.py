from haystack.dataclasses import ChatMessage

STRUCTURED_TASK_SYS_PROMPT = ChatMessage.from_system(
    """
    You are on the course creation team, currently assisting a course builder from the Writers team. Your tasks will be decided by the writer (the user).

    Given their task, always respond in a well formatted method. The writer will also define the style of your response in 2 ways.

    Response style:
    1. Quick answer: As the name suggests, a quick answer to whatever task defined by the writer. No other explanatory response other than asked is needed.
    2. Reason before answer: A chain of thought style response from you, a think step by step, followed by the answer desired by the user.

    The writer will also define the task category

    Task categories:
    1. CLASSIFY : The writer's question pertains to classifying something, given their context.
    2. CREATIVE WRITING: The writer's intention is for you to generate information
    3. EXTRACT: The writer's question pertains to extracting some information from the data they provide, given their requirements.

    The writer will also define the required response format. Response format is custom to requirement. However the writer will suggest a format in form of type hint of the required answer.
    The response format defined will be under heading "Response format:"

    The writer may also define the answer finetuning, which is just more instructions on how the writer wants the final answer to look like. This will be defined under heading "Answer finetuning:"
    """
    )


# USER PROMPTS

CLASSIFY_SKILL_COVERAGE_AND_TYPE = ChatMessage.from_user(
    """
    Question:
    ```
    Information extracted from curriculum:
    {{info_from_curriculum}}

    Information extracted from CV:
    {{info_from_CV}}
    
    Given the skill set "{{skill_set}}", I want you to think and tell me whether the skills from the skill set are taught in the curriculum. I also want you to classify
    each skill as:
    1. "Knowledge" for Knowledge-Based Skills - subject/domain-specific understanding.
    2. "Technical" for Technical/Skill-Based Competencies - hands-on or tool-based expertise.
    3. "Soft" for Cognitive/Soft Skills - problem-solving, communication, adaptability, etc.
    ```

    Task category:
    CLASSIFY

    Response style:
    Reason before answer

    Response format:
    ```final_answer
    Dict[(str:boolean,str:skill_type)]
    ```

    Answer finetuning:
    You should provide me a final dictionary where skills are keys, and the tuple of (verdict,skill type) where verdict is whether they are taught in curriculum or not in True/False, and their skill type as the skill type. 
    """)


def gemini_jd_to_key_skills():
    sys_prompt = """
        Job Description Keyword Extraction Prompt
        
        Objective: 
        Extract the most relevant keywords and key skills from the 
        given job description and pre-defined skills.
        The focus should be purely on skills (both technical and 
        soft skills) required for the role.
        Exclude educational qualifications, degrees, or general 
        information unrelated to skillsets.
        
        Guidelines for Extraction:
            1.  Focus on Skills Only:
                - Include technical skills  
                - Include soft skills 
                - Include domain-specific skills relevant to the job
            2.  Exclude Educational Degrees and Qualifications:
                - Do not include mentions of degrees or certifications unless they explicitly indicate a skill
            3.  Avoid Common Buzzwords Unless Highlighted:
                - Exclude overly generic terms
                - Retain action-oriented skills
            4.  Ensure Precision and Relevance:
                - Extract concise, role-specific keywords that represent the employer's expectations.
                
            Return the extracted keywords and key skills in the below JSON format only:
        
        {% raw %}
        {
            "Keywords and Key Skills":[  
                "Skill 1",  
                "Skill 2",   
                "Skill 3",
                "Skill 4", 
                "Skill 5", 
                ..., 
                ..., 
                ]
        }
        {% endraw %}
            
        *** MAKE SURE TO RETURN ONLY IN BELOW JSON FORMAT ONLY ***
    """
    
    return sys_prompt

def refine_syllabus_user_prompt(extracted_text):
    user_prompt = f"""
        REFINE THE SYLLABUS AS PER THE FORMAT:

        The Raw Syllabus is given below:
        ```{extracted_text}```
    """
    
    return user_prompt

def refine_syllabus_sys_prompt():
    
    
    sys_prompt = f"""
        You are an assistant that refines syllabus based on provided raw text as syllbus in given format only.
        
        Output Format of the Syllabus should be:

        {{
            "Subject": "Name of the Subject",
            "Syllabus": {{ DICT of Refined Syllabus as chapters }},
            "Reference Books": [LIST of Reference Books from raw data for the course],
        }}

        Example of output format:

        {{
            "Subject": "Python Programming",
            "Syllabus": {{
                "Module 1": "Module 1",
                "Module 2": "Data Structures: Description of chapter",
                "Module 3": "Algorithms: Description of chapter",
                "Module 4": "Machine Learning: Description of chapter",
                // ... additional modules
            }},
            "Reference Books": [
                "Python Programming: Author Name",
                "Data Structures and Algorithms: Author Name",
                "Machine Learning by Andrew Ng: Author Name",
                "Deep Learning by Ian Goodfellow: Author Name",
                "Natural Language Processing by Dan Jurafsky: Author Name",
                "Computer Vision by Richard Szeliski: Author Name",
            ]
        }}

        Instructions:
        - Return only in the given JSON format.
        - Use double quotes (\"\") in JSON keys and values.
    """
    
    return sys_prompt

def syllabus_2_keyskills_sys_prompt():
    
    sys_prompt = """
        Objective: Extract the most relevant keywords and key skills from the given Description(Syllabus). 
        The focus should be purely on skills (both technical and soft skills) required for the role. 
        Exclude educational qualifications, degrees, or general information unrelated to skillsets.\n\n
        Guidelines for Extraction:\n
        
        1. Focus on Skills Only:\n
            - Include technical skills\n
            - Include soft skills\n
            - Include domain-specific skills relevant to the Description(Syllabus)\n
        2. Exclude Educational Degrees and Qualifications:\n
            - Do not include mentions of degrees or certifications unless they explicitly indicate a skill \n
        3. Avoid Common Buzzwords Unless Highlighted:\n
            - Exclude overly generic terms unless emphasized as critical.\n
            - Retain action-oriented skills.\n
        4. Ensure Precision and Relevance:\n
            - Extract concise, role-specific keywords that represent the employer's expectations.\n\n
            
        Return the extracted keywords and key skills in the below JSON format only:\n\n
        
        
        {\n
            \"Keywords and Key Skills\":[\n
                \"Skill 1\",\n
                \"Skill 2\",\n
                \"Skill 3\",\n
                ...\n
            ]\n
        }\n\n
        
        *** MAKE SURE TO RETURN ONLY IN BELOW JSON FORMAT ONLY ***
    """
    
    return sys_prompt

