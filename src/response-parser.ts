import { logger } from './logger.js';

const WORKFLOW_PATTERNS = [
  /created workflow[:\s]+([a-zA-Z0-9_-]+)/gi,
  /updated workflow[:\s]+([a-zA-Z0-9_-]+)/gi,
  /workflow[:\s]+['"]?([a-zA-Z0-9_-]+)['"]?\s+(?:has been |was )?(?:created|updated)/gi,
  /workflowId[:\s]+['"]?([a-zA-Z0-9_-]+)['"]?/gi,
  /workflow_id[:\s]+['"]?([a-zA-Z0-9_-]+)['"]?/gi,
  /"id":\s*"([a-zA-Z0-9_-]+)".*"type":\s*"workflow"/g,
  /"type":\s*"workflow".*"id":\s*"([a-zA-Z0-9_-]+)"/g,
];

export function parseWorkflowIds(response: string): string[] {
  const workflowIds = new Set<string>();

  for (const pattern of WORKFLOW_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(response)) !== null) {
      const id = match[1];
      if (id && id.length >= 3) {
        workflowIds.add(id);
      }
    }
  }

  const ids = Array.from(workflowIds);

  if (ids.length > 0) {
    logger.info('Detected workflow IDs in response', { workflowIds: ids });
  }

  return ids;
}
