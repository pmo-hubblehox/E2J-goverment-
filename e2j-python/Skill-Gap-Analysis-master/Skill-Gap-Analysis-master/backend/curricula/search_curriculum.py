import os
from haystack import Pipeline,AsyncPipeline
from haystack.components.rankers import SentenceTransformersSimilarityRanker
from haystack_integrations.document_stores.chroma import ChromaDocumentStore
from haystack_integrations.components.retrievers.chroma import ChromaQueryTextRetriever
from haystack_integrations.document_stores.qdrant import QdrantDocumentStore
from haystack_integrations.components.retrievers.qdrant import QdrantEmbeddingRetriever
from haystack.components.embedders import SentenceTransformersTextEmbedder
from haystack.utils import Secret
# document_store = ChromaDocumentStore(persist_path="./chromadb")
#
# faq_pipeline = Pipeline()
# faq_pipeline.add_component("retriever", ChromaQueryTextRetriever(document_store=document_store,top_k=20))
# faq_pipeline.add_component("ranker",SentenceTransformersSimilarityRanker(top_k=5))
# faq_pipeline.connect("retriever.documents", "ranker.documents")

def create_faq_pipeline(db_name:str=None,document_store=None):
    if not document_store:
        document_store = QdrantDocumentStore(
                                            url="http://localhost:6333",
                                            index=db_name,
                                            api_key=Secret.from_token(os.getenv("QDRANT_API_KEY")),
                                            embedding_dim=384,
                                            hnsw_config={"m": 16, "ef_construct": 64},
                                            )
    
    faq_pipeline = AsyncPipeline()
    faq_pipeline.add_component("text_embedder", SentenceTransformersTextEmbedder(model="sentence-transformers/all-MiniLM-L12-v2"))
    faq_pipeline.add_component("retriever", QdrantEmbeddingRetriever(document_store=document_store, top_k=10))
    faq_pipeline.add_component("ranker", SentenceTransformersSimilarityRanker(top_k=5))
    faq_pipeline.connect("text_embedder.embedding", "retriever.query_embedding")
    faq_pipeline.connect("retriever.documents", "ranker.documents")
    return faq_pipeline

async def information_search(pipeline: AsyncPipeline, query: str):
    result = await pipeline.run_async(data={
        "text_embedder": {"text": query},
        "ranker": {"query": query}
    })
    retrieved = []
    for doc in result['ranker']['documents']:
        retrieved.append((doc.content, doc.meta.get('page_no', None)))
        
    return retrieved