from typing import List, Dict, Any, Tuple
from dataclasses import dataclass
import ast
from typing import List, Dict, Tuple, Any

from backend.course_market.courses_pipeline import update_courses_vectorDB, retrieve_courses_from_db

from backend.course_market.course_search import course_search

from backend.common.shared_variables import llm
from haystack.dataclasses import ChatMessage

@dataclass
class ClusterCourses:
    """Structured container for cluster course data."""
    cluster_name: str
    cluster_index: int
    skill_gaps: List[str]
    retrieved_courses: List[Tuple[str, str]]
    filtered_courses: Dict[str, List[Dict[str, str]]] = None


async def get_course_recommendations(
    skill_gaps: Dict[str, List[str]],
    vector_searched_knowledge: Dict[int, Dict[str, List[Tuple[str, int]]]],
    top_k: int = 5
) -> Dict[str, Dict[str, Any]]:
    """
    Get course recommendations for identified skill gaps using LLM filtering.
    
    Args:
        skill_gaps: Dictionary mapping skill categories to lists of specific skills
        vector_searched_knowledge: Pre-retrieved cluster information with courses
        top_k: Maximum number of clusters to process per skill category
    
    Returns:
        Dictionary mapping skill categories to cluster-wise course recommendations
    """
    cluster_courses = await _retrieve_courses_by_cluster(skill_gaps, vector_searched_knowledge, top_k)
    filtered_courses = await _filter_courses_with_llm(cluster_courses)
    results = await _format_recommendations(skill_gaps, filtered_courses)
    return results


async def _retrieve_courses_by_cluster(
    skill_gaps: Dict[str, List[str]],
    vector_searched_knowledge: Dict[int, Dict[str, List[Tuple[str, int]]]],
    top_k: int
) -> Dict[str, List[ClusterCourses]]:
    """Retrieve courses from database for each skill gap within top clusters."""
    cluster_courses_by_category = {category: [] for category in skill_gaps}
    
    for skill_category, gaps in skill_gaps.items():
        cluster_index = 0
        
        for cluster_name, cluster_data in vector_searched_knowledge.items():
            if cluster_index >= top_k:
                break
            
            # Find skill gaps present in this cluster
            matching_gaps = list(set(cluster_data.keys()).intersection(set(gaps)))
            if not matching_gaps:
                continue
            
            # Retrieve all courses for matching skill gaps
            all_courses = []
            for skill_gap in matching_gaps:
                courses = await retrieve_courses_from_db(skill_gap)
                all_courses.extend(courses)
            
            cluster_courses_by_category[skill_category].append(
                ClusterCourses(
                    cluster_name=cluster_name,
                    cluster_index=cluster_index,
                    skill_gaps=matching_gaps,
                    retrieved_courses=all_courses
                )
            )
            cluster_index += 1
    
    return cluster_courses_by_category


async def _filter_courses_with_llm(
    cluster_courses_by_category: Dict[str, List[ClusterCourses]]
) -> Dict[str, List[ClusterCourses]]:
    """Use LLM to filter most relevant courses for each skill gap."""
    # Configure LLM
    llm.set_system_prompts([
        ChatMessage.from_system(
            'Only return the requested information in valid dictionary format.'
        )
    ])
    
    # Build all LLM tasks
    tasks_metadata = []
    for skill_category, clusters in cluster_courses_by_category.items():
        for cluster in clusters:
            prompt = _build_filtering_prompt()
            params = {
                'courses': cluster.retrieved_courses,
                'skill_gaps': cluster.skill_gaps
            }
            
            llm.add(prompt_stack=[prompt], datas=params)
            tasks_metadata.append({
                'skill_category': skill_category,
                'cluster': cluster
            })
    
    # Execute all LLM calls concurrently
    llm_responses = await llm.async_run(
        include_outputs=['llm_generator', 'prompt_builder']
    )
    
    # Process responses
    for metadata, response in zip(tasks_metadata, llm_responses):
        cluster = metadata['cluster']
        filtered_courses = _parse_llm_response(response, cluster.skill_gaps)
        cluster.filtered_courses = filtered_courses
    
    return cluster_courses_by_category


def _build_filtering_prompt() -> ChatMessage:
    """Build the prompt template for LLM course filtering."""
    prompt_text = (
        "{{courses}} are a list of courses. Extract only the most relevant courses "
        "for the skill set {{skill_gaps}}. Return a dictionary where:\n"
        "- Each skill gap name is a key\n"
        "- The value is a dictionary with course title as key and URL as value\n"
        "- Include only specific courses, not general ones\n"
        "- If no relevant courses exist for a skill, use an empty list as the value\n"
        "- Every skill gap must have a key in the output dictionary"
    )
    return ChatMessage.from_user(prompt_text)


def _parse_llm_response(
    response: Dict[str, Any],
    skill_gaps: List[str]
) -> Dict[str, List[Dict[str, str]]]:
    """Safely parse LLM response with fallback for errors."""
    try:
        response_text = response['llm_generator']['replies'][0].text
        return ast.literal_eval(response_text)
    except Exception as e:
        print(f"Failed to parse LLM response: {e}")
        return {skill: [] for skill in skill_gaps}

async def _format_recommendations(
    skill_gaps: Dict[str, List[str]],
    filtered_courses: Dict[str, List[ClusterCourses]]
) -> Dict[str, Dict[str, Any]]:
    """Format filtered courses into final recommendation structure."""
    MAX_FALLBACK_COURSES = 10
    recommendations = {category: {} for category in skill_gaps}
    
    # 1️⃣ Collect all clusters that need fallback searches
    clusters_to_fallback = []
    for skill_category, clusters in filtered_courses.items():
        for cluster in clusters:
            if not cluster.filtered_courses:
                clusters_to_fallback.append((skill_category, cluster))
    
    # 2️⃣ Batch fetch all missing courses in one async call
    if clusters_to_fallback:
        cluster_names = [cluster.cluster_name for _, cluster in clusters_to_fallback]
        search_results = await course_search(cluster_names)  # ← await the async function
        
        # 3️⃣ Assign results back to clusters (order preserved)
        for (skill_category, cluster), result in zip(clusters_to_fallback, search_results):
            cluster.filtered_courses = result[:MAX_FALLBACK_COURSES]
            update_courses_vectorDB(cluster)  # Assuming this is sync
    
    # 4️⃣ Build final recommendations (unchanged)
    for skill_category, clusters in filtered_courses.items():
        category_gaps = skill_gaps[skill_category]
        for cluster in clusters:
            gap_index = cluster.cluster_index
            if gap_index < len(category_gaps):
                skill_gap_name = category_gaps[gap_index]
                recommendations[skill_category][skill_gap_name] = {
                    'title': cluster.cluster_name,
                    'courses': cluster.filtered_courses
                }
    
    return recommendations