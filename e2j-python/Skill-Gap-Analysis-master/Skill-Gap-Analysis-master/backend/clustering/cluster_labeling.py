
from haystack.dataclasses import ChatMessage
from backend.common.shared_variables import llm

from backend.skill_gap_analysis.llm_operations.llm_parsing import extract_final_answer

async def name_clusters(clusters,top_k=10):
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

    name_the_cluster = ChatMessage.from_user("""
Question:
```
Skill set:
{{cluster_data}}
                                             
Give an appropriate closest umbrella title to these skills,a maximum of 1-3 words. The title should explain the skills in just the right amount of relevance. The title should not be broad

Example: 

Skill set: ['Automation Testing','Integration Testing,'Test automation','Unit Testing']
Response: Software Testing
```

Task category:
CLASSIFICATION

Response style:
Quick answer

Response format:
```final_answer
str
```

Answer finetuning:
str: Only reply with the umbrella title string and nothing else. Do not provide any verbose explanations or banter. Only the required answer.
""")

    stop = 0
    for cluster_id, cluster in enumerate(clusters):
        if stop >= top_k:
            break

        if not cluster:
            continue

        llm.add([name_the_cluster],
                datas={"cluster_data": cluster})
        stop += 1

    results = await llm.async_run(include_outputs=['llm_generator', 'prompt_builder'])

    named_clusters = {}
    for result_id,result in enumerate(results):
        cluster_name = extract_final_answer(result['llm_generator']['replies'][0].text,parse=False)
        named_clusters[cluster_name]  = clusters[result_id]

    return named_clusters