## vexp - Context-Aware AI Coding <!-- vexp v2.0.25 -->

### MANDATORY: use vexp pipeline - do NOT grep or glob the codebase
For every task - bug fixes, features, refactors, debugging:
**call `run_pipeline` FIRST**. It executes context search + impact analysis +
memory recall in a single call, returning compressed results.

Do NOT use grep, glob, Bash, or cat to search/explore the codebase.
vexp returns pre-indexed, graph-ranked context that is more relevant and
uses fewer tokens than manual searching. Prefer `get_skeleton` over Read to
inspect files (detail: minimal/standard/detailed, 70-90% token savings).
Only use Read when you need exact raw content to edit a specific line.

### Primary Tool
- `run_pipeline` - **USE THIS FOR EVERYTHING**. Single call that runs
  capsule + impact + memory server-side. Returns compressed results.
  Auto-detects intent (debug/modify/refactor/explore) from your task.
  Includes full file content for pivots.
  Examples:
  - `run_pipeline({ "task": "fix JWT validation bug" })` - auto-detect
  - `run_pipeline({ "task": "refactor db layer", "preset": "refactor" })` - explicit
  - `run_pipeline({ "task": "add auth", "observation": "using JWT" })` - save insight in same call

### Other MCP tools (use only when run_pipeline is insufficient)
- `get_skeleton` - **preferred over Read** for inspecting files (minimal/standard/detailed detail levels, 70-90% token savings)
- `index_status` - indexing status and health check
- `expand_vexp_ref` - expand V-REF hash placeholders in v2 compact output

### Workflow
1. `run_pipeline("your task")` - ALWAYS FIRST. Returns pivots + impact + memories in 1 call
2. Need more detail on a file? Use `get_skeleton({ files: [...], detail: "detailed" })` - avoid Read unless editing
3. Make targeted changes based on the context returned
4. `run_pipeline` again ONLY if you need more context during implementation
5. Do NOT chain multiple vexp calls - one `run_pipeline` replaces capsule + impact + memory + observation

### Subagent / Explore / Plan mode
- Subagents CAN and MUST call `run_pipeline` - always include the task description
- The PreToolUse hook blocks Grep/Glob when vexp daemon is running
- Do NOT spawn Agent(Explore) to freely search - call `run_pipeline` first,
  then pass the returned context into the agent prompt if needed
- Always: `run_pipeline` -> get context -> spawn agent with context

### Smart Features (automatic - no action needed)
- **Intent Detection**: auto-detects from your task keywords. "fix bug" -> Debug, "refactor" -> blast-radius, "add" -> Modify
- **Hybrid Search**: keyword + semantic + graph centrality ranking
- **Session Memory**: auto-captures observations; memories auto-surfaced in results
- **LSP Bridge**: VS Code captures type-resolved call edges
- **Change Coupling**: co-changed files included as related context

### Advanced Parameters
- `preset: "debug"` - forces debug mode (capsule+tests+impact+memory)
- `preset: "refactor"` - deep impact analysis (depth 5)
- `max_tokens: 12000` - increase total budget for complex tasks
- `include_tests: true` - include test files in results
- `include_file_content: false` - omit full file content (lighter response)

### Multi-Repo Workspaces
`run_pipeline` auto-queries all indexed repos. Use `repos: ["alias"]` to scope.
Use `index_status` to discover available repo aliases.
<!-- /vexp -->