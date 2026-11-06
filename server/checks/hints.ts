const ERROR_HINTS: [RegExp, string][] = [
    [/jemalloc>: Unsupported system page size/, "ripgrep binary crashes in the sandbox (memory page size), so use grep"],
    [/Tool '[\w-]+' does not exist/, "the tool isn't available to this agent: MCP server not connected, or missing from `tools:`"],
    [/Parent directory does not exist/, "create can't make folders, so it needs a mkdir first"],
    [/Path does not exist/, 'guessing file paths instead of searching for them'],
    [/timed out|-32001/, "the MCP server didn't answer in time"],
    [/HTTP 5\d\d/, 'the server behind the MCP returned an error (5xx)'],
    [/HTTP 4\d\d/, 'the MCP call was rejected (4xx): wrong arguments or no permission'],
    [/Required|Invalid input|Expected \w+, received/, "the agent sent arguments that don't match the tool's schema"],
    [/No match found|Multiple matches found/, "edit's old text didn't match the file"],
]

// A plain explanation of a known error, or an empty string
export function errorHint(messages: string[]): string {
    const match = ERROR_HINTS.find(([pattern]) => messages.some((message) => pattern.test(message)))
    return match ? match[1] : ''
}
