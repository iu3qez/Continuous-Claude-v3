"""
PageIndex Service - CRUD operations for tree indexes in PostgreSQL.

Stores and retrieves hierarchical tree structures for markdown documents.
"""
import os
import json
import hashlib
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from enum import Enum

try:
    import asyncpg
except ImportError:
    asyncpg = None

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor, Json
except ImportError:
    psycopg2 = None


class DocType(Enum):
    ROADMAP = "ROADMAP"
    DOCUMENTATION = "DOCUMENTATION"
    ARCHITECTURE = "ARCHITECTURE"
    README = "README"
    OTHER = "OTHER"


@dataclass
class NodeResult:
    """A flattened node returned from search."""
    node_id: str
    doc_path: str
    title: str
    text: str = ""
    line_num: Optional[int] = None
    depth: int = 0
    score: float = 0.0
    parent_node_id: Optional[str] = None


@dataclass
class TreeIndex:
    id: Optional[str] = None
    project_id: str = ""
    doc_path: str = ""
    doc_type: DocType = DocType.OTHER
    tree_structure: Dict[str, Any] = field(default_factory=dict)
    doc_hash: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


def get_database_url() -> str:
    """Get database URL from environment."""
    return os.getenv(
        "DATABASE_URL",
        "postgresql://claude:claude_dev@localhost:5432/continuous_claude"
    )


def compute_doc_hash(content: str) -> str:
    """Compute SHA256 hash of document content."""
    return hashlib.sha256(content.encode()).hexdigest()


def detect_doc_type(doc_path: str) -> DocType:
    """Detect document type from filename."""
    name = Path(doc_path).name.upper()
    if "ROADMAP" in name:
        return DocType.ROADMAP
    elif "ARCHITECTURE" in name:
        return DocType.ARCHITECTURE
    elif "README" in name:
        return DocType.README
    elif any(x in name for x in ["DOC", "GUIDE", "MANUAL", "REFERENCE"]):
        return DocType.DOCUMENTATION
    return DocType.OTHER


def compute_project_id(project_path: str) -> str:
    """Compute project ID from project path (hash).

    Normalizes path separators so forward/backslash yield the same ID.
    """
    normalized = project_path.replace("/", os.sep).replace("\\", os.sep)
    return hashlib.sha256(normalized.encode()).hexdigest()[:16]


class PageIndexService:
    """Service for managing PageIndex tree structures in PostgreSQL."""

    def __init__(self, database_url: Optional[str] = None):
        self.database_url = database_url or get_database_url()
        self._conn = None

    def _get_sync_connection(self):
        """Get synchronous psycopg2 connection."""
        if psycopg2 is None:
            raise ImportError("psycopg2 not installed. Run: pip install psycopg2-binary")
        if self._conn is None or self._conn.closed:
            self._conn = psycopg2.connect(self.database_url)
        return self._conn

    def close(self):
        """Close database connection."""
        if self._conn and not self._conn.closed:
            self._conn.close()
            self._conn = None

    def store_tree(
        self,
        project_path: str,
        doc_path: str,
        tree_structure: Dict[str, Any],
        doc_content: Optional[str] = None
    ) -> TreeIndex:
        """
        Store or update a tree index.

        Args:
            project_path: Absolute path to project root
            doc_path: Relative path to document within project
            tree_structure: The tree index structure (from PageIndex)
            doc_content: Optional document content for hash computation

        Returns:
            TreeIndex with the stored data
        """
        conn = self._get_sync_connection()
        project_id = compute_project_id(project_path)
        doc_type = detect_doc_type(doc_path)
        doc_hash = compute_doc_hash(doc_content) if doc_content else None

        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO pageindex_trees (project_id, doc_path, doc_type, tree_structure, doc_hash, updated_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
                ON CONFLICT (project_id, doc_path)
                DO UPDATE SET
                    tree_structure = EXCLUDED.tree_structure,
                    doc_hash = EXCLUDED.doc_hash,
                    doc_type = EXCLUDED.doc_type,
                    updated_at = NOW()
                RETURNING id, project_id, doc_path, doc_type, tree_structure, doc_hash, created_at, updated_at
            """, (project_id, doc_path, doc_type.value, Json(tree_structure), doc_hash))

            row = cur.fetchone()
            conn.commit()

        return TreeIndex(
            id=str(row['id']),
            project_id=row['project_id'],
            doc_path=row['doc_path'],
            doc_type=DocType(row['doc_type']),
            tree_structure=row['tree_structure'],
            doc_hash=row['doc_hash'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )

    def get_tree(self, project_path: str, doc_path: str) -> Optional[TreeIndex]:
        """
        Get a tree index by project and document path.

        Args:
            project_path: Absolute path to project root
            doc_path: Relative path to document

        Returns:
            TreeIndex if found, None otherwise
        """
        conn = self._get_sync_connection()
        project_id = compute_project_id(project_path)

        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT id, project_id, doc_path, doc_type, tree_structure, doc_hash, created_at, updated_at
                FROM pageindex_trees
                WHERE project_id = %s AND doc_path = %s
            """, (project_id, doc_path))

            row = cur.fetchone()

        if not row:
            return None

        return TreeIndex(
            id=str(row['id']),
            project_id=row['project_id'],
            doc_path=row['doc_path'],
            doc_type=DocType(row['doc_type']),
            tree_structure=row['tree_structure'],
            doc_hash=row['doc_hash'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )

    def list_trees(
        self,
        project_path: Optional[str] = None,
        doc_type: Optional[DocType] = None
    ) -> List[TreeIndex]:
        """
        List tree indexes, optionally filtered by project or doc type.

        Args:
            project_path: Optional project path to filter by
            doc_type: Optional document type to filter by

        Returns:
            List of TreeIndex objects (without full tree_structure for efficiency)
        """
        conn = self._get_sync_connection()

        conditions = []
        params = []

        if project_path:
            project_id = compute_project_id(project_path)
            conditions.append("project_id = %s")
            params.append(project_id)

        if doc_type:
            conditions.append("doc_type = %s")
            params.append(doc_type.value)

        where_clause = " AND ".join(conditions) if conditions else "TRUE"

        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(f"""
                SELECT id, project_id, doc_path, doc_type, doc_hash, created_at, updated_at,
                       jsonb_array_length(COALESCE(tree_structure->'structure', '[]'::jsonb)) as node_count
                FROM pageindex_trees
                WHERE {where_clause}
                ORDER BY updated_at DESC
            """, params)

            rows = cur.fetchall()

        return [
            TreeIndex(
                id=str(row['id']),
                project_id=row['project_id'],
                doc_path=row['doc_path'],
                doc_type=DocType(row['doc_type']),
                tree_structure={"node_count": row.get('node_count', 0)},
                doc_hash=row['doc_hash'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            )
            for row in rows
        ]

    def delete_tree(self, project_path: str, doc_path: str) -> bool:
        """
        Delete a tree index.

        Args:
            project_path: Absolute path to project root
            doc_path: Relative path to document

        Returns:
            True if deleted, False if not found
        """
        conn = self._get_sync_connection()
        project_id = compute_project_id(project_path)

        with conn.cursor() as cur:
            cur.execute("""
                DELETE FROM pageindex_trees
                WHERE project_id = %s AND doc_path = %s
                RETURNING id
            """, (project_id, doc_path))

            deleted = cur.fetchone() is not None
            conn.commit()

        return deleted

    def needs_reindex(self, project_path: str, doc_path: str, current_content: str) -> bool:
        """
        Check if document needs reindexing (content changed).

        Args:
            project_path: Project root path
            doc_path: Document path
            current_content: Current document content

        Returns:
            True if document has changed and needs reindexing
        """
        tree = self.get_tree(project_path, doc_path)
        if not tree:
            return True

        current_hash = compute_doc_hash(current_content)
        return tree.doc_hash != current_hash

    def get_all_project_trees(self, project_path: str) -> Dict[str, TreeIndex]:
        """
        Get all tree indexes for a project.

        Args:
            project_path: Project root path

        Returns:
            Dict mapping doc_path to TreeIndex
        """
        trees = self.list_trees(project_path=project_path)
        return {t.doc_path: t for t in trees}

    # --- Node flattening, storage, and search ---

    def flatten_tree_nodes(
        self,
        tree_structure: Dict[str, Any],
        doc_path: str,
        parent_id: Optional[str] = None,
        depth: int = 0,
    ) -> List[Dict[str, Any]]:
        """Recursively flatten a tree structure into flat node rows.

        Args:
            tree_structure: Tree JSONB (has 'structure' key with list of nodes)
            doc_path: Document path
            parent_id: Parent node ID for recursion
            depth: Current depth level

        Returns:
            List of flat node dicts ready for DB insertion
        """
        nodes = []
        structure = tree_structure.get("structure", [])
        if not isinstance(structure, list):
            return nodes

        for node in structure:
            node_id = node.get("node_id", node.get("id", node.get("title", f"node-{depth}-{len(nodes)}")))
            title = node.get("title", "")
            text = node.get("text", "")
            line_num = node.get("line_num")

            nodes.append({
                "node_id": str(node_id),
                "doc_path": doc_path,
                "parent_node_id": parent_id,
                "title": title,
                "text": text[:2000] if text else "",
                "line_num": line_num,
                "depth": depth,
            })

            # Recurse into children
            children = node.get("nodes", node.get("children", []))
            if children:
                child_tree = {"structure": children}
                child_nodes = self.flatten_tree_nodes(
                    child_tree, doc_path, parent_id=str(node_id), depth=depth + 1
                )
                nodes.extend(child_nodes)

        return nodes

    def store_nodes(
        self,
        project_id: str,
        nodes: List[Dict[str, Any]],
        embeddings: Optional[List[Optional[List[float]]]] = None,
    ) -> int:
        """Upsert flattened nodes into pageindex_nodes.

        Args:
            project_id: Project ID hash
            nodes: List of flat node dicts from flatten_tree_nodes
            embeddings: Optional list of embedding vectors (same length as nodes)

        Returns:
            Number of nodes stored
        """
        if not nodes:
            return 0

        conn = self._get_sync_connection()
        count = 0

        with conn.cursor() as cur:
            for i, node in enumerate(nodes):
                embedding = None
                if embeddings and i < len(embeddings):
                    embedding = embeddings[i]

                if embedding:
                    cur.execute("""
                        INSERT INTO pageindex_nodes
                            (project_id, doc_path, node_id, parent_node_id, title, text, line_num, depth, embedding)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s::vector)
                        ON CONFLICT (project_id, doc_path, node_id)
                        DO UPDATE SET
                            parent_node_id = EXCLUDED.parent_node_id,
                            title = EXCLUDED.title,
                            text = EXCLUDED.text,
                            line_num = EXCLUDED.line_num,
                            depth = EXCLUDED.depth,
                            embedding = EXCLUDED.embedding,
                            created_at = NOW()
                    """, (
                        project_id, node["doc_path"], node["node_id"],
                        node["parent_node_id"], node["title"], node["text"],
                        node["line_num"], node["depth"],
                        str(embedding),
                    ))
                else:
                    cur.execute("""
                        INSERT INTO pageindex_nodes
                            (project_id, doc_path, node_id, parent_node_id, title, text, line_num, depth)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (project_id, doc_path, node_id)
                        DO UPDATE SET
                            parent_node_id = EXCLUDED.parent_node_id,
                            title = EXCLUDED.title,
                            text = EXCLUDED.text,
                            line_num = EXCLUDED.line_num,
                            depth = EXCLUDED.depth,
                            created_at = NOW()
                    """, (
                        project_id, node["doc_path"], node["node_id"],
                        node["parent_node_id"], node["title"], node["text"],
                        node["line_num"], node["depth"],
                    ))
                count += 1

            conn.commit()

        return count

    def delete_nodes_for_doc(self, project_id: str, doc_path: str) -> int:
        """Delete all nodes for a specific document (before re-flattening).

        Returns:
            Number of nodes deleted
        """
        conn = self._get_sync_connection()
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM pageindex_nodes WHERE project_id = %s AND doc_path = %s",
                (project_id, doc_path),
            )
            count = cur.rowcount
            conn.commit()
        return count

    def search_nodes_fts(
        self,
        project_id: str,
        query: str,
        doc_path: Optional[str] = None,
        max_results: int = 5,
    ) -> List[NodeResult]:
        """Full-text search on pageindex_nodes. No model loading required.

        Args:
            project_id: Project ID hash
            query: Search query text
            doc_path: Optional filter to specific document
            max_results: Maximum results to return

        Returns:
            List of NodeResult sorted by FTS relevance
        """
        conn = self._get_sync_connection()

        doc_filter = ""
        where_params: list = [project_id, query]
        if doc_path:
            doc_filter = "AND doc_path = %s"
            where_params.append(doc_path)

        # Params order must match SQL placeholder order:
        # 1. query (ts_rank_cd in SELECT)
        # 2. project_id (WHERE)
        # 3. query (WHERE fts match)
        # 4. [doc_path] (WHERE optional)
        # 5. max_results (LIMIT)
        all_params: list = [query] + where_params + [max_results]

        sql = f"""
            SELECT node_id, doc_path, title, text, line_num, depth, parent_node_id,
                   ts_rank_cd(fts_vector, plainto_tsquery('english', %s)) AS score
            FROM pageindex_nodes
            WHERE project_id = %s
              AND fts_vector @@ plainto_tsquery('english', %s)
              {doc_filter}
            ORDER BY score DESC
            LIMIT %s
        """

        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, all_params)
            rows = cur.fetchall()

        return [
            NodeResult(
                node_id=row["node_id"],
                doc_path=row["doc_path"],
                title=row["title"],
                text=row["text"] or "",
                line_num=row["line_num"],
                depth=row["depth"] or 0,
                score=float(row["score"]),
                parent_node_id=row["parent_node_id"],
            )
            for row in rows
        ]

    def search_nodes_hybrid(
        self,
        project_id: str,
        query: str,
        query_embedding: List[float],
        doc_path: Optional[str] = None,
        max_results: int = 5,
        rrf_k: int = 60,
    ) -> List[NodeResult]:
        """Hybrid RRF search combining FTS + vector cosine similarity.

        Args:
            project_id: Project ID hash
            query: Search query text
            query_embedding: Pre-computed query embedding vector
            doc_path: Optional filter to specific document
            max_results: Maximum results to return
            rrf_k: RRF constant (default 60)

        Returns:
            List of NodeResult sorted by RRF score
        """
        conn = self._get_sync_connection()

        doc_filter = ""
        params: list = [query, project_id]
        if doc_path:
            doc_filter = "AND doc_path = %s"
            params.append(doc_path)

        # Build the RRF query
        # We need to duplicate params for both CTEs
        vector_params = [str(query_embedding), project_id]
        if doc_path:
            vector_params.append(doc_path)

        all_params = params + vector_params + [rrf_k, rrf_k, max_results]

        sql = f"""
            WITH fts_ranked AS (
                SELECT id, node_id, doc_path, title, text, line_num, depth, parent_node_id,
                       ROW_NUMBER() OVER (
                           ORDER BY ts_rank_cd(fts_vector, plainto_tsquery('english', %s)) DESC
                       ) AS fts_rank
                FROM pageindex_nodes
                WHERE project_id = %s
                  AND fts_vector @@ plainto_tsquery('english', %s)
                  {doc_filter}
            ),
            vector_ranked AS (
                SELECT id, node_id, doc_path, title, text, line_num, depth, parent_node_id,
                       ROW_NUMBER() OVER (
                           ORDER BY embedding <=> %s::vector
                       ) AS vec_rank
                FROM pageindex_nodes
                WHERE project_id = %s
                  AND embedding IS NOT NULL
                  {doc_filter}
            ),
            combined AS (
                SELECT
                    COALESCE(f.id, v.id) AS id,
                    COALESCE(f.node_id, v.node_id) AS node_id,
                    COALESCE(f.doc_path, v.doc_path) AS doc_path,
                    COALESCE(f.title, v.title) AS title,
                    COALESCE(f.text, v.text) AS text,
                    COALESCE(f.line_num, v.line_num) AS line_num,
                    COALESCE(f.depth, v.depth) AS depth,
                    COALESCE(f.parent_node_id, v.parent_node_id) AS parent_node_id,
                    COALESCE(1.0 / (%s + f.fts_rank), 0) +
                    COALESCE(1.0 / (%s + v.vec_rank), 0) AS rrf_score
                FROM fts_ranked f
                FULL OUTER JOIN vector_ranked v ON f.id = v.id
            )
            SELECT node_id, doc_path, title, text, line_num, depth, parent_node_id, rrf_score
            FROM combined
            ORDER BY rrf_score DESC
            LIMIT %s
        """

        # Fix params: fts CTE needs query twice (plainto_tsquery used twice), plus doc_filter
        fts_params: list = [query, project_id, query]
        if doc_path:
            fts_params.append(doc_path)
        vec_params: list = [str(query_embedding), project_id]
        if doc_path:
            vec_params.append(doc_path)
        final_params = fts_params + vec_params + [rrf_k, rrf_k, max_results]

        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, final_params)
            rows = cur.fetchall()

        return [
            NodeResult(
                node_id=row["node_id"],
                doc_path=row["doc_path"],
                title=row["title"],
                text=row["text"] or "",
                line_num=row["line_num"],
                depth=row["depth"] or 0,
                score=float(row["rrf_score"]),
                parent_node_id=row["parent_node_id"],
            )
            for row in rows
        ]

    def count_nodes(self, project_id: str, doc_path: Optional[str] = None) -> int:
        """Count nodes for a project, optionally filtered by doc_path."""
        conn = self._get_sync_connection()
        if doc_path:
            sql = "SELECT COUNT(*) FROM pageindex_nodes WHERE project_id = %s AND doc_path = %s"
            params = (project_id, doc_path)
        else:
            sql = "SELECT COUNT(*) FROM pageindex_nodes WHERE project_id = %s"
            params = (project_id,)

        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchone()[0]


class AsyncPageIndexService:
    """Async version of PageIndexService using asyncpg."""

    def __init__(self, database_url: Optional[str] = None):
        if asyncpg is None:
            raise ImportError("asyncpg not installed. Run: pip install asyncpg")
        self.database_url = database_url or get_database_url()
        self._pool = None

    async def _get_pool(self):
        """Get or create connection pool."""
        if self._pool is None:
            self._pool = await asyncpg.create_pool(self.database_url)
        return self._pool

    async def close(self):
        """Close connection pool."""
        if self._pool:
            await self._pool.close()
            self._pool = None

    async def store_tree(
        self,
        project_path: str,
        doc_path: str,
        tree_structure: Dict[str, Any],
        doc_content: Optional[str] = None
    ) -> TreeIndex:
        """Store or update a tree index (async)."""
        pool = await self._get_pool()
        project_id = compute_project_id(project_path)
        doc_type = detect_doc_type(doc_path)
        doc_hash = compute_doc_hash(doc_content) if doc_content else None

        async with pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO pageindex_trees (project_id, doc_path, doc_type, tree_structure, doc_hash, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW())
                ON CONFLICT (project_id, doc_path)
                DO UPDATE SET
                    tree_structure = EXCLUDED.tree_structure,
                    doc_hash = EXCLUDED.doc_hash,
                    doc_type = EXCLUDED.doc_type,
                    updated_at = NOW()
                RETURNING id, project_id, doc_path, doc_type, tree_structure, doc_hash, created_at, updated_at
            """, project_id, doc_path, doc_type.value, json.dumps(tree_structure), doc_hash)

        return TreeIndex(
            id=str(row['id']),
            project_id=row['project_id'],
            doc_path=row['doc_path'],
            doc_type=DocType(row['doc_type']),
            tree_structure=json.loads(row['tree_structure']) if isinstance(row['tree_structure'], str) else row['tree_structure'],
            doc_hash=row['doc_hash'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )

    async def get_tree(self, project_path: str, doc_path: str) -> Optional[TreeIndex]:
        """Get a tree index (async)."""
        pool = await self._get_pool()
        project_id = compute_project_id(project_path)

        async with pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, project_id, doc_path, doc_type, tree_structure, doc_hash, created_at, updated_at
                FROM pageindex_trees
                WHERE project_id = $1 AND doc_path = $2
            """, project_id, doc_path)

        if not row:
            return None

        return TreeIndex(
            id=str(row['id']),
            project_id=row['project_id'],
            doc_path=row['doc_path'],
            doc_type=DocType(row['doc_type']),
            tree_structure=json.loads(row['tree_structure']) if isinstance(row['tree_structure'], str) else row['tree_structure'],
            doc_hash=row['doc_hash'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
