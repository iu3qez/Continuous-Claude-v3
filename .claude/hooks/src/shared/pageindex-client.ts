/**
 * PageIndex Client - TypeScript wrapper for PageIndex queries.
 *
 * Provides queryPageIndex() to search indexed architecture docs
 * using the tree_search.py LLM-based reasoning (98.7% accuracy).
 *
 * Features:
 * - 3s timeout with graceful fallback
 * - Session caching to avoid repeat queries
 * - Multi-doc search support
 */

import { spawnSync } from 'child_process';
import { getOpcDir } from './opc-path.js';

// Session cache to avoid repeat queries
const queryCache = new Map<string, PageIndexResult[]>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

export interface PageIndexResult {
  nodeId: string;
  title: string;
  text: string;
  lineNum?: number;
  relevanceReason: string;
  confidence: number;
  docPath: string;
}

export interface QueryOptions {
  maxResults?: number;
  docType?: 'RULE' | 'ARCHITECTURE' | 'DOCUMENTATION' | 'ROADMAP';
  timeoutMs?: number;
  useCache?: boolean;
}

/**
 * Query PageIndex for relevant nodes in indexed architecture docs.
 *
 * @param query - Search query (user intent or keywords)
 * @param docPath - Optional specific doc path to search (e.g., 'DECISION-TREES.md')
 * @param options - Query options (maxResults, timeout, etc.)
 * @returns Array of matching nodes with relevance info
 */
export function queryPageIndex(
  query: string,
  docPath?: string | null,
  options: QueryOptions = {}
): PageIndexResult[] {
  const {
    maxResults = 3,
    timeoutMs = 3000,
    useCache = true,
    docType
  } = options;

  // Generate cache key
  const cacheKey = `${query}:${docPath || 'all'}:${docType || 'any'}:${maxResults}`;

  // Check cache first
  if (useCache) {
    const cached = queryCache.get(cacheKey);
    const timestamp = cacheTimestamps.get(cacheKey);
    if (cached && timestamp && (Date.now() - timestamp) < CACHE_TTL_MS) {
      return cached;
    }
  }

  const opcDir = getOpcDir();
  if (!opcDir) {
    return [];
  }

  try {
    // Build Python command
    const args = [
      'run', 'python', '-c',
      buildPythonScript(query, docPath, maxResults, docType)
    ];

    const result = spawnSync('uv', args, {
      encoding: 'utf-8',
      cwd: opcDir,
      env: {
        ...process.env,
        PYTHONPATH: opcDir
      },
      timeout: timeoutMs,
      killSignal: 'SIGKILL',
    });

    if (result.status !== 0 || !result.stdout) {
      return [];
    }

    const data = JSON.parse(result.stdout);
    const results: PageIndexResult[] = (data.results || []).map((r: any) => ({
      nodeId: r.node_id || '',
      title: r.title || '',
      text: r.text || '',
      lineNum: r.line_num,
      relevanceReason: r.relevance_reason || '',
      confidence: r.confidence || 0.5,
      docPath: r.doc_path || docPath || ''
    }));

    // Cache results
    if (useCache) {
      queryCache.set(cacheKey, results);
      cacheTimestamps.set(cacheKey, Date.now());
    }

    return results;
  } catch (err) {
    // Silent fail - return empty results
    return [];
  }
}

/**
 * Query multiple docs in parallel and merge results.
 */
export function queryMultipleDocs(
  query: string,
  docPaths: string[],
  options: QueryOptions = {}
): PageIndexResult[] {
  const allResults: PageIndexResult[] = [];

  for (const docPath of docPaths) {
    const results = queryPageIndex(query, docPath, options);
    allResults.push(...results);
  }

  // Sort by confidence and deduplicate
  return allResults
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, options.maxResults || 5);
}

/**
 * Fast check if PageIndex has data for a document.
 */
export function hasIndexedDoc(docPath: string): boolean {
  const opcDir = getOpcDir();
  if (!opcDir) return false;

  try {
    const result = spawnSync('uv', [
      'run', 'python', '-c',
      `
import sys
sys.path.insert(0, '.')
from scripts.pageindex.pageindex_service import PageIndexService
import os

project_path = os.getcwd()
service = PageIndexService()
tree = service.get_tree(project_path, "${docPath}")
print("1" if tree else "0")
service.close()
`
    ], {
      encoding: 'utf-8',
      cwd: opcDir,
      timeout: 2000,
    });

    return result.stdout?.trim() === '1';
  } catch {
    return false;
  }
}

/**
 * Clear session cache (useful for testing or forced refresh).
 */
export function clearCache(): void {
  queryCache.clear();
  cacheTimestamps.clear();
}

/**
 * Build Python script for fast FTS search (no model loading, <50ms).
 *
 * Uses fast_search.py FTS mode instead of LLM-based tree_search.
 * The old tree_search path called `claude -p` (30-120s) which always
 * exceeded the hook's 3s timeout budget.
 */
function buildPythonScript(
  query: string,
  docPath: string | null | undefined,
  maxResults: number,
  _docType?: string
): string {
  const escapedQuery = query.replace(/'/g, "\\'").replace(/\n/g, ' ');
  const escapedDocPath = docPath ? docPath.replace(/'/g, "\\'") : '';

  return `
import sys, json, os
sys.path.insert(0, '.')
from scripts.pageindex.fast_search import search_fts

project_path = os.getcwd()
results = search_fts(
    query='${escapedQuery}',
    project_path=project_path,
    doc_path='${escapedDocPath}' or None,
    max_results=${maxResults}
)
print(json.dumps({'results': [
    {'node_id': r.node_id, 'title': r.title, 'text': r.text[:500] if r.text else '',
     'line_num': r.line_num, 'relevance_reason': f'FTS match (score: {r.score:.3f})',
     'confidence': min(r.score, 1.0), 'doc_path': r.doc_path}
    for r in results
]}))
`;
}
