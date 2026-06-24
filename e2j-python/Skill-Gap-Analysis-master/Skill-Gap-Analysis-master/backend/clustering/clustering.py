from typing import List, Tuple, Dict
import torch
from torch import Tensor,stack,median as torchmedian,equal as torchequal
from sentence_transformers import util
from collections import Counter
import re



def normalize_kw(kw: str) -> str:
    # Lowercase, remove all non-alphanumerics
    return re.sub(r'[^a-z0-9]', '', kw.lower())

def calculate_cluster_median(embeddings: List[Tensor]) -> Tensor:
    """Calculate the median embedding of a cluster."""
    cluster_stack = torch.stack(embeddings)
    return torch.median(cluster_stack, dim=0).values

def find_representative_keyword(embeddings: List[Tensor], keywords: List[str]) -> str:
    """Find the keyword closest to the cluster median."""
    emb_stack = torch.stack(embeddings)
    median = torch.median(emb_stack, dim=0).values
    distances = torch.norm(emb_stack - median, dim=1)
    idx = torch.argmin(distances).item()
    return keywords[idx]

def reassign_unclustered_to_clusters(
    unclustered_emb: List[Tensor],
    unclustered_kw: List[str],
    unclustered_indices: List[int],
    clusters: List[Tuple[List[Tensor], List[str], List[int]]],
    similarity_threshold: float
) -> set:
    """
    Reassign unclustered items to existing clusters based on similarity.
    
    Returns:
        set: Indices of reassigned items.
    """
    reassigned_indices = set()
    
    if not unclustered_emb or not clusters:
        return reassigned_indices
    
    for i, (unclustered_emb_item, unclustered_kw_item, orig_idx) in enumerate(
        zip(unclustered_emb, unclustered_kw, unclustered_indices)
    ):
        if i in reassigned_indices:
            continue
            
        best_cluster_idx = None
        best_similarity = -1
        
        for cluster_idx, (cluster_emb, cluster_kw, cluster_orig_indices) in enumerate(clusters):
            if len(cluster_emb) == 0:
                continue
            
            cluster_median = calculate_cluster_median(cluster_emb)
            similarity = torch.cosine_similarity(
                unclustered_emb_item.unsqueeze(0), 
                cluster_median.unsqueeze(0)
            ).item()
            
            if similarity > best_similarity and similarity >= similarity_threshold:
                best_similarity = similarity
                best_cluster_idx = cluster_idx
        
        if best_cluster_idx is not None:
            clusters[best_cluster_idx][0].append(unclustered_emb_item)
            clusters[best_cluster_idx][1].append(unclustered_kw_item)
            clusters[best_cluster_idx][2].append(orig_idx)
            reassigned_indices.add(i)
    
    return reassigned_indices

def vector_clustering(
    embeddings: List[Tensor],
    keywords: List[str],
    min_cluster_size: int,
    cluster_accuracy: float
) -> Tuple[List[List[Tensor]], List[List[str]], List[List[int]]]:
    """
    Clusters embeddings and returns grouped embeddings and keywords.

    Args:
        embeddings (Tensor): Embeddings of the keywords.
        keywords (List[str]): List of keywords corresponding to the embeddings.
        min_cluster_size (int): Minimum size for a group to be considered a cluster.
        cluster_accuracy (float): Cosine similarity threshold (0-1) for clustering.

    Returns:
        Tuple[List[List[Tensor]], List[List[str]]]: 
            - List of clusters, each containing a list of embeddings.
            - List of clusters, each containing a list of keywords.
    """
    if isinstance(embeddings,list):
        embeddings_tensor = stack(embeddings)
    elif isinstance(embeddings,Tensor):
        embeddings_tensor = embeddings

    clusters = util.community_detection(
        embeddings_tensor, 
        min_community_size=min_cluster_size, 
        threshold=cluster_accuracy
    )
    # Group embeddings and keywords by clusters
    embedding_clusters = []
    keyword_clusters = []
    keyword_indices = []
    for cluster in clusters:
        embedding_clusters.append([embeddings[idx] for idx in cluster])
        keyword_clusters.append([keywords[idx] for idx in cluster])
        keyword_indices.append(cluster)
    return embedding_clusters, keyword_clusters,keyword_indices

def rudimentary_clustering(unclustered_items: List[str]) -> Dict[str, List[str]]:
    """
    Group unclustered items by normalized text.
    
    Returns:
        Dict mapping representative keyword to list of similar keywords.
    """
    def normalize_text(text):
        return re.sub(r'[^a-zA-Z0-9]', '', text.lower())
    
    text_clusters = {}
    for kw in unclustered_items:
        normalized = normalize_text(kw)
        if normalized in text_clusters:
            text_clusters[normalized].append(kw)
        else:
            text_clusters[normalized] = [kw]
    
    result = {}
    for normalized_key, kw_group in text_clusters.items():
        if len(kw_group) == 1:
            kw = kw_group[0]
            result[kw] = [kw]
        else:
            representative = min(kw_group, key=len)
            result[representative] = kw_group.copy()
    
    return result

def merge_into_cluster_map(
    skill_clusters_map: Dict[str, List[str]], 
    new_clusters: Dict[str, List[str]]
) -> None:
    """Merge new clusters into the existing skill clusters map."""
    for representative, kw_list in new_clusters.items():
        if representative in skill_clusters_map:
            skill_clusters_map[representative].extend(kw_list)
        else:
            skill_clusters_map[representative] = kw_list

def run_hierarchical_clustering_epoch(
    clusters: List[Tuple[List[Tensor], List[str], List[int]]],
    min_cluster_size: int,
    cluster_accuracy: float,
    similarity_threshold: float,
    epoch: int,
    accuracy_increment: float
) -> List[Tuple[List[Tensor], List[str], List[int]]]:
    """
    Process a single epoch of hierarchical clustering.
    
    Returns:
        List of clusters for the next epoch.
    """
    next_clusters = []
    epoch_unclustered_emb = []
    epoch_unclustered_kw = []
    epoch_unclustered_indices = []
    
    for emb_list, kw_list, idx_list in clusters:
        acc = cluster_accuracy + accuracy_increment * epoch
        emb_clusters, kw_clusters, clustered_indices = vector_clustering(
            emb_list, kw_list, min_cluster_size, acc
        )
        
        clustered_flat = set()
        for cluster_idx_list in clustered_indices:
            clustered_flat.update(cluster_idx_list)
        
        unclustered_positions = [i for i in range(len(emb_list)) if i not in clustered_flat]
        epoch_unclustered_emb.extend([emb_list[i] for i in unclustered_positions])
        epoch_unclustered_kw.extend([kw_list[i] for i in unclustered_positions])
        epoch_unclustered_indices.extend([idx_list[i] for i in unclustered_positions])
        
        for sub_emb, sub_kw, sub_indices in zip(emb_clusters, kw_clusters, clustered_indices):
            original_sub_indices = [idx_list[i] for i in sub_indices]
            next_clusters.append((sub_emb, sub_kw, original_sub_indices))
    
    reassigned_indices = reassign_unclustered_to_clusters(
        epoch_unclustered_emb,
        epoch_unclustered_kw,
        epoch_unclustered_indices,
        next_clusters,
        similarity_threshold
    )
    
    for i, (unclustered_emb, unclustered_kw, orig_idx) in enumerate(
        zip(epoch_unclustered_emb, epoch_unclustered_kw, epoch_unclustered_indices)
    ):
        if i not in reassigned_indices:
            next_clusters.append(([unclustered_emb], [unclustered_kw], [orig_idx]))
    
    return next_clusters

def build_cluster_map(
    clusters: List[Tuple[List[Tensor], List[str], List[int]]],
    min_cluster_size: int
) -> Tuple[Dict[str, List[str]], List[str]]:
    """
    Build the final skill clusters map from epoch results.
    
    Returns:
        Tuple containing:
        - Dictionary mapping representative keywords to their cluster members
        - List of unclustered items for text-based clustering
    """
    skill_clusters_map = {}
    unclustered_items = []

    for emb_list, kw_list, idx_list in clusters:
        if len(emb_list) == 0:
            continue
            
        if len(kw_list) >= min_cluster_size:
            cluster_name = find_representative_keyword(emb_list, kw_list)
            
            if cluster_name in skill_clusters_map:
                skill_clusters_map[cluster_name].extend(kw_list)
            else:
                skill_clusters_map[cluster_name] = kw_list.copy()
        else:
            unclustered_items.extend(kw_list)
    
    return skill_clusters_map, unclustered_items

#Main function
def iterative_clustering(
    embeddings: List[torch.Tensor],
    keywords: List[str],
    min_cluster_size: int,
    cluster_accuracy: float,
    similarity_threshold: float = 0.8,
    epochs: int = 2,
    accuracy_increment: float = 0.1
) -> Dict:
    """
    Performs frequency analysis of keywords using embedding-based hierarchical clustering
    with unclustered keyword reassignment.

    Args:
        embeddings (List[Tensor]): List of embedding tensors corresponding to each keyword.
        keywords (List[str]): List of skill or keyword strings.
        min_cluster_size (int): Minimum number of items required to form a cluster.
        cluster_accuracy (float): Similarity threshold for clustering.
        similarity_threshold (float): Threshold for assigning unclustered items to existing clusters.
        epochs (int, optional): Number of clustering epochs (default is 2).
        accuracy_increment (float): Increment to cluster_accuracy for each epoch.

    Returns:
        Dict: A dictionary mapping each skill (either a cluster representative or an unclustered keyword)
              to its frequency (cluster size or 1).
    """
    # Each item is a tuple: (embeddings, keywords, original_indices)
    # original_indices helps us track which items from the input list we're working with
    clusters = [(embeddings, keywords, list(range(len(embeddings))))]
    
    # For each epoch, cluster and reassign unclustered items
    for epoch in range(epochs):
        clusters = run_hierarchical_clustering_epoch(
            clusters,
            min_cluster_size,
            cluster_accuracy,
            similarity_threshold,
            epoch,
            accuracy_increment
        )


    skill_clusters_map, unclustered_items = build_cluster_map(clusters, min_cluster_size)

    # Apply rudimentary clustering for remaining unclustered items
    text_clusters = rudimentary_clustering(unclustered_items)
                
    merge_into_cluster_map(skill_clusters_map, text_clusters)

    return skill_clusters_map
