// Mapping of tool names to user-friendly display text
const toolDisplayNames: Record<string, string> = {
  // n8n MCP tools
  'mcp__n8n-mcp__n8n_create_workflow': 'Creating workflow',
  'mcp__n8n-mcp__n8n_update_full_workflow': 'Updating workflow',
  'mcp__n8n-mcp__n8n_update_partial_workflow': 'Updating workflow',
  'mcp__n8n-mcp__n8n_get_workflow': 'Getting workflow',
  'mcp__n8n-mcp__n8n_delete_workflow': 'Deleting workflow',
  'mcp__n8n-mcp__n8n_list_workflows': 'Listing workflows',
  'mcp__n8n-mcp__n8n_validate_workflow': 'Validating workflow',
  'mcp__n8n-mcp__n8n_test_workflow': 'Testing workflow',
  'mcp__n8n-mcp__n8n_autofix_workflow': 'Auto-fixing workflow',
  'mcp__n8n-mcp__n8n_deploy_template': 'Deploying template',
  'mcp__n8n-mcp__n8n_executions': 'Managing executions',
  'mcp__n8n-mcp__n8n_health_check': 'Checking n8n health',
  'mcp__n8n-mcp__n8n_workflow_versions': 'Managing versions',
  'mcp__n8n-mcp__search_nodes': 'Searching nodes',
  'mcp__n8n-mcp__get_node': 'Getting node info',
  'mcp__n8n-mcp__validate_node': 'Validating node',
  'mcp__n8n-mcp__get_template': 'Getting template',
  'mcp__n8n-mcp__search_templates': 'Searching templates',
  'mcp__n8n-mcp__validate_workflow': 'Validating workflow',
  'mcp__n8n-mcp__tools_documentation': 'Reading documentation',

  // Claude Code tools
  'Read': 'Reading file',
  'Write': 'Writing file',
  'Edit': 'Editing file',
  'Bash': 'Running command',
  'Glob': 'Searching files',
  'Grep': 'Searching content',
  'Task': 'Running task',
  'WebFetch': 'Fetching web content',
  'WebSearch': 'Searching web',
  'TodoWrite': 'Updating tasks',
  'AskUserQuestion': 'Asking question',
  'NotebookEdit': 'Editing notebook',
};

// Active verb forms for status display (present continuous)
const toolActiveVerbs: Record<string, string> = {
  'mcp__n8n-mcp__n8n_create_workflow': 'Creating workflow...',
  'mcp__n8n-mcp__n8n_update_full_workflow': 'Updating workflow...',
  'mcp__n8n-mcp__n8n_update_partial_workflow': 'Updating workflow...',
  'mcp__n8n-mcp__n8n_get_workflow': 'Getting workflow...',
  'mcp__n8n-mcp__n8n_delete_workflow': 'Deleting workflow...',
  'mcp__n8n-mcp__n8n_list_workflows': 'Listing workflows...',
  'mcp__n8n-mcp__n8n_validate_workflow': 'Validating workflow...',
  'mcp__n8n-mcp__n8n_test_workflow': 'Testing workflow...',
  'mcp__n8n-mcp__n8n_autofix_workflow': 'Auto-fixing workflow...',
  'mcp__n8n-mcp__n8n_deploy_template': 'Deploying template...',
  'mcp__n8n-mcp__n8n_executions': 'Managing executions...',
  'mcp__n8n-mcp__n8n_health_check': 'Checking n8n health...',
  'mcp__n8n-mcp__n8n_workflow_versions': 'Managing versions...',
  'mcp__n8n-mcp__search_nodes': 'Searching nodes...',
  'mcp__n8n-mcp__get_node': 'Getting node info...',
  'mcp__n8n-mcp__validate_node': 'Validating node...',
  'mcp__n8n-mcp__get_template': 'Getting template...',
  'mcp__n8n-mcp__search_templates': 'Searching templates...',
  'mcp__n8n-mcp__validate_workflow': 'Validating workflow...',
  'mcp__n8n-mcp__tools_documentation': 'Reading documentation...',
  'Read': 'Reading file...',
  'Write': 'Writing file...',
  'Edit': 'Editing file...',
  'Bash': 'Running command...',
  'Glob': 'Searching files...',
  'Grep': 'Searching content...',
  'Task': 'Running task...',
  'WebFetch': 'Fetching web content...',
  'WebSearch': 'Searching web...',
  'TodoWrite': 'Updating tasks...',
  'AskUserQuestion': 'Waiting for input...',
  'NotebookEdit': 'Editing notebook...',
};

/**
 * Get a user-friendly display name for a tool
 */
export function getToolDisplayName(toolName: string): string {
  if (toolDisplayNames[toolName]) {
    return toolDisplayNames[toolName];
  }

  // Handle MCP tool prefix pattern
  if (toolName.startsWith('mcp__')) {
    const parts = toolName.split('__');
    if (parts.length >= 3) {
      // Take the last part and make it readable
      const name = parts[parts.length - 1];
      return formatToolName(name);
    }
  }

  return formatToolName(toolName);
}

/**
 * Get the active verb form for status display (e.g., "Creating workflow...")
 */
export function getToolActiveVerb(toolName: string): string {
  if (toolActiveVerbs[toolName]) {
    return toolActiveVerbs[toolName];
  }

  // Generate a default active verb
  const displayName = getToolDisplayName(toolName);
  return `${displayName}...`;
}

/**
 * Format a raw tool name into a readable string
 */
function formatToolName(name: string): string {
  // Convert snake_case or camelCase to Title Case
  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Check if a tool is an n8n-related tool
 */
export function isN8nTool(toolName: string): boolean {
  return toolName.includes('n8n');
}

/**
 * Check if a tool is a workflow operation tool
 */
export function isWorkflowTool(toolName: string): boolean {
  return toolName.includes('workflow') || toolName.includes('Workflow');
}
