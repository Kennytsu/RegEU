"""
RAG Service for retrieval and LLM-based answer generation
"""
import logging
import os
from typing import Tuple, List, Dict
from openai import OpenAI
from app.core.supabase_client import supabase

logger = logging.getLogger(__name__)


class RAGService:
    """Service for Retrieval-Augmented Generation using Supabase and OpenAI"""
    
    def __init__(self):
        """Initialize RAG service with Supabase and OpenAI clients"""
        self.supabase = supabase
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.embedding_model = "text-embedding-ada-002"
        self.llm_model = "gpt-4o"
    
    def embed_query(self, query: str) -> List[float]:
        """
        Generate embedding for a query using OpenAI
        
        Args:
            query: User query string
            
        Returns:
            List of floats representing the embedding
        """
        try:
            response = self.openai_client.embeddings.create(
                input=query,
                model=self.embedding_model
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            return []
    
    def retrieve_relevant_chunks(self, query: str, top_k: int = 10) -> Tuple[str, List[Dict]]:
        """
        Retrieve top K similar chunks for RAG:
        1. Embed the query
        2. Search Supabase for similar documents using pgvector
        3. Return formatted context and source documents
        
        Args:
            query: User query
            top_k: Number of top similar documents to retrieve
            
        Returns:
            Tuple of (context_string, list_of_source_documents)
        """
        try:
            # Embed the query
            query_embedding = self.embed_query(query)
            if not query_embedding:
                logger.warning("Failed to generate query embedding")
                return "", []
            
            # Call Supabase RPC function for similarity search
            response = self.supabase.rpc(
                "match_documents_v2",
                {
                    "query_embedding": query_embedding,
                    "match_count": top_k
                }
            ).execute()
            
            if not response.data:
                logger.warning(f"No documents found for query: {query}")
                return "", []
            
            # Format context from retrieved documents
            source_docs = response.data
            context_parts = []
            
            for doc in source_docs:
                context_parts.append(f"Source: {doc.get('source_table', 'Unknown')}\n{doc.get('content_text', '')}")
            
            context = "\n\n---\n\n".join(context_parts)
            
            logger.info(f"Retrieved {len(source_docs)} documents for query")
            return context, source_docs
            
        except Exception as e:
            logger.error(f"Error retrieving chunks: {str(e)}")
            return "", []
    
    def generate_answer(self, query: str, context: str) -> str:
        """
        Generate LLM answer based on query and context
        
        Args:
            query: User query
            context: Retrieved context from documents
            
        Returns:
            LLM-generated answer string
        """
        try:
            system_prompt = """You are an expert in EU regulations and legislative processes. 
            Your role is to provide clear, accurate, and actionable insights about EU regulations, directives, and legislative procedures.
            Always base your answers on the provided context from regulatory documents.
            If information is not in the provided context, clearly state that.
            Provide structured, well-organized responses that are easy to understand.
            Format your response in clear paragraphs and sections without emojis or unnecessary formatting.
            
            IMPORTANT: At the end of your response, always include a "Resources" section that lists the source documents you referenced. Format it as:
            
            **Resources:**
            - [Document Name/Title]
            
            Include only the sources you actually used to answer the question."""
            
            response = self.openai_client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Based on the following regulatory documents:\n\n{context}\n\nPlease answer this question: {query}"}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            answer = response.choices[0].message.content
            logger.info("Successfully generated LLM answer")
            return answer
            
        except Exception as e:
            logger.error(f"Error generating answer: {str(e)}")
            return ""
