import os
from haystack_integrations.document_stores.chroma import ChromaDocumentStore
from haystack import Document
import chromadb
from qdrant_client import QdrantClient
from haystack_integrations.document_stores.qdrant import QdrantDocumentStore
from haystack.document_stores.types import DuplicatePolicy
from haystack.components.embedders import SentenceTransformersDocumentEmbedder
from haystack.utils import Secret
from dotenv import load_dotenv

load_dotenv()

qdrt_client = QdrantClient(
    url="http://localhost:6333",
    api_key=os.getenv("QDRANT_API_KEY")
)

def collection_exists(collection_name):

    return qdrt_client.collection_exists(collection_name=collection_name)

def repopulate_curriculum_vectorDB(strings_w_pgnum, colln_name, persist=True):
    """
    Update curriculum vector database
    
    Args:
        strings_w_pgnum: List of (string, page_number) tuples
        colln_name: Collection name
        persist: If True, use Qdrant server (persistent storage)
                 If False, use in-memory mode (not recommended for production)
    """
    documents = [
        Document(
            id=f"doc_{idx}",
            content=string,
            meta={'page_no': page_no}
        ) 
        for idx, (string, page_no) in enumerate(strings_w_pgnum)
    ]

    # Generate embeddings
    document_embedder = SentenceTransformersDocumentEmbedder(
        model="sentence-transformers/all-MiniLM-L12-v2"  # 384 dims
    )
    document_embedder.warm_up()
    
    documents_with_embeddings = document_embedder.run(documents)

    # Choose storage mode based on persist parameter
    if persist:
        # Persistent storage using Qdrant server
        document_store = QdrantDocumentStore(
            url="http://localhost:6333",
            index=colln_name,
            api_key=Secret.from_token(os.getenv("QDRANT_API_KEY")),
            embedding_dim=384,
            hnsw_config={"m": 16, "ef_construct": 64},
        )
    else:
        # In-memory mode (embedded Qdrant, no persistence)
        # Warning: This is for testing only, data will be lost on restart
        document_store = QdrantDocumentStore(
            location=":memory:",  # Special value for in-memory storage
            index=colln_name,
            embedding_dim=384,
            hnsw_config={"m": 16, "ef_construct": 64},
        )
    
    # Write documents with overwrite policy
    document_store.write_documents(
        documents_with_embeddings["documents"],
        policy=DuplicatePolicy.OVERWRITE 
    )

    storage_type = "persistent (server)" if persist else "in-memory (temporary)"
    print(f"Vector DB is updated with {len(documents)} documents")
    print(f"Storage type: {storage_type}")
    print(f"Current document_store size = {document_store.count_documents()}")
    return document_store

def delete_collection(collection_name: str) -> bool:
    """
    Delete a Qdrant collection and all its data.

    Returns:
        True if the collection existed and was deleted, False if it didn't exist.
    """

    # Optional: check existence first (avoids noisy errors/logs)
    exists = qdrt_client.collection_exists(collection_name=collection_name)
    if not exists:
        print(f"Collection '{collection_name}' does not exist.")
        return False

    qdrt_client.delete_collection(collection_name=collection_name)
    print(f"Collection '{collection_name}' deleted successfully.")
    return True