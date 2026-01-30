#!/usr/bin/env python3
"""Backfill embeddings for archival_memory entries missing them.

Usage:
    cd ~/.claude/scripts/core
    uv run python -m core.backfill_embeddings

This script:
1. Finds all archival_memory entries with embedding IS NULL
2. Generates embeddings using local BGE model (no API cost)
3. Updates each entry with the generated embedding
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# Load environment
global_env = Path.home() / ".claude" / ".env"
if global_env.exists():
    load_dotenv(global_env)
load_dotenv()

# Add project to path
project_dir = os.environ.get("CLAUDE_PROJECT_DIR", str(Path(__file__).parent.parent))
sys.path.insert(0, project_dir)


async def backfill():
    """Backfill embeddings for entries missing them."""
    from core.db.postgres_pool import get_connection, init_pgvector
    from core.db.embedding_service import EmbeddingService

    print("Initializing BGE embedding model...")
    embedder = EmbeddingService(provider="local")
    print(f"Model loaded. Embedding dimension: {embedder.dimension}")

    async with get_connection() as conn:
        # Find entries without embeddings
        rows = await conn.fetch("""
            SELECT id, content FROM archival_memory
            WHERE embedding IS NULL
        """)

        if not rows:
            print("No entries need backfilling.")
            return

        print(f"Found {len(rows)} entries to backfill.")

        for i, row in enumerate(rows):
            content = row["content"]
            memory_id = str(row["id"])

            print(f"[{i+1}/{len(rows)}] Generating embedding for {memory_id[:8]}...")

            # Generate embedding
            embedding = await embedder.embed(content)

            # Update entry
            await init_pgvector(conn)
            await conn.execute("""
                UPDATE archival_memory
                SET embedding = $1::vector
                WHERE id = $2
            """, embedding, row["id"])

            print(f"  ✓ Updated ({len(embedding)} dims)")

    print(f"\nBackfill complete. {len(rows)} entries updated.")


if __name__ == "__main__":
    asyncio.run(backfill())
