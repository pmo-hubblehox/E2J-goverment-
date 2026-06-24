from haystack.dataclasses import ChatMessage
from backend.common.shared_variables import llm
from backend.skill_gap_analysis.llm_operations.llm_parsing import extract_final_answer

import PyPDF2

async def get_pages_to_update_curriculum(curriculum_file,skill_gaps,vector_searched_knowledge,top_k=5):
    sys_prompt = ChatMessage.from_system(
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

    llm.set_system_prompts([sys_prompt])

    find_pages_to_update_in_curriculum = ChatMessage.from_user("""
Question:
```
Pages from curriculum:
{{info_from_curriculum}}

Skill gaps identified:
{{skill_set}}

Analyze the curriculum pages and identify which specific pages need updates to address the skill gaps. For each recommended update, focus on addressing ONE skill gap at a time and choose the most contextually appropriate sections.

Example: If "Constructors in Python" is a skill gap and there are sections on "Basics of Python" and "Object-Oriented Programming in Python," choose the OOP section as constructors are conceptually part of object-oriented programming.
```

Task category:
CLASSIFICATION

Response style:
Reason before answer

Response format:
```final_answer
List[int]
```

Answer finetuning:
List[int]: Page numbers requiring updates

Focus on one skill gap per recommendation to ensure targeted, effective page selections.
""")
    clusterwise_pages_for_skills = {skill_type:{} for skill_type in skill_gaps}
    for skill_type in skill_gaps:
        stop = 0
        clusters_to_process = []
        for cluster_id,cluster in vector_searched_knowledge.items():
            if stop>=top_k:
                break
            skill_gaps_from_cluster = list(set(cluster.keys()).intersection(set(skill_gaps.get(skill_type))))
            if skill_gaps_from_cluster == []:
                continue
            all_retrieved_from_cluster = []
            for skill_name in cluster:
                all_retrieved_from_cluster.extend(cluster[skill_name])
            deduped_retrieved_list = list(set(all_retrieved_from_cluster))
            pages_to_retrieve = [item[1] for item in deduped_retrieved_list]
            # pages_to_retrieve_w_buffer = [[item,item+1,item-1] for item in pages_to_retrieve]
            # pages_to_retrieve_w_buffer = list(set([item for sublist in pages_to_retrieve_w_buffer for item in sublist]))
            # pages_to_retrieve_w_buffer.sort()
            pages_to_retrieve.sort()
            content = retrieve_page_text(pages_to_retrieve,curriculum_file)
            clusters_to_process.append(cluster_id)
            llm.add([find_pages_to_update_in_curriculum],datas={"info_from_curriculum":content,"skill_set":skill_gaps_from_cluster})
            clusterwise_pages_for_skills[skill_type][cluster_id] = {'skills':skill_gaps_from_cluster,'pages':[]}
            stop+=1

        results = await llm.async_run(include_outputs= ['llm_generator','prompt_builder'])

        for cluster_id,result in zip(clusters_to_process,results):
            llm_text = result['llm_generator']['replies'][-1].text
            pages = extract_final_answer(llm_text)
            clusterwise_pages_for_skills[skill_type][cluster_id]['pages'].extend(pages)
        
    return clusterwise_pages_for_skills

async def update_curriculum_pages(curriculum_file,clusterwise_pages_for_skills,top_k=5):
    sys_prompt = ChatMessage.from_system(
        """
        I am on the course creation team, currently assisting a course builder from the Writers team. My tasks will be decided by the writer (the user).

        Given their task, I will always respond in a well formatted method. The writer will also define the style of my response in 2 ways.

        Response style:
        1. Quick answer: As the name suggests, I will provide a quick answer to whatever task defined by the writer. No other explanatory response other than asked is needed.
        2. Reason before answer: I will provide a chain of thought style response, thinking step by step, followed by the answer desired by the user.

        The writer will also define the task category

        Task categories:
        1. CLASSIFY: The writer's question pertains to classifying something, given their context.
        2. CREATIVE WRITING: The writer's intention is for me to generate information
        3. EXTRACT: The writer's question pertains to extracting some information from the data they provide, given their requirements.

        The writer will also define the required response format. Response format is custom to requirement. However the writer will suggest a format in form of type hint of the required answer.
        The response format defined will be under heading "Response format:"

        The writer may also define the answer finetuning, which is just more instructions on how the writer wants the final answer to look like. This will be defined under heading "Answer finetuning:"
        """
        )


    llm.set_system_prompts([sys_prompt])
    update_pages_in_curriculum = ChatMessage.from_user(
"""

EXAMPLE REASONING STYLE THAT YOU SHOULD FOLLOW:
```
Thinking…
Let's break down the update:
Update 1: In Module 6 (Cloud Platforms and Application Development) - add Azure DevOps mention in Microsoft Azure context and extend application development to include CI/CD practices
Update 2: In Laboratory - add Azure DevOps experiment

However, the instruction says: "Each skill gap should only be in one place." This creates a dilemma - we have one skill gap ('Azure DevOps') but two potential sections (lecture and lab).

The instruction example showed "Constructors in Python" placed in only one section (OOP), not split between theory and practice.

We have two options:
- Option 1: Update only Module 6 (lecture) - missing practical aspect
- Option 2: Update only laboratory - missing theoretical context

Since the instruction emphasizes "one place" and we must choose, let's analyze: Azure DevOps is practical but needs theoretical foundation. Module 6 already covers cloud platforms and application development, making it the most conceptually appropriate location.

For the laboratory, we could replace experiment 9 ("Configure VLAN using cisco packet tracer") with "Set up CI/CD pipeline using Azure DevOps" since VLAN is traditional networking, not cloud-specific. This maintains 30 total lab hours.

But following the instruction strictly - "each skill gap should only be in one place" - we should choose one section only.

Decision: Update Module 6 only, adding Azure DevOps to both the platform comparison and application development sections.

Original Module 6 text:
"Comparing Amazon web services, Google AppEngine, Microsoft Azure from the perspective of Architecture (Compute, Storage Communication) services and cost models. Cloud application Development using third party APIs, Working with EC2 API – Google App Engine API Facebook API, Twitter API."

Revised text:
"Comparing Amazon web services, Google AppEngine, Microsoft Azure from the perspective of Architecture (Compute, Storage, Communication) services, development and deployment tools (including Azure DevOps for Microsoft Azure), and cost models. Cloud application Development using third party APIs and DevOps tools, Working with EC2 API – Google App Engine API Facebook API, Twitter API, and Azure DevOps."

This single update addresses the skill gap in the most relevant module while respecting the "one place" constraint.
```

Okay, so I've received this question where I have pages from the curriculum:

{{info_from_curriculum}}

And the skill gaps identified are:
{{skill_set}}

Hmm, so it's clear these skill gaps aren't currently taught. They need to be incorporated, but wait... where should I place them? I shouldn't just add them anywhere - they need to fit conceptually. Each skill placement deserves careful consideration - I'll spend at least 4 sentences worth of thinking for each skill to ensure optimal placement.

Let me think about my approach. I need to analyze these pages to find the best sections for updates. Each skill gap should only be in one place, right? But wait, what if a skill could fit in multiple sections? Actually no - that would create redundancy. Better to pick the MOST appropriate section for each. For each skill, I'll consider: its conceptual relationships, prerequisite knowledge requirements, and progression flow within the curriculum.

Now for grouping... some skills might naturally belong together. If they do, I should group them in one update. But if they belong in different sections, separate updates. Hold on - I also need to avoid updating the same section multiple times. For each potential grouping, I'll reflect on whether they truly form a cohesive unit or if separating them would better serve learning objectives.

Let me think of an example... "Constructors in Python" as a skill gap. There are "Basics of Python" and "OOP in Python" sections. Constructors are part of OOP, so I'll update only that section. Wait, but what if someone argues they should be in basics? No, constructors require understanding classes first, so OOP is definitely right. Actually, let me think deeper: 1) Constructors initialize objects which requires OOP concepts, 2) Teaching them earlier would confuse beginners, 3) The OOP section already covers related concepts like inheritance, 4) Adding them elsewhere would disrupt the learning progression. Okay, OOP section is confirmed.

Hmm, formatting... I should maintain the numbering system. But wait, what if I add a numbered component that already exists? That would mess up the sequence. I'll need to renumber existing components. For each numbering conflict, I'll consider: the logical flow of topics, cognitive load implications, and how renumbering affects adjacent sections.

Task category:
CREATIVE WRITING

Response style:
Reason before answer

Response format:
[reasoning]
```
str
```
where the reasoning MUST:
- Include at least 4 sentences of reflection PER SKILL discussing: conceptual alignment, prerequisite relationships, progression impact, and potential alternatives
- Use reflective statements like: 
  - "Wait, but what if..."
  - "Hmm, that doesn't account for..."
  - "Actually, no because..."
  - "That seems right, but let me consider..."
  - "On second thought..."
  
the str should contain:

Update x:
    SKILLS: [Skills from the gap set I'm incorporating into this section]

    ```
    ORIGINAL SECTION:
    ```
    [The exact curriculum text I'm modifying]
    ```
    REVISED SECTION:
    ```
    [The updated curriculum text with my changes]
    ```
    EXPLANATION:
    ```
    [Why I chose this approach for this section]

    Note: x represents each distinct update - if I'm modifying 2 different sections, I'll have updates 1 and 2.
```
""")
    for skill_type in clusterwise_pages_for_skills:
        stop = 0
        for cluster_id,cluster in clusterwise_pages_for_skills.get(skill_type).items():
            if stop>=top_k:
                break
            
            pages_to_retrieve = cluster['pages']

            pages_to_retrieve_w_buffer = [[item,item+1,item-1] for item in pages_to_retrieve]
            pages_to_retrieve_w_buffer = list(set([item for sublist in pages_to_retrieve_w_buffer for item in sublist]))
            pages_to_retrieve_w_buffer.sort()

            content = retrieve_page_text(pages_to_retrieve_w_buffer,curriculum_file)
            
            llm.add([update_pages_in_curriculum],datas={"info_from_curriculum":content,"skill_set":cluster['skills']})

            stop+=1

        results = await llm.async_run(include_outputs= ['llm_generator','prompt_builder'])

        for cluster_id,result in zip(list(clusterwise_pages_for_skills.get(skill_type).keys()),results):
            llm_text = result['llm_generator']['replies'][-1].text
            clusterwise_pages_for_skills[skill_type][cluster_id]['llm_recommendation'] = llm_text
        
    return clusterwise_pages_for_skills

def retrieve_page_text(page_numbers,file_path):
    complete_content = ""
    pdf_reader = PyPDF2.PdfReader(file_path)
    # Extract content from each important page
    for page_num in page_numbers:
        try:
            # Note: PyPDF2 uses 0-based indexing, so subtract 1 from page number
            page = pdf_reader.pages[page_num - 1]
            
            # Extract text from the page
            page_text = page.extract_text()
            
            # Add page content to complete string with page separator
            complete_content += f"\n--- Page {page_num} ---\n"
            complete_content += page_text
            complete_content += "\n"

        
        except IndexError:
            print(f"Warning: Page {page_num} does not exist in the PDF")
        except Exception as e:
            print(f"Error extracting page {page_num}: {str(e)}")

    return complete_content
