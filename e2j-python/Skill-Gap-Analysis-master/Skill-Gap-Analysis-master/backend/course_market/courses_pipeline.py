from typing import List,Dict,Tuple,Any
import hashlib
import os
from haystack import Document, Pipeline,AsyncPipeline
from haystack_integrations.document_stores.chroma import ChromaDocumentStore
from haystack_integrations.components.retrievers.chroma import ChromaQueryTextRetriever
from haystack.components.rankers import SentenceTransformersSimilarityRanker
from haystack_integrations.document_stores.qdrant import QdrantDocumentStore
from haystack.document_stores.types import DuplicatePolicy
from haystack.components.embedders import SentenceTransformersDocumentEmbedder
from haystack.utils import Secret
from dotenv import load_dotenv
from haystack_integrations.document_stores.qdrant import QdrantDocumentStore
from haystack_integrations.components.retrievers.qdrant import QdrantEmbeddingRetriever
from haystack.components.embedders import SentenceTransformersTextEmbedder
from haystack.utils import Secret

load_dotenv()

document_store = QdrantDocumentStore(
                                    url="http://localhost:6333",
                                    index="courses_db",
                                    api_key=Secret.from_token(os.getenv("QDRANT_API_KEY")),
                                    embedding_dim=384,
                                    hnsw_config={"m": 16, "ef_construct": 64},
                                    )

courses_db_pipeline = AsyncPipeline()
courses_db_pipeline.add_component("text_embedder", SentenceTransformersTextEmbedder(model="sentence-transformers/all-MiniLM-L12-v2"))
courses_db_pipeline.add_component("retriever", QdrantEmbeddingRetriever(document_store=document_store, top_k=10))
courses_db_pipeline.add_component("ranker", SentenceTransformersSimilarityRanker(top_k=5))
courses_db_pipeline.connect("text_embedder.embedding", "retriever.query_embedding")
courses_db_pipeline.connect("retriever.documents", "ranker.documents")

def create_id(text: str) -> str:
    """Convert text to a unique id"""
    return hashlib.sha256(text.encode()).hexdigest()

async def retrieve_courses_from_db(query:str) -> List[Tuple[str,str]]:
    result = await courses_db_pipeline.run_async(data={
        "text_embedder": {"text": query},
        "ranker": {"query": query}
    })
    retrieved = []
    for doc in result['ranker']['documents']:
        retrieved.append((doc.content,doc.meta['url']))
    return retrieved

def update_courses_vectorDB(skills_w_link: Dict[str, str]) -> None:
    documents = [Document(id=create_id(skill), content=skill, meta={"url": link}) for skill, link in skills_w_link]

    # Generate embeddings
    document_embedder = SentenceTransformersDocumentEmbedder(
        model="sentence-transformers/all-MiniLM-L12-v2"  # 384 dims
    )
    document_embedder.warm_up()
    
    documents_with_embeddings = document_embedder.run(documents)

    # Choose storage mode based on persist parameter

    # Persistent storage using Qdrant server
    document_store = QdrantDocumentStore(
        url="http://localhost:6333",
        index="courses_db",
        api_key=Secret.from_token(os.getenv("QDRANT_API_KEY")),
        embedding_dim=384,
        hnsw_config={"m": 16, "ef_construct": 64},
    )

    # Write documents with overwrite policy
    document_store.write_documents(
        documents_with_embeddings["documents"],
        policy=DuplicatePolicy.OVERWRITE 
    )

    storage_type = "persistent (server)"
    print(f"Vector DB is updated with {len(documents)} documents")
    print(f"Storage type: {storage_type}")
    print(f"Current document_store size = {document_store.count_documents()}")
    return document_store
