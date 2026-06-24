import os
import json
import asyncio
from typing import List
from torch import Tensor
from backend.common.config import FEATURES

from backend.curricula.populate_curriculum import repopulate_curriculum_vectorDB,collection_exists,delete_collection

from backend.common.pdf_utils import doc_chunking, hash_doc
from backend.skill_gap_analysis.gap_identification import identify_skill_gaps

from backend.recommendations.course.course_recommendation import get_course_recommendations
from backend.curricula.update_curriculum import get_pages_to_update_curriculum,update_curriculum_pages

from sentence_transformers import SentenceTransformer
from backend.clustering.clustering import iterative_clustering
from backend.clustering.cluster_labeling import name_clusters
from backend.clustering.cluster_refinement import count_skills_by_cluster,remove_low_importance_skills_from_clusters

from backend.skill_gap_analysis.gap_annotation import annotate_skill_gaps

def extract_desired_skills_keywords(df,profession: str) -> List[str]:
    # df = df[df['Job Title']==profession]
    kwlist = []
    for row in df.iterrows():
        skills = row[1]['Desired Key Skills']
        if isinstance(skills,str):
            kwlist.extend([kw.strip() for kw in skills.split(",") if kw.strip()])
    return kwlist

def embedder(kwlist: List[str]) -> List[Tensor]:
    transformer = 'all-MiniLM-L6-v2' 
    model = SentenceTransformer(transformer)
    embeddings = model.encode(kwlist, batch_size=256, show_progress_bar=True, convert_to_tensor=True)
    return embeddings


def upload_cv_to_vectorstore(cv_path):
    
    cv_hash = hash_doc(cv_path)
    cv_id = f"doc_{cv_hash}"


    if collection_exists(cv_id):
        print(f"Previous collection for user's cv somehow persisted, deleting...")
        try:
            delete_collection(cv_id)
            print("Collection deleted successfully!")
        except Exception as e:
            print(f"Unexpected error occured during trying to delete collection {cv_id}, Error: {e}")
        
    cv_chunks = doc_chunking(cv_path,chunk_size=500,overlap=20)
    
    try:
        _ = repopulate_curriculum_vectorDB(cv_chunks,colln_name=cv_id)
    except Exception as e:
        print(f"Unexpected error occured during trying to upload to vector store, cv {cv_id}, Error {e}")

    return cv_id

def upload_curriculum_to_vectorstore(curriculum_path):
    
    #First determine if file id to be hashed or not, if yes, hash it, else use the basename as id.
    file_name = os.path.basename(curriculum_path)
    curriculum_id = os.path.splitext(file_name)[0]

    if collection_exists(curriculum_id):
        print(f"Curriculum already exists in vectorstore, skipping upload..")
        return curriculum_id
        
    curriculum_chunks = doc_chunking(curriculum_path,chunk_size=500,overlap=20)
    
    try:
        _ = repopulate_curriculum_vectorDB(curriculum_chunks,colln_name=curriculum_id)
    except Exception as e:
        print(f"Unexpected error occured during trying to upload to vector store, curriculum {curriculum_id}, Error {e}")
        
    return curriculum_id

async def skill_gap_analysis_async(scraped_jobs, curriculum_path, cv_path, designation):
    
    cv_id = upload_cv_to_vectorstore(cv_path)
    curriculum_id = upload_curriculum_to_vectorstore(curriculum_path)

    kwlist = extract_desired_skills_keywords(scraped_jobs,designation)
    kwlist_embeddings = embedder(kwlist)

    kwlist_u,kwlist_embeddings_u = kwlist,kwlist_embeddings

    min_cluster_size = 5
    cluster_accuracy = 0.1
    top_k = 10
    cluster_wise_course_recommendation = None
    curriculum_recommendations = None

    skill_map = iterative_clustering(kwlist_embeddings_u,kwlist_u,min_cluster_size=3,cluster_accuracy=0.5,similarity_threshold=0.6,epochs = 2,accuracy_increment=0.1)

    skill_clusters = count_skills_by_cluster(skill_map)

    skill_clusters = remove_low_importance_skills_from_clusters(skill_clusters)

    named_skill_clusters = await name_clusters(skill_clusters,top_k)

    results,known_skills,skill_gaps,vector_searched_knowledge = await identify_skill_gaps(named_skill_clusters,cv_id=cv_id,curriculum_id=curriculum_id,top_k=top_k)

    if 'direct_course_recommendation' in FEATURES:
        cluster_wise_course_recommendation = await get_course_recommendations(skill_gaps,vector_searched_knowledge,top_k=top_k)
        print(f"---> Course: {cluster_wise_course_recommendation}")
        
    if "curriculum_enhancement" in FEATURES:
        clusterwise_pages_for_skills = await get_pages_to_update_curriculum(curriculum_path,skill_gaps,vector_searched_knowledge,top_k=top_k)
        curriculum_recommendations = await update_curriculum_pages(curriculum_path,clusterwise_pages_for_skills,top_k=top_k)
        print(f"---> Curriculum: {curriculum_recommendations}")

    skill_clusters_w_classification = annotate_skill_gaps(named_skill_clusters,known_skills,skill_gaps)
    
    result = {
        "cluster_wise_course_recommendation": cluster_wise_course_recommendation,
        "curriculum_recommendations": curriculum_recommendations,
        "skill_clusters_w_classification": skill_clusters_w_classification
    }

    # with open("output.json", "w") as f:
    #     json.dump(result, f)
        
    return result
    
def run_skill_gap_analysis(scraped_jobs, curriculum_file, cv_file, designation):
    """
    Synchronous wrapper for the async function to be used in non-async contexts
    """

    result = asyncio.run(skill_gap_analysis_async(
        scraped_jobs, curriculum_file, cv_file, designation
    ))
    return result

if __name__ == "__main__":
    file_path = r"D:\Git_Projects\Career-Recommendation\app\Skill-Gap-Analysis\output_with_skill_gap_final.csv"
    curriculum_file = r"D:\Git_Projects\Career-Recommendation\app\Skill-Gap-Analysis\curriculum_civil_eng_VIT.pdf"
    cv_file = r"D:\Git_Projects\Career-Recommendation\app\Skill-Gap-Analysis\dummy_soft_eng_cv.pdf"
    
    result = run_skill_gap_analysis(file_path, curriculum_file, cv_file, "Data Scientist")
    print(result)