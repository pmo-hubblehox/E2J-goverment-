from typing import List, Dict, Tuple
from backend.clustering.clustering import normalize_kw

def count_skills_by_cluster(
    skills_clusters_map: Dict[str, List[str]]
) -> List[List[Tuple[str, int]]]:
    """
    Counts occurrences of normalized skills within each cluster,
    orders items in each cluster by count (descending),
    and orders clusters by cluster strength (descending).
    """
    unsorted_clusters = []

    for _, skill_list in skills_clusters_map.items():
        # Group skills by their normalized form
        normalized_skill_groups = {}
        for skill in skill_list:
            normalized_skill = normalize_kw(skill)
            normalized_skill_groups.setdefault(normalized_skill, []).append(skill)

        # Create a list of (representative_skill, count) tuples
        skill_counts = [(skills[0], len(skills)) for skills in normalized_skill_groups.values()]
        # Sort the skills in the cluster by count
        skill_counts.sort(key=lambda x: x[1], reverse=True)
        # Append the cluster to the list (will sort globally later)
        unsorted_clusters.append(skill_counts)

    return unsorted_clusters

def remove_low_importance_skills_from_clusters(skill_clusters):
    skill_clusters = [cluster for cluster in skill_clusters if not (len(cluster)==1 and cluster[0][1]==1)]
    new_skill_clusters = []
    texts = []
    for cluster_idx,skill_cluster in enumerate(skill_clusters,start=1):
        keyword_freqs = [item[1] for item in skill_cluster]
        min_strength = min(keyword_freqs)
        max_strength = max(keyword_freqs)
        if max_strength!=min_strength:
            skill_cluster = [keyword for keyword in skill_cluster if keyword[1]>min_strength]
        
        new_skill_clusters.append(skill_cluster)

    # Now sort all clusters by cluster strength
    new_skill_clusters_sorted = sorted(
        new_skill_clusters,
        key=lambda cluster: sum(item[1] for item in cluster),
        reverse=True
    )

    return new_skill_clusters_sorted
