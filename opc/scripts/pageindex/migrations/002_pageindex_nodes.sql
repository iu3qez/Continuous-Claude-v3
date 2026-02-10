-- Migration 002: pageindex_nodes - Flattened nodes for fast FTS + vector search
-- Depends on: pageindex_trees table, pgvector extension

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS pageindex_nodes (
    id SERIAL PRIMARY KEY,
    project_id TEXT NOT NULL,
    doc_path TEXT NOT NULL,
    node_id TEXT NOT NULL,
    parent_node_id TEXT,
    title TEXT NOT NULL,
    text TEXT,
    line_num INTEGER,
    depth INTEGER DEFAULT 0,
    -- Full-text search: title weight A (4x), text weight B (2x)
    fts_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(text, '')), 'B')
    ) STORED,
    -- Vector embedding (BGE-large-en-v1.5 = 1024 dim)
    embedding vector(1024),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, doc_path, node_id)
);

CREATE INDEX IF NOT EXISTS idx_nodes_fts ON pageindex_nodes USING GIN (fts_vector);
CREATE INDEX IF NOT EXISTS idx_nodes_embedding ON pageindex_nodes USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_nodes_project ON pageindex_nodes (project_id);
CREATE INDEX IF NOT EXISTS idx_nodes_doc ON pageindex_nodes (project_id, doc_path);
