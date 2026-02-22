/**
 * Shared file classification helpers.
 * Used by ralph-delegation-enforcer and plan-to-ralph-enforcer.
 */

export function isCodeFile(filePath: string): boolean {
  const codeExtensions = [
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
    '.py', '.pyi',
    '.go',
    '.rs',
    '.java', '.kt', '.scala',
    '.c', '.cpp', '.h', '.hpp',
    '.cs',
    '.rb',
    '.php',
    '.swift',
    '.vue', '.svelte',
  ];
  return codeExtensions.some(ext => filePath.endsWith(ext));
}

export function isAllowedConfigFile(filePath: string): boolean {
  const configPatterns = [
    /\.ralph\//,
    /IMPLEMENTATION_PLAN\.md$/,
    /tasks\/.*\.md$/,
    /\.json$/,
    /\.yaml$/,
    /\.yml$/,
    /\.env/,
    /\.gitignore$/,
    /package\.json$/,
    /tsconfig\.json$/,
    /\.md$/,
  ];
  return configPatterns.some(p => p.test(filePath));
}
