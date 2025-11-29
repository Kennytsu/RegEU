"""
RAG API endpoint for regulatory intelligence queries
"""
import logging
from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel

from app.services.rag_service import RAGService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/rag", tags=["rag"])


class RAGQueryRequest(BaseModel):
    """Request model for RAG queries"""
    query: str
    top_k: int = 10


class SourceDocument(BaseModel):
    """Individual source document used in RAG"""
    content: str
    source_table: str
    similarity: float


class RAGResponse(BaseModel):
    """RAG query response with LLM-generated answer and sources"""
    success: bool
    query: str
    llm_answer: str
    source_documents: list[SourceDocument]
    metadata: dict = {}


@router.post("/query", response_model=RAGResponse)
async def query_rag(request: RAGQueryRequest):
    """
    Query the RAG system for regulatory intelligence
    
    Args:
        request: RAGQueryRequest with query and optional top_k
        
    Returns:
        RAGResponse with LLM-generated answer and source documents
    """
    try:
        # Validate query is not too short
        if len(request.query.strip()) < 3:
            return RAGResponse(
                success=False,
                query=request.query,
                llm_answer="Please enter a more specific question (at least 3 characters) about EU regulations.",
                source_documents=[],
                metadata={"error": "Query too short"}
            )
        
        logger.info(f"Processing RAG query: {request.query}")
        
        # Initialize RAG service
        rag_service = RAGService()
        
        # Retrieve relevant chunks
        context, source_docs = rag_service.retrieve_relevant_chunks(
            query=request.query,
            top_k=request.top_k
        )
        
        if not context:
            return RAGResponse(
                success=False,
                query=request.query,
                llm_answer="No relevant documents found for your query.",
                source_documents=[],
                metadata={"error": "No context retrieved"}
            )
        
        # Generate LLM answer based on context
        llm_answer = rag_service.generate_answer(
            query=request.query,
            context=context
        )
        
        if not llm_answer:
            return RAGResponse(
                success=False,
                query=request.query,
                llm_answer="Failed to generate answer from context.",
                source_documents=[],
                metadata={"error": "LLM generation failed"}
            )
        
        # Convert source documents to response format
        formatted_sources = [
            SourceDocument(
                content=doc.get('content_text', ''),
                source_table=doc.get('source_table', 'unknown'),
                similarity=float(doc.get('similarity', 0))
            )
            for doc in source_docs
        ]
        
        logger.info(f"Successfully processed RAG query with {len(formatted_sources)} sources")
        
        return RAGResponse(
            success=True,
            query=request.query,
            llm_answer=llm_answer,
            source_documents=formatted_sources,
            metadata={"sources_count": len(formatted_sources)}
        )
        
    except Exception as e:
        logger.error(f"Error processing RAG query: {str(e)}")
        return RAGResponse(
            success=False,
            query=request.query,
            llm_answer="An error occurred while processing your query.",
            source_documents=[],
            metadata={"error": str(e)}
        )
