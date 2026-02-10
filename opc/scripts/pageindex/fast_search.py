#!/usr/bin/env python
"""
Fast PageIndex Search - FTS or Hybrid RRF mode.

FTS mode: PostgreSQL full-text search only, no model loading, <50ms.
Hybrid mode: FTS + pgvector cosine via Reciprocal Rank Fusion, <500ms.

Usage:
    # FTS (for hooks - fast, no model)
    python -m scripts.pageindex.fast_search --query "debugging workflow" --mode fts

    # Hybrid RRF (for CLI - most accurate)
    python -m scripts.pageindex.fast_search --query "debugging workflow" --mode hybrid

    # Filter to specific document
    python -m scripts.pageindex.fast_search --query "goals" --doc ROADMAP.md --mode fts
"""
import argparse
import json
import os
import sys
from pathlib import Path
from typing import Optional, List

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from scripts.pageindex.pageindex_service import (
    PageIndexService, NodeResult, compute_project_id
)


def search_fts(
    query: str,
    project_path: str,
    doc_path: Optional[str] = None,
    max_results: int = 5,
) -> List[NodeResult]:
    """FTS-only search. No model loading. <50ms."""
    service = PageIndexService()
    try:
        project_id = compute_project_id(project_path)
        return service.search_nodes_fts(project_id, query, doc_path, max_results)
    finally:
        service.close()


def search_hybrid(
    query: str,
    project_path: str,
    doc_path: Optional[str] = None,
    max_results: int = 5,
) -> List[NodeResult]:
    """Hybrid RRF search. Loads embedding model. <500ms with warm model."""
    import asyncio
    from scripts.core.db.embedding_service import EmbeddingService

    service = PageIndexService()
    try:
        project_id = compute_project_id(project_path)

        # Get query embedding
        provider = os.getenv("EMBEDDING_PROVIDER", "local")
        embedder = EmbeddingService(provider=provider)
        query_embedding = asyncio.run(embedder.embed(query))

        return service.search_nodes_hybrid(
            project_id, query, query_embedding, doc_path, max_results
        )
    finally:
        service.close()


def format_results_json(results: List[NodeResult]) -> str:
    """Format results as JSON for subprocess consumption."""
    return json.dumps({
        "results": [
            {
                "node_id": r.node_id,
                "title": r.title,
                "text": r.text[:500] if r.text else "",
                "line_num": r.line_num,
                "relevance_reason": f"FTS match (score: {r.score:.3f})",
                "confidence": min(r.score, 1.0),
                "doc_path": r.doc_path,
                "depth": r.depth,
            }
            for r in results
        ]
    })


def main():
    parser = argparse.ArgumentParser(
        description="Fast PageIndex search (FTS or Hybrid RRF)"
    )
    parser.add_argument("--query", "-q", required=True, help="Search query")
    parser.add_argument(
        "--project", "-p", default=os.getcwd(), help="Project root path"
    )
    parser.add_argument("--doc", "-d", default=None, help="Filter to specific doc")
    parser.add_argument(
        "--mode", "-m", choices=["fts", "hybrid"], default="fts",
        help="Search mode: fts (fast, no model) or hybrid (FTS+vector RRF)"
    )
    parser.add_argument(
        "--max-results", "-n", type=int, default=5, help="Max results"
    )

    args = parser.parse_args()
    project_path = os.path.abspath(args.project)

    if args.mode == "fts":
        results = search_fts(args.query, project_path, args.doc, args.max_results)
    else:
        results = search_hybrid(args.query, project_path, args.doc, args.max_results)

    print(format_results_json(results))
    return 0


if __name__ == "__main__":
    sys.exit(main())
