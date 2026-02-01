import { describe, it, expect, vi } from 'vitest';

vi.mock('../logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { parseWorkflowIds } from '../response-parser.js';

describe('parseWorkflowIds', () => {
  it('should extract workflow id from "Created workflow: abc123"', () => {
    const response = 'I have Created workflow: abc123 for you.';
    const ids = parseWorkflowIds(response);
    expect(ids).toContain('abc123');
  });

  it('should extract workflow id from "Updated workflow: xyz789"', () => {
    const response = 'Updated workflow: xyz789 successfully.';
    const ids = parseWorkflowIds(response);
    expect(ids).toContain('xyz789');
  });

  it('should extract workflow id from "workflow abc123 has been created"', () => {
    const response = 'The workflow my-workflow-123 has been created.';
    const ids = parseWorkflowIds(response);
    expect(ids).toContain('my-workflow-123');
  });

  it('should extract workflow id from workflowId property', () => {
    const response = 'workflowId: "test-workflow-456"';
    const ids = parseWorkflowIds(response);
    expect(ids).toContain('test-workflow-456');
  });

  it('should extract workflow id from workflow_id property', () => {
    const response = 'workflow_id: workflow_001';
    const ids = parseWorkflowIds(response);
    expect(ids).toContain('workflow_001');
  });

  it('should extract multiple workflow ids', () => {
    const response = `
      Created workflow: workflow-a
      Updated workflow: workflow-b
      workflowId: workflow-c
    `;
    const ids = parseWorkflowIds(response);
    expect(ids).toContain('workflow-a');
    expect(ids).toContain('workflow-b');
    expect(ids).toContain('workflow-c');
  });

  it('should return empty array when no workflow ids found', () => {
    const response = 'This is a normal response without any workflow mentions.';
    const ids = parseWorkflowIds(response);
    expect(ids).toHaveLength(0);
  });

  it('should deduplicate workflow ids', () => {
    const response = `
      Created workflow: same-id
      Updated workflow: same-id
      workflowId: same-id
    `;
    const ids = parseWorkflowIds(response);
    expect(ids).toHaveLength(1);
    expect(ids[0]).toBe('same-id');
  });

  it('should handle case insensitivity', () => {
    const response = 'CREATED WORKFLOW: upper-case';
    const ids = parseWorkflowIds(response);
    expect(ids).toContain('upper-case');
  });

  it('should ignore very short ids (less than 3 chars)', () => {
    const response = 'Created workflow: ab';
    const ids = parseWorkflowIds(response);
    expect(ids).not.toContain('ab');
  });
});
