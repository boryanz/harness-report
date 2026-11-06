const AGENT_COLOR_COUNT = 7

// Derived from the name, so an agent keeps its colour across sessions and reloads.
// The --agent-N colours live in index.css, with separate values for light and dark.
export function agentColor(name: string): string {
  let hash = 7
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return `var(--agent-${(hash % AGENT_COLOR_COUNT) + 1})`
}
