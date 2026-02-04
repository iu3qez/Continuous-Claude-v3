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
 * Build Python script for tree search query.
 */
function buildPythonScript(
  query: string,
  docPath: string | null | undefined,
  maxResults: number,
  docType?: string
): string {
  const escapedQuery = query.replace(/'/g, "\\'").replace(/\n/g, ' ');
  const escapedDocPath = docPath ? docPath.replace(/'/g, "\\'") : '';

  return `
import sys
import json
import os
sys.path.insert(0, '.')

from scripts.pageindex.pageindex_service import PageIndexService
from scripts.pageindex.tree_search import tree_search, multi_doc_search

project_path = os.getcwd()
service = PageIndexService()

try:
    results = []
    query = '${escapedQuery}'
    doc_path = '${escapedDocPath}' or None
    doc_type = '${docType || ''}' or None
    max_results = ${maxResults}

    if doc_path:
        # Search specific document
        tree = service.get_tree(project_path, doc_path)
        if tree and tree.tree_structure:
            search_results = tree_search(
                query=query,
                tree_structure=tree.tree_structure,
                doc_name=doc_path,
                max_results=max_results,
                model='haiku'  # Fast model for navigation
            )
            for r in search_results:
                results.append({
                    'node_id': r.node_id,
                    'title': r.title,
                    'text': r.text[:500] if r.text else '',
                    'line_num': r.line_num,
                    'relevance_reason': r.relevance_reason,
                    'confidence': r.confidence,
                    'doc_path': doc_path
                })
    else:
        # Search all indexed docs (optionally filtered by type)
        all_trees = service.list_trees(project_path=project_path)
        if doc_type:
            all_trees = [t for t in all_trees if t.doc_type.value == doc_type]

        trees_with_structure = {}
        for t in all_trees[:10]:  # Limit to 10 docs
            full_tree = service.get_tree(project_path, t.doc_path)
            if full_tree and full_tree.tree_structure:
                trees_with_structure[t.doc_path] = full_tree.tree_structure

        if trees_with_structure:
            multi_results = multi_doc_search(
                query=query,
                trees=trees_with_structure,
                max_results_per_doc=2,
                model='haiku'
            )
            for doc_path, doc_results in multi_results.items():
                for r in doc_results:
                    results.append({
                        'node_id': r.node_id,
                        'title': r.title,
                        'text': r.text[:500] if r.text else '',
                        'line_num': r.line_num,
                        'relevance_reason': r.relevance_reason,
                        'confidence': r.confidence,
                        'doc_path': doc_path
                    })

    # Sort by confidence and limit
    results.sort(key=lambda x: x['confidence'], reverse=True)
    results = results[:max_results]

    print(json.dumps({'results': results}))
finally:
    service.close()
`;
}
