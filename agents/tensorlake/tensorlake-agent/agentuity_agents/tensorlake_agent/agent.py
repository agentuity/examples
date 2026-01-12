"""
TensorLake Agent - Document AI & Distributed Applications

This agent provides:
1. Document parsing with signature detection
2. Structured data extraction from documents
3. Text analysis using TensorLake distributed functions
"""

import os
import re
import json
from typing import List, Tuple, Optional
from pydantic import BaseModel
from agentuity import AgentRequest, AgentResponse, AgentContext

# TensorLake imports
from tensorlake.applications import application, function, run_local_application, Request
from tensorlake.documentai import DocumentAI, ParseStatus, ParsingOptions, StructuredExtractionOptions


# ============================================================================
# Document AI Schemas
# ============================================================================

class Buyer(BaseModel):
    """Schema for buyer information extraction."""
    buyer_name: str
    buyer_signature_date: str
    buyer_signed: bool


class Seller(BaseModel):
    """Schema for seller information extraction."""
    seller_name: str
    seller_signature_date: str
    seller_signed: bool


class RealEstateSchema(BaseModel):
    """Schema for real estate document extraction."""
    buyer: Buyer
    seller: Seller


class InvoiceLineItem(BaseModel):
    """Schema for invoice line items."""
    description: str
    quantity: int
    unit_price: float
    total: float


class InvoiceSchema(BaseModel):
    """Schema for invoice extraction."""
    invoice_number: str
    invoice_date: str
    vendor_name: str
    total_amount: float
    line_items: List[InvoiceLineItem]


class ContractParty(BaseModel):
    """Schema for contract party extraction."""
    name: str
    role: str
    signed: bool
    signature_date: Optional[str] = None


class ContractSchema(BaseModel):
    """Schema for general contract extraction."""
    contract_type: str
    effective_date: str
    parties: List[ContractParty]
    key_terms: List[str]


# Schema registry for easy lookup
SCHEMAS = {
    "real-estate": RealEstateSchema,
    "invoice": InvoiceSchema,
    "contract": ContractSchema,
}


# ============================================================================
# Text Analysis Functions (Distributed TensorLake)
# ============================================================================

EXCLUDE = {
    "the", "and", "of", "to", "in", "a", "is", "for", "on", "as", "by", "with",
    "that", "from", "at", "an", "be", "it", "or", "are", "was", "this", "which",
    "also", "has", "have", "had", "been", "will", "would", "could", "should"
}


@function(description="Return top-K non-stopword tokens from a text blob")
def topk_words(text: str, k: int = 25) -> List[Tuple[str, int]]:
    """Extract the most frequent words from text, excluding common stopwords."""
    counts = {}
    for tok in re.findall(r"[A-Za-z]{2,}", text.lower()):
        if tok in EXCLUDE:
            continue
        counts[tok] = counts.get(tok, 0) + 1
    return sorted(counts.items(), key=lambda x: x[1], reverse=True)[:k]


class AnalyzeTextRequest(BaseModel):
    """Request parameters for text analysis."""
    text: str
    k: int = 25


@application()
@function()
def analyze_text(request: AnalyzeTextRequest) -> dict:
    """TensorLake application for text analysis."""
    topk = topk_words(request.text, request.k)
    return {
        "total_unique_words": len(set(re.findall(r"[A-Za-z]{2,}", request.text.lower()))),
        "k": request.k,
        "topk": topk
    }


# ============================================================================
# Agentuity Agent Handler
# ============================================================================

def welcome():
    """Welcome message with example prompts."""
    return {
        "welcome": "Welcome to the TensorLake Agent! I can parse documents, extract structured data, and analyze text.",
        "prompts": [
            {
                "data": '{"action": "parse", "schema": "real-estate", "demo": true}',
                "contentType": "application/json"
            },
            {
                "data": '{"action": "parse", "file_url": "https://tlake.link/lease-agreement", "schema": "real-estate"}',
                "contentType": "application/json"
            },
            {
                "data": '{"action": "analyze", "text": "TensorLake is a platform for distributed Python applications.", "k": 5}',
                "contentType": "application/json"
            }
        ]
    }


async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    """
    Main agent handler.
    
    Actions:
    - "parse": Parse a document with optional signature detection and schema extraction
    - "status": Check status of a parse job
    - "analyze": Run text analysis locally via TensorLake
    - "schemas": List available extraction schemas
    """
    try:
        # Parse request
        data = await request.data.json()
        
        if data is None:
            return response.json({
                "message": "TensorLake Document AI Agent ready",
                "actions": {
                    "parse": "Parse a document with signature detection and structured extraction",
                    "status": "Check status of a parse job",
                    "analyze": "Run text analysis locally",
                    "schemas": "List available extraction schemas"
                },
                "example_parse": {
                    "action": "parse",
                    "file_url": "https://tlake.link/lease-agreement",
                    "schema": "real-estate",
                    "detect_signatures": True
                }
            })
        
        action = data.get("action", "parse")
        
        # ====================================================================
        # Parse Document with DocumentAI
        # ====================================================================
        if action == "parse":
            file_url = data.get("file_url") or data.get("file")
            schema_name = data.get("schema")
            # Default to False to avoid quota issues - set to True if you have quota
            detect_signatures = data.get("detect_signatures", False)
            wait_for_result = data.get("wait", True)
            demo_mode = data.get("demo", False)
            
            # Demo mode - return sample data without hitting the API
            if demo_mode:
                context.logger.info("Running in DEMO mode - returning sample data")
                
                demo_responses = {
                    "real-estate": {
                        "status": "success",
                        "mode": "demo",
                        "parse_id": "demo_real_estate_001",
                        "structured_data": [{
                            "buyer": {
                                "buyer_name": "Nova Ellison",
                                "buyer_signature_date": "September 10, 2025",
                                "buyer_signed": True
                            },
                            "seller": {
                                "seller_name": "Juno Vega",
                                "seller_signature_date": "September 10, 2025",
                                "seller_signed": True
                            }
                        }],
                        "chunk_count": 10,
                        "chunk_preview": [
                            {"index": 0, "content_preview": "## RESIDENTIAL REAL ESTATE PURCHASE AGREEMENT\n\nI. THE PARTIES. This Real Estate Purchase Agreement..."},
                            {"index": 1, "content_preview": "II. LEGAL DESCRIPTION. The real property is a: Single-Family Home\nStreet Address: 789 Solution Ln..."},
                            {"index": 2, "content_preview": "IV. EARNEST MONEY. After acceptance by all Parties, the Buyer agrees to make a payment of $10,000..."}
                        ],
                        "signatures_detected": [
                            {"page": 1, "type": "initials", "signer": "buyer"},
                            {"page": 1, "type": "initials", "signer": "seller"},
                            {"page": 10, "type": "full_signature", "signer": "Nova Ellison (Buyer)"},
                            {"page": 10, "type": "full_signature", "signer": "Juno Vega (Seller)"},
                            {"page": 10, "type": "full_signature", "signer": "Aster Polaris (Agent)"}
                        ]
                    },
                    "invoice": {
                        "status": "success",
                        "mode": "demo",
                        "parse_id": "demo_invoice_001",
                        "structured_data": [{
                            "invoice_number": "INV-2025-0042",
                            "invoice_date": "2025-12-01",
                            "vendor_name": "TensorLake Cloud Services",
                            "total_amount": 1549.99,
                            "line_items": [
                                {"description": "DocumentAI Pro - Monthly", "quantity": 1, "unit_price": 999.99, "total": 999.99},
                                {"description": "Signature Detection (500 pages)", "quantity": 1, "unit_price": 350.00, "total": 350.00},
                                {"description": "API Calls Overage", "quantity": 2000, "unit_price": 0.10, "total": 200.00}
                            ]
                        }],
                        "chunk_count": 2
                    },
                    "contract": {
                        "status": "success",
                        "mode": "demo",
                        "parse_id": "demo_contract_001",
                        "structured_data": [{
                            "contract_type": "Service Agreement",
                            "effective_date": "2025-01-01",
                            "parties": [
                                {"name": "Acme Corp", "role": "Client", "signed": True, "signature_date": "2024-12-15"},
                                {"name": "TensorLake Inc", "role": "Provider", "signed": True, "signature_date": "2024-12-16"}
                            ],
                            "key_terms": [
                                "12-month term with auto-renewal",
                                "99.9% uptime SLA",
                                "30-day termination notice required",
                                "Confidentiality clause included"
                            ]
                        }],
                        "chunk_count": 8
                    }
                }
                
                # Return demo data for the requested schema
                if schema_name and schema_name in demo_responses:
                    return response.json(demo_responses[schema_name])
                else:
                    # Generic demo response
                    return response.json({
                        "status": "success",
                        "mode": "demo",
                        "parse_id": "demo_generic_001",
                        "message": "Demo mode - specify a schema for richer sample data",
                        "available_schemas": list(SCHEMAS.keys()),
                        "chunk_count": 5,
                        "chunk_preview": [
                            {"index": 0, "content_preview": "This is a sample document chunk from demo mode..."}
                        ]
                    })
            
            if not file_url:
                return response.json({
                    "error": "Missing file_url",
                    "example": {
                        "action": "parse",
                        "file_url": "https://tlake.link/lease-agreement",
                        "schema": "real-estate",
                        "detect_signatures": False
                    },
                    "note": "Set detect_signatures: true only if you have signature detection quota"
                })
            
            context.logger.info("Parsing document: %s (signatures: %s)", file_url, detect_signatures)
            
            # Initialize DocumentAI client
            doc_ai = DocumentAI()
            
            # Configure parsing options
            parsing_options = ParsingOptions(signature_detection=detect_signatures)
            
            # Configure structured extraction if schema provided
            extraction_options = None
            if schema_name and schema_name in SCHEMAS:
                extraction_options = [
                    StructuredExtractionOptions(
                        schema_name=schema_name,
                        json_schema=SCHEMAS[schema_name]
                    )
                ]
                context.logger.info("Using schema: %s", schema_name)
            
            # Submit parse job
            parse_id = doc_ai.parse(
                file=file_url,
                parsing_options=parsing_options,
                structured_extraction_options=extraction_options,
            )
            
            context.logger.info("Parse job submitted: %s", parse_id)
            
            # If not waiting, return the parse_id immediately
            if not wait_for_result:
                return response.json({
                    "status": "submitted",
                    "parse_id": parse_id,
                    "message": "Use 'status' action to check progress"
                })
            
            # Wait for completion
            context.logger.info("Waiting for parse completion...")
            result = doc_ai.wait_for_completion(parse_id)
            
            if result.status == ParseStatus.FAILURE:
                error_msg = getattr(result, 'error', None) or "Document parsing failed"
                context.logger.error("Parse job failed: %s", error_msg)
                
                # Check if it's a quota error and suggest retry without signatures
                if "quota" in str(error_msg).lower() or "signature" in str(error_msg).lower():
                    return response.json({
                        "status": "failed",
                        "parse_id": parse_id,
                        "error": str(error_msg),
                        "suggestion": "Try again with detect_signatures: false to avoid quota limits"
                    })
                
                return response.json({
                    "status": "failed",
                    "parse_id": parse_id,
                    "error": str(error_msg)
                })
            
            context.logger.info("Parse completed successfully")
            
            # Build response
            response_data = {
                "status": "success",
                "parse_id": parse_id,
            }
            
            # Add structured data if available
            if result.structured_data:
                response_data["structured_data"] = [
                    sd.data for sd in result.structured_data
                ]
            
            # Add chunk summaries (first 5 chunks)
            if result.chunks:
                response_data["chunk_count"] = len(result.chunks)
                response_data["chunk_preview"] = [
                    {
                        "index": i,
                        "content_preview": chunk.content[:200] + "..." if len(chunk.content) > 200 else chunk.content
                    }
                    for i, chunk in enumerate(result.chunks[:5])
                ]
            
            return response.json(response_data)
        
        # ====================================================================
        # Check Parse Status
        # ====================================================================
        elif action == "status":
            parse_id = data.get("parse_id")
            
            if not parse_id:
                return response.json({"error": "Missing parse_id"})
            
            doc_ai = DocumentAI()
            result = doc_ai.wait_for_completion(parse_id)
            
            response_data = {
                "parse_id": parse_id,
                "status": "success" if result.status == ParseStatus.SUCCESS else "failed"
            }
            
            if result.structured_data:
                response_data["structured_data"] = [
                    sd.data for sd in result.structured_data
                ]
            
            if result.chunks:
                response_data["chunk_count"] = len(result.chunks)
            
            return response.json(response_data)
        
        # ====================================================================
        # List Available Schemas
        # ====================================================================
        elif action == "schemas":
            schemas_info = {}
            for name, schema_class in SCHEMAS.items():
                schemas_info[name] = {
                    "description": schema_class.__doc__ or f"Schema for {name} extraction",
                    "fields": list(schema_class.model_fields.keys())
                }
            
            return response.json({
                "available_schemas": schemas_info,
                "usage": "Include 'schema': '<schema-name>' in your parse request"
            })
        
        # ====================================================================
        # Text Analysis (Local TensorLake)
        # ====================================================================
        elif action == "analyze":
            text = data.get("text", "")
            k = data.get("k", 25)
            
            if not text:
                return response.json({"error": "No text provided for analysis"})
            
            context.logger.info("Running local TensorLake analysis with k=%d", k)
            
            tl_request: Request = run_local_application(
                analyze_text,
                AnalyzeTextRequest(text=text, k=k)
            )
            output = tl_request.output()
            
            return response.json({
                "status": "success",
                "mode": "local",
                "result": output
            })
        
        else:
            return response.json({
                "error": f"Unknown action: {action}",
                "valid_actions": ["parse", "status", "analyze", "schemas"]
            })
            
    except Exception as e:
        context.logger.error("Error in TensorLake agent: %s", str(e))
        return response.json({
            "error": str(e),
            "type": type(e).__name__
        })
