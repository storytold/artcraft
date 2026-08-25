/**
 * Finds server source files that read the environment name or branch on it. Pure so the test
 * can prove it catches an offender, not only that the current tree has none.
 */

const ENVIRONMENT_BRANCH_PATTERN =
  /environment\s*(===|!==|==|!=)\s*["'](local|preview|production)["']/;

export function environmentNameOffenders(
  sources: Record<string, string>,
  allowedPaths: readonly string[],
): { readsBinding: string[]; branches: string[] } {
  const candidates = Object.entries(sources).filter(([path]) => !allowedPaths.includes(path));
  return {
    readsBinding: candidates
      .filter(([, source]) => source.includes("MCP_ENVIRONMENT"))
      .map(([path]) => path),
    branches: candidates
      .filter(([, source]) => ENVIRONMENT_BRANCH_PATTERN.test(source))
      .map(([path]) => path),
  };
}
