from typing import Dict, Tuple, List, Dict
import asyncio

from backend.common.shared_variables import llm
from backend.curricula.search_curriculum import create_faq_pipeline, information_search
from backend.skill_gap_analysis.llm_operations.llm_prompts import STRUCTURED_TASK_SYS_PROMPT,CLASSIFY_SKILL_COVERAGE_AND_TYPE

from backend.skill_gap_analysis.llm_operations.llm_parsing import extract_final_answer

async def identify_skill_gaps(skill_clusters: Dict,cv_id = None, curriculum_id = None, top_k=10) -> Tuple[List[Dict],List[str],List[str],Dict[int,Dict]]:
    pipeline_curriculum = create_faq_pipeline(db_name=curriculum_id)
    pipeline_cv = create_faq_pipeline(db_name=cv_id)

    llm.set_system_prompts([STRUCTURED_TASK_SYS_PROMPT])
    vector_searched_knowledge = {}
    for cluster_name, skill_cluster in list(skill_clusters.items())[:top_k]:

        # Prepare list of pipelines to search based on which are available
        datas = []
        if pipeline_curriculum:
            curriculum_search_results = await asyncio.gather(*[information_search(pipeline_curriculum,skill[0]) for skill in skill_cluster])
            datas.append(curriculum_search_results)
        if pipeline_cv:
            cv_search_results = await asyncio.gather(*[information_search(pipeline_cv,skill[0]) for skill in skill_cluster])
            datas.append(cv_search_results)
        if datas:
            vector_searched_knowledge[cluster_name] = {skill[0]:[elem for item in datas for elem in item[idx]] for idx,skill in enumerate(skill_cluster)}
        all_retrieved_information = []
        
        for item in list(vector_searched_knowledge[cluster_name].values()):
            all_retrieved_information.extend([text[0] for text in item])
        all_retrieved_information = "\n".join(list(set(all_retrieved_information)))
        # Derive the joined string from the dictionary values

        newline = '\n'
        skill_set = f"Skill set:\n{newline.join([item[0] for item in skill_cluster])}"

        llm.add([CLASSIFY_SKILL_COVERAGE_AND_TYPE],datas={"info_from_curriculum":all_retrieved_information,"skill_set":skill_set})

    results = await llm.async_run(include_outputs= ['llm_generator','prompt_builder'])
    
    clusterwise_skill_coverages_n_types = [extract_final_answer(item['llm_generator']['replies'][0].text.replace('true','True').replace('false','False')) for item in results]


    def group_skills_by_coverage(
        classifications: List[Dict],
        skill_types: List[str],
        is_covered: bool
    ) -> Dict[str, List[str]]:
        """Group skills by type based on coverage status."""
        result = {skill_type: [] for skill_type in skill_types}
        
        for cluster_classification in classifications:
            for skill_name, (covered, category) in cluster_classification.items():
                if covered == is_covered and category in result:
                    result[category].append(skill_name)
        
        return result

    skill_types = ['Soft', 'Technical', 'Knowledge']

    known_skills = group_skills_by_coverage(
        clusterwise_skill_coverages_n_types,
        skill_types,
        is_covered=True
    )

    skill_gaps = group_skills_by_coverage(
        clusterwise_skill_coverages_n_types,
        skill_types,
        is_covered=False
    )
    return results,known_skills,skill_gaps,vector_searched_knowledge