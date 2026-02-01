# Project Outline: Interactive n8n Workflow Builder with Self-Healing Capabilities

## Executive Summary

Build an intelligent workflow development environment that combines conversational AI with automated error detection and repair. Users describe their automation needs in natural language, and the system builds, tests, and maintains n8n workflows with minimal manual intervention. When errors occur during development or testing, the system automatically diagnoses and fixes them, eliminating the traditional copy-paste debugging cycle.

The system leverages Claude Code as the AI agent, n8n MCP for direct workflow manipulation, and n8n-skills as a comprehensive knowledge base for building and fixing workflows correctly.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Problem Statement](#problem-statement)
3. [Solution Summary](#solution-summary)
4. [Target Users](#target-users)
5. [System Architecture](#system-architecture)
6. [Core Components](#core-components)
7. [n8n-skills Knowledge Base Integration](#n8n-skills-knowledge-base-integration)
8. [Data Flows](#data-flows)
9. [Functional Requirements](#functional-requirements)
10. [Non-Functional Requirements](#non-functional-requirements)
11. [User Experience Design](#user-experience-design)
12. [Technical Specifications](#technical-specifications)
13. [AWS Deployment Strategy](#aws-deployment-strategy)
14. [Testing Strategy](#testing-strategy)
15. [Success Metrics](#success-metrics)
16. [Risk Assessment](#risk-assessment)
17. [Future Enhancements](#future-enhancements)
18. [Appendices](#appendices)

---

## Project Overview

### Vision Statement

Create a conversational AI-powered development environment where building n8n workflows feels like pair programming with an expert. Users describe what they want, the system builds it, tests it, and when things break, it fixes them automatically. The goal is to reduce the time from idea to working automation by an order of magnitude.

### Project Name Options

- n8n Copilot
- n8n Builder AI
- FlowForge
- AutoFlow Builder
- n8n Healing Agent

### Key Differentiators

1. **Direct Action**: The AI does not just suggest fixes—it implements them and verifies they work
2. **Knowledge-Backed**: Powered by n8n-skills, a curated knowledge base covering 525+ nodes, 2,653+ templates, and proven patterns
3. **Continuous Loop**: Build → Test → Fix → Retest happens automatically until success or human intervention is needed
4. **Conversational Context**: The AI maintains full context of what has been built and discussed within a session

---

## Problem Statement

### Current Pain Points in n8n Development

**Pain Point 1: Manual Translation Burden**

Users must translate their automation ideas into specific node configurations, connections, and expressions by hand. This requires:
- Understanding which nodes exist for each task
- Knowing the correct configuration for each node
- Writing expressions in n8n's specific syntax
- Connecting nodes in the proper order with correct data mapping

**Pain Point 2: The Copy-Paste Debugging Cycle**

When workflows fail, the current process is:
1. See error in n8n
2. Copy error message
3. Paste into ChatGPT or similar
4. Read suggested fix
5. Manually edit workflow JSON or UI
6. Test again
7. Repeat if still broken

This cycle is slow, loses context each iteration, and requires the user to be the integration layer between the AI and n8n.

**Pain Point 3: Context Loss Across Debugging Sessions**

Each time a user asks an LLM for help, they must re-explain:
- What the workflow is supposed to do
- What data is flowing through it
- What they have already tried
- The full error context

**Pain Point 4: Expression and Syntax Complexity**

n8n has specific patterns that are easy to get wrong:
- `{{ $json.field }}` vs `{{ $node["NodeName"].json.field }}`
- Webhook data lives under `$json.body`, not `$json` directly
- Code nodes have different syntax than expression fields
- Different nodes have different required and optional parameters

**Pain Point 5: Documentation Hunting**

Users frequently need to look up:
- What parameters a node requires
- Which operations are available
- How to connect AI agent nodes properly
- What validation errors actually mean

### Quantifying the Problem

- Average time to debug a single workflow error: 10-30 minutes
- Percentage of workflow development time spent on debugging: 40-60%
- Number of context switches between n8n and external help: 5-15 per session
- Common errors that could be auto-fixed: 70%+ (based on n8n-skills analysis)

---

## Solution Summary

### Two-Mode Interactive System

**Mode 1: Builder Mode**

User describes their automation goal in natural language. The system:
1. Plans the workflow structure
2. Creates the workflow in n8n via MCP
3. Runs initial tests with sample data
4. Iterates on any errors automatically
5. Reports completion with summary

**Mode 2: Healing Mode**

During testing and iteration:
1. System monitors for errors via n8n Error Handler workflow
2. When errors occur, they route to the active Claude Code session
3. Claude Code diagnoses using n8n-skills knowledge base
4. Auto-fixable errors are repaired and retested
5. External issues receive clear guidance for human action

### The Key Innovation

The AI agent has:
- **Direct access** to the n8n instance via MCP (can read, create, modify workflows)
- **Expert knowledge** via n8n-skills (knows correct patterns, common errors, proper syntax)
- **Execution capability** via Claude Code (can reason, plan, and execute multi-step repairs)

This transforms the AI from an advisor into an active collaborator.

---

## Target Users

### Primary User Profile

**Role**: Automation Specialist / Technical Operations

**Characteristics**:
- Builds n8n workflows regularly (5+ per week)
- Understands what they want to automate
- Comfortable with technical concepts
- Frustrated by time spent on debugging vs. creating
- Values speed and iteration over perfection on first try

**Goals**:
- Move from idea to working workflow faster
- Spend less time on syntax and configuration details
- Reduce context-switching between n8n and help resources

### Secondary User Profile

**Role**: Technical Team Member / Occasional Builder

**Characteristics**:
- Builds automations occasionally (1-4 per month)
- Deep knowledge of their business processes
- Less familiar with n8n specifics
- Often needs to look up how to do things

**Goals**:
- Build automations without becoming an n8n expert
- Get guidance when stuck without leaving the development flow
- Have confidence that automations work correctly

### User Environment Assumptions

- Has an existing n8n cloud instance or self-hosted n8n with API access
- Has or can set up an AWS account for hosting the bridge infrastructure
- Has valid API credentials for services their workflows connect to
- Is comfortable with a chat-based interface for development

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE LAYER                            │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     Chat Interface (Web App)                       │  │
│  │  - WebSocket connection to bridge server                          │  │
│  │  - Real-time message streaming                                    │  │
│  │  - Session history display                                        │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ WebSocket
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         AWS INFRASTRUCTURE                              │
│                                                                         │
│  ┌─────────────────┐    ┌─────────────────────────────────────────┐    │
│  │ Load Balancer / │    │         ECS Fargate Cluster             │    │
│  │ API Gateway     │───▶│  ┌───────────────────────────────────┐  │    │
│  │ (WebSocket)     │    │  │     Bridge Server Container       │  │    │
│  └─────────────────┘    │  │                                   │  │    │
│                         │  │  - WebSocket connection manager   │  │    │
│  ┌─────────────────┐    │  │  - Claude Code session spawner    │  │    │
│  │ API Gateway     │    │  │  - Error callback router          │  │    │
│  │ (HTTP)          │───▶│  │  - Message bidirectional relay    │  │    │
│  │ /error-callback │    │  │                                   │  │    │
│  └─────────────────┘    │  └───────────────────────────────────┘  │    │
│                         │                    │                     │    │
│  ┌─────────────────┐    │                    │                     │    │
│  │ Secrets Manager │    │                    ▼                     │    │
│  │ - Anthropic Key │    │  ┌───────────────────────────────────┐  │    │
│  │ - n8n API Key   │───▶│  │      Claude Code Process          │  │    │
│  └─────────────────┘    │  │                                   │  │    │
│                         │  │  - Configured with n8n MCP        │  │    │
│                         │  │  - Loaded with n8n-skills         │  │    │
│                         │  │  - Maintains conversation state   │  │    │
│                         │  └───────────────────────────────────┘  │    │
│                         └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
┌───────────────────────────────┐   ┌───────────────────────────────────┐
│      n8n MCP Server           │   │        n8n-skills                 │
│                               │   │     Knowledge Base                │
│  - get_workflow               │   │                                   │
│  - list_workflows             │   │  - Expression Syntax patterns     │
│  - create_workflow            │   │  - MCP Tools Expert guidance      │
│  - update_workflow            │   │  - Workflow Patterns (5 types)    │
│  - execute_workflow           │   │  - Validation Expert rules        │
│  - get_execution              │   │  - Node Configuration specs       │
│  - search_nodes               │   │  - Code JavaScript patterns       │
│  - validate_workflow          │   │  - Code Python patterns           │
└───────────────────────────────┘   └───────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER'S N8N INSTANCE                             │
│                     (n8n Cloud or Self-Hosted)                          │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    Error Handler Workflow                          │  │
│  │                                                                    │  │
│  │  [Error Trigger] → [Extract Context] → [HTTP POST to AWS]         │  │
│  │                                                                    │  │
│  │  Catches errors from designated workflows                         │  │
│  │  Sends: workflow ID, node name, error message, session ID         │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    User's Workflows                                │  │
│  │                                                                    │  │
│  │  Created, modified, and tested by Claude Code via MCP             │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Interaction Summary

| Component | Communicates With | Protocol | Purpose |
|-----------|-------------------|----------|---------|
| Chat Interface | Bridge Server | WebSocket | Bidirectional messaging |
| Bridge Server | Claude Code | stdin/stdout | Process management |
| Claude Code | n8n MCP Server | MCP | Workflow operations |
| Claude Code | n8n-skills | Local files | Knowledge retrieval |
| n8n Instance | Bridge Server | HTTP POST | Error notifications |
| Bridge Server | Secrets Manager | AWS SDK | Credential retrieval |

---

## Core Components

### Component 1: Chat Interface

**Purpose**: Primary user touchpoint for conversational workflow development

**Responsibilities**:
- Establish and maintain WebSocket connection to bridge server
- Display conversation history with user and assistant messages
- Stream incoming responses in real-time
- Handle connection drops and reconnection
- Provide visual feedback on system state

**Key User Interface Elements**:
- Message input field
- Conversation display area
- Connection status indicator
- Session information (optional)
- Quick action buttons (optional): "Test workflow", "Show status", "Retry"

**Technology Considerations**:
- Single-page web application
- WebSocket client library with reconnection logic
- Markdown rendering for formatted responses
- Mobile-responsive design

### Component 2: Bridge Server

**Purpose**: Manage connections between users and Claude Code sessions

**Responsibilities**:
- Accept WebSocket connections from chat interface
- Spawn Claude Code process for each session with proper configuration
- Route messages bidirectionally between WebSocket and Claude Code
- Receive error callbacks from n8n and route to correct session
- Clean up sessions on disconnect
- Handle multiple concurrent sessions

**Session Management**:
- Each WebSocket connection = one session
- Each session has unique identifier
- Session ID embedded in workflows for error routing
- Session state lives in Claude Code process memory

**Error Callback Handling**:
- HTTP endpoint receives POST from n8n error handler
- Extract session ID from payload
- Find corresponding Claude Code session
- Inject error context into Claude Code stdin

**Technology Considerations**:
- Node.js for WebSocket and process management
- Express for HTTP error callback endpoint
- Child process management for Claude Code
- Stateless design for horizontal scaling (session state in Claude Code process)

### Component 3: Claude Code with n8n MCP

**Purpose**: AI agent that builds, tests, and fixes workflows

**Responsibilities**:
- Interpret natural language workflow descriptions
- Plan workflow architecture before building
- Create and modify workflows via MCP tools
- Trigger test executions
- Analyze errors and determine fix strategy
- Apply fixes and retest
- Communicate status and results to user

**MCP Tools Available**:

| Tool | Purpose | When Used |
|------|---------|-----------|
| `search_nodes` | Find nodes by capability | Planning which nodes to use |
| `get_workflow` | Retrieve workflow JSON | Analyzing existing workflow |
| `list_workflows` | List available workflows | Finding user's workflows |
| `create_workflow` | Create new workflow | Building from scratch |
| `update_workflow` | Modify existing workflow | Applying fixes |
| `execute_workflow` | Trigger test run | Testing after build/fix |
| `get_execution` | Check execution result | Verifying fix worked |
| `validate_workflow` | Validate configuration | Pre-flight checks |

**Configuration Requirements**:
- MCP configuration file specifying n8n server connection
- n8n API URL and credentials
- Allowed tools list
- System prompt establishing role and behavior

### Component 4: n8n Error Handler Workflow

**Purpose**: Catch errors during testing and route to active session

**Workflow Structure**:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Error Trigger  │────▶│ Extract Context │────▶│  HTTP Request   │
│                 │     │   (Code Node)   │     │  to AWS Bridge  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Error Trigger Configuration**:
- Trigger on errors from all workflows OR specific workflows
- Capture full error event object

**Context Extraction (Code Node)**:
```javascript
// Pseudocode for context extraction
const errorContext = {
  sessionId: $json.workflow.settings?.sessionId || 'default',
  workflowId: $json.workflow.id,
  workflowName: $json.workflow.name,
  failedNodeName: $json.execution.lastNodeExecuted,
  errorMessage: $json.execution.error.message,
  errorStack: $json.execution.error.stack || '',
  executionId: $json.execution.id,
  timestamp: new Date().toISOString()
};
return [{ json: errorContext }];
```

**HTTP Request Configuration**:
- Method: POST
- URL: Bridge server error callback endpoint
- Body: Error context JSON
- Timeout: 30 seconds
- Retry: 3 attempts with backoff

---

## n8n-skills Knowledge Base Integration

### Overview

n8n-skills is a curated knowledge base of 7 complementary skills that teach Claude Code how to build production-ready n8n workflows. This is a critical component that differentiates this system from generic LLM-based workflow assistance.

**Source**: https://github.com/czlonkowski/n8n-skills

**Coverage**:
- 525+ n8n nodes
- 2,653+ workflow templates
- Production-tested patterns
- Comprehensive error catalogs

### The 7 Skills

#### Skill 1: n8n Expression Syntax

**Purpose**: Teach correct n8n expression syntax and common patterns

**Activates When**:
- Writing expressions using `{{ }}` syntax
- Accessing `$json`, `$node`, `$now`, `$env` variables
- Troubleshooting expression errors

**Key Knowledge**:
- Core variables and their proper usage
- **Critical Pattern**: Webhook data is under `$json.body`, not `$json` directly
- Common mistakes catalog with fixes
- When NOT to use expressions (Code nodes require different syntax)

**Example Knowledge Application**:
```
User Error: "Cannot read property 'email' of undefined"
Skill Knowledge: Webhook data is nested under .body
Fix: Change {{ $json.email }} to {{ $json.body.email }}
```

#### Skill 2: n8n MCP Tools Expert

**Purpose**: Guide effective use of n8n-mcp MCP tools

**Activates When**:
- Searching for nodes
- Validating configurations
- Accessing templates
- Managing workflows via MCP

**Key Knowledge**:
- Tool selection guide (which tool for which task)
- nodeType format differences (`nodes-base.*` vs `n8n-nodes-base.*`)
- Validation profiles (minimal, runtime, ai-friendly, strict)
- Smart parameters (e.g., `branch="true"` for IF nodes)
- Auto-sanitization behavior

**Priority**: This is the highest priority skill for MCP operations

#### Skill 3: n8n Workflow Patterns

**Purpose**: Build workflows using proven architectural patterns

**Activates When**:
- Creating new workflows
- Connecting nodes
- Designing automation architecture

**Key Knowledge**:
- 5 proven patterns:
  1. Webhook Processing
  2. HTTP API Integration
  3. Database Operations
  4. AI Agent Workflows
  5. Scheduled/Cron Workflows
- Workflow creation checklist
- Connection best practices
- Pattern selection guide based on use case

**Example Pattern Application**:
```
User Request: "Build a workflow that processes form submissions"
Pattern Match: Webhook Processing Pattern
Structure: Webhook Trigger → Validate Data → Process → Respond
```

#### Skill 4: n8n Validation Expert

**Purpose**: Interpret validation errors and guide fixes

**Activates When**:
- Validation fails
- Debugging workflow errors
- Handling false positives

**Key Knowledge**:
- Validation loop workflow
- Real error catalog with explanations
- Auto-sanitization behavior
- False positives identification
- Profile selection for different development stages

**Example Application**:
```
Validation Error: "Property 'authentication' required"
Skill Analysis: This node has operation-dependent requirements
Fix Strategy: Check operation type, add required auth property
```

#### Skill 5: n8n Node Configuration

**Purpose**: Operation-aware node configuration guidance

**Activates When**:
- Configuring specific nodes
- Understanding property dependencies
- Setting up AI workflows

**Key Knowledge**:
- Property dependency rules (e.g., `sendBody` → requires `contentType`)
- Operation-specific requirements
- AI connection types (8 types for AI Agent workflows)
- Common configuration patterns per node type

**Example Application**:
```
Node: HTTP Request
Operation: POST with body
Dependencies: sendBody=true requires specifying contentType
Auto-configure: Add contentType: "application/json"
```

#### Skill 6: n8n Code JavaScript

**Purpose**: Write effective JavaScript in n8n Code nodes

**Activates When**:
- Writing JavaScript in Code nodes
- Troubleshooting Code node errors
- Making HTTP requests with `$helpers`
- Working with dates

**Key Knowledge**:
- Data access patterns:
  - `$input.all()` - all items
  - `$input.first()` - first item
  - `$input.item` - current item in loop
- **Critical**: Webhook data under `$json.body`
- Correct return format: `[{json: {...}}]`
- Built-in functions: `$helpers.httpRequest()`, `DateTime`, `$jmespath()`
- Top 5 error patterns (covering 62%+ of failures)
- 10 production-tested patterns

**Example Application**:
```
Error: "items is not iterable"
Skill Knowledge: Code node must return array of objects with json property
Fix: return [{ json: { result: data } }];
```

#### Skill 7: n8n Code Python

**Purpose**: Write Python code in n8n Code nodes with limitations awareness

**Activates When**:
- Writing Python in Code nodes
- Need to understand Python limitations
- Working with standard library

**Key Knowledge**:
- **Important**: Use JavaScript for 95% of use cases
- Python data access: `_input`, `_json`, `_node`
- **Critical Limitation**: No external libraries (requests, pandas, numpy unavailable)
- Standard library reference (json, datetime, re, etc.)
- Workarounds for missing libraries
- When Python is actually needed vs JavaScript

### Skills Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Claude Code Process                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   System Prompt                           │  │
│  │  - Role definition                                        │  │
│  │  - Behavior guidelines                                    │  │
│  │  - Error classification rules                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │               n8n-skills Knowledge Base                   │  │
│  │                                                           │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │  │
│  │  │ Expression  │ │ MCP Tools   │ │ Workflow Patterns   │  │  │
│  │  │ Syntax      │ │ Expert      │ │                     │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘  │  │
│  │                                                           │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │  │
│  │  │ Validation  │ │ Node        │ │ Code JavaScript     │  │  │
│  │  │ Expert      │ │ Config      │ │                     │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘  │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │                 Code Python                         │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    MCP Tools                              │  │
│  │  - search_nodes    - create_workflow   - execute_workflow │  │
│  │  - get_workflow    - update_workflow   - get_execution    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Skills Installation for the System

The bridge server container must have n8n-skills installed and available to Claude Code:

**Installation Method**:
```bash
# Clone n8n-skills repository
git clone https://github.com/czlonkowski/n8n-skills.git

# Copy skills to Claude Code skills directory
cp -r n8n-skills/dist/* ~/.claude/skills/
```

**Docker Integration**:
```dockerfile
# In bridge server Dockerfile
RUN git clone https://github.com/czlonkowski/n8n-skills.git /tmp/n8n-skills
RUN cp -r /tmp/n8n-skills/dist/* /root/.claude/skills/
```

### How Skills Compose for Complex Tasks

**Example: Building and debugging a webhook-to-Slack workflow**

1. User: "Build a workflow that posts Slack messages when a webhook receives data"

2. **Workflow Patterns** activates:
   - Identifies as Webhook Processing pattern
   - Suggests structure: Webhook → Process → Slack

3. **MCP Tools Expert** activates:
   - Searches for Webhook Trigger node
   - Searches for Slack node
   - Guides correct tool parameter formats

4. **Node Configuration** activates:
   - Configures Webhook node settings
   - Configures Slack node with required operation parameters

5. Claude Code creates workflow and tests it

6. Test fails: "Cannot read property 'text' of undefined"

7. **Expression Syntax** activates:
   - Identifies webhook data access issue
   - Knows data is under `$json.body.text`, not `$json.text`

8. **Code JavaScript** activates (if Code node involved):
   - Provides correct data access pattern
   - Shows proper return format

9. Claude Code applies fix and retests

10. **Validation Expert** activates:
    - Confirms fix is valid
    - No remaining validation errors

11. Test passes - workflow complete

---

## Data Flows

### Flow 1: New Workflow Creation (Builder Mode)

```
┌──────┐  "Build a workflow that..."  ┌────────────┐
│ User │─────────────────────────────▶│ Chat       │
└──────┘                              │ Interface  │
                                      └─────┬──────┘
                                            │ WebSocket
                                            ▼
                                      ┌────────────┐
                                      │ Bridge     │
                                      │ Server     │
                                      └─────┬──────┘
                                            │ stdin
                                            ▼
                                      ┌────────────┐
                                      │ Claude     │
                                      │ Code       │
                                      └─────┬──────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
           ┌────────────────┐    ┌─────────────────┐    ┌─────────────────┐
           │ n8n-skills     │    │ n8n MCP         │    │ Response        │
           │ Knowledge      │    │ create_workflow │    │ to User         │
           │ Lookup         │    │ execute_workflow│    │                 │
           └────────────────┘    └─────────────────┘    └─────────────────┘
```

**Step-by-Step**:

1. User sends natural language description via chat interface
2. Message travels over WebSocket to bridge server
3. Bridge server forwards to Claude Code process stdin
4. Claude Code consults n8n-skills for:
   - Appropriate workflow pattern
   - Node selection guidance
   - Configuration requirements
5. Claude Code uses MCP to:
   - Search for needed nodes
   - Create the workflow
   - Execute a test
6. Claude Code streams progress updates back to user
7. If test fails, error is caught and healing flow begins

### Flow 2: Error Detection and Auto-Healing

```
┌─────────────────────────────────────────────────────────────────────┐
│                         n8n Instance                                │
│                                                                     │
│   ┌──────────────────┐    Error    ┌──────────────────────────┐    │
│   │ User's Workflow  │────────────▶│ Error Handler Workflow   │    │
│   │ (test execution) │   occurs    │                          │    │
│   └──────────────────┘             └────────────┬─────────────┘    │
└─────────────────────────────────────────────────┼───────────────────┘
                                                  │
                                                  │ HTTP POST
                                                  │ (error context)
                                                  ▼
                                           ┌────────────┐
                                           │ Bridge     │
                                           │ Server     │
                                           │ /callback  │
                                           └─────┬──────┘
                                                 │
                                                 │ Route to session
                                                 ▼
                                           ┌────────────┐
                                           │ Claude     │
                                           │ Code       │
                                           └─────┬──────┘
                                                 │
                         ┌───────────────────────┼───────────────────────┐
                         │                       │                       │
                         ▼                       ▼                       ▼
                ┌────────────────┐    ┌─────────────────┐    ┌─────────────────┐
                │ n8n-skills     │    │ Classify Error  │    │ Apply Fix       │
                │ Error Catalog  │    │                 │    │ via MCP         │
                │ Lookup         │    │ - Auto-fixable? │    │ update_workflow │
                └────────────────┘    │ - External?     │    └────────┬────────┘
                                      └─────────────────┘             │
                                                                      │
                                                               ┌──────▼──────┐
                                                               │ Retest via  │
                                                               │ MCP execute │
                                                               └─────────────┘
```

**Step-by-Step**:

1. Test execution fails in user's n8n workflow
2. Error Trigger in Error Handler workflow fires
3. Error context extracted: workflow ID, node, message, session ID
4. HTTP POST sent to bridge server callback endpoint
5. Bridge server looks up session by ID
6. Error context injected into Claude Code session
7. Claude Code consults n8n-skills to understand error
8. Claude Code classifies error:
   - **Auto-fixable**: Logic, syntax, data format issues
   - **External**: Auth, API limits, service outages
9. For auto-fixable:
   - Determine fix using skills knowledge
   - Apply via MCP update_workflow
   - Trigger retest via MCP execute_workflow
   - Report result to user
10. For external:
    - Explain issue clearly
    - Provide specific action steps
    - Wait for user confirmation to retry

### Flow 3: User-Initiated Retry After External Fix

```
┌──────┐  "I fixed the API key, retry"  ┌────────────┐
│ User │───────────────────────────────▶│ Chat       │
└──────┘                                │ Interface  │
                                        └─────┬──────┘
                                              │
                                              ▼
                                        ┌────────────┐
                                        │ Claude     │
                                        │ Code       │
                                        └─────┬──────┘
                                              │
                                              ▼
                                        ┌────────────┐
                                        │ MCP        │
                                        │ execute_   │
                                        │ workflow   │
                                        └─────┬──────┘
                                              │
                              ┌───────────────┴───────────────┐
                              │                               │
                              ▼                               ▼
                       ┌────────────┐                  ┌────────────┐
                       │ Success    │                  │ Still      │
                       │ Report to  │                  │ Failing    │
                       │ user       │                  │ New error  │
                       └────────────┘                  │ analysis   │
                                                       └────────────┘
```

---

## Functional Requirements

### Chat Interface Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-UI-01 | Establish WebSocket connection to bridge server on load | High |
| FR-UI-02 | Display connection status indicator (connected/disconnected/reconnecting) | High |
| FR-UI-03 | Automatically attempt reconnection on disconnect with exponential backoff | High |
| FR-UI-04 | Display messages from both user and assistant in conversational format | High |
| FR-UI-05 | Stream incoming assistant messages in real-time (not wait for complete response) | High |
| FR-UI-06 | Maintain conversation history for duration of session | High |
| FR-UI-07 | Provide text input field for user messages | High |
| FR-UI-08 | Support sending messages via Enter key and button click | Medium |
| FR-UI-09 | Render markdown formatting in assistant messages | Medium |
| FR-UI-10 | Display timestamps on messages (optional, can be hidden) | Low |

### Bridge Server Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-BS-01 | Accept WebSocket connections from authenticated clients | High |
| FR-BS-02 | Spawn Claude Code process on new session with proper configuration | High |
| FR-BS-03 | Configure Claude Code with n8n MCP server and n8n-skills | High |
| FR-BS-04 | Forward user messages from WebSocket to Claude Code stdin | High |
| FR-BS-05 | Forward Claude Code stdout to WebSocket | High |
| FR-BS-06 | Assign unique session ID to each connection | High |
| FR-BS-07 | Terminate Claude Code process on WebSocket disconnect | High |
| FR-BS-08 | Expose HTTP endpoint for error callbacks from n8n | High |
| FR-BS-09 | Route error callbacks to correct session based on session ID | High |
| FR-BS-10 | Handle session not found for error callbacks gracefully | Medium |
| FR-BS-11 | Support multiple concurrent sessions | Medium |
| FR-BS-12 | Retrieve credentials from Secrets Manager at startup | High |
| FR-BS-13 | Log session lifecycle events (create, message, error, close) | Medium |

### Claude Code Behavior Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CC-01 | Interpret natural language workflow descriptions | High |
| FR-CC-02 | Consult n8n-skills before building or fixing workflows | High |
| FR-CC-03 | Plan workflow structure before implementation | High |
| FR-CC-04 | Communicate plan to user before building | Medium |
| FR-CC-05 | Use MCP tools to create workflows in user's n8n instance | High |
| FR-CC-06 | Trigger test execution after creating or modifying workflow | High |
| FR-CC-07 | Classify errors into auto-fixable vs external categories | High |
| FR-CC-08 | Apply fixes for auto-fixable errors without user intervention | High |
| FR-CC-09 | Retest automatically after applying fixes | High |
| FR-CC-10 | Provide clear explanation for external errors requiring user action | High |
| FR-CC-11 | Wait for user confirmation before retrying after external fixes | High |
| FR-CC-12 | Maintain context of what has been built within session | High |
| FR-CC-13 | Support follow-up modifications to existing workflows | Medium |
| FR-CC-14 | Provide completion summary when workflow is ready | Medium |

### n8n Error Handler Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-EH-01 | Trigger on errors from designated workflows | High |
| FR-EH-02 | Extract workflow ID, name, failed node, error message from error event | High |
| FR-EH-03 | Extract session ID from workflow settings if present | High |
| FR-EH-04 | Send error context to bridge server via HTTP POST | High |
| FR-EH-05 | Retry HTTP request on failure (3 attempts) | Medium |
| FR-EH-06 | Log errors that could not be delivered | Medium |

### n8n-skills Integration Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-SK-01 | All 7 skills must be installed in Claude Code environment | High |
| FR-SK-02 | Skills must activate based on context (expression work, MCP operations, etc.) | High |
| FR-SK-03 | Expression Syntax skill consulted for any expression writing or errors | High |
| FR-SK-04 | MCP Tools Expert consulted for all MCP operations | High |
| FR-SK-05 | Workflow Patterns consulted when creating new workflows | High |
| FR-SK-06 | Validation Expert consulted when validation errors occur | High |
| FR-SK-07 | Node Configuration consulted when configuring specific nodes | Medium |
| FR-SK-08 | Code JavaScript consulted when Code nodes are involved | High |
| FR-SK-09 | Code Python consulted only when Python Code nodes are specifically needed | Low |

---

## Non-Functional Requirements

### Performance Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-P-01 | Response streaming start latency | < 3 seconds |
| NFR-P-02 | Error detection and routing latency | < 5 seconds |
| NFR-P-03 | Concurrent sessions per container | >= 10 |
| NFR-P-04 | WebSocket message throughput | >= 100 messages/second per session |
| NFR-P-05 | MCP operation response time | < 10 seconds for most operations |

### Reliability Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-R-01 | Bridge server uptime | 99.5% |
| NFR-R-02 | Graceful handling of Claude Code process crashes | Notify user, allow new session |
| NFR-R-03 | Error callback delivery success rate | 99% |
| NFR-R-04 | Session state on container restart | Acceptable loss (user informed) |

### Security Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-S-01 | All credentials stored in Secrets Manager | Required |
| NFR-S-02 | TLS for all external communications | Required |
| NFR-S-03 | No credentials in logs or error messages | Required |
| NFR-S-04 | Error callback endpoint validation | Source verification |
| NFR-S-05 | Session isolation | No cross-session data access |

### Scalability Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-SC-01 | Horizontal scaling support | Required |
| NFR-SC-02 | Auto-scaling trigger | Active connections > 80% capacity |
| NFR-SC-03 | Scale down behavior | Drain connections before termination |

### Observability Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-O-01 | Log all session lifecycle events | Required |
| NFR-O-02 | Log all errors and fix attempts | Required |
| NFR-O-03 | Metrics: active sessions, errors processed, fix success rate | Required |
| NFR-O-04 | Alerting on high error rates | Required |
| NFR-O-05 | Alerting on connection failures to n8n | Required |

---

## User Experience Design

### Interaction Patterns

#### Pattern 1: Conversational Workflow Building

**User Journey**:
1. User opens chat interface
2. User describes desired automation
3. System confirms understanding and states plan
4. System builds incrementally, reporting progress
5. System tests and reports success or begins healing
6. User receives completed workflow summary

**Example Conversation**:
```
User: I need a workflow that monitors a Google Sheet for new rows 
      and sends a Slack message when the status column changes to "Done"
Assistant: I need a workflow that monitors a Google Sheet for new rows 
          and sends a Slack message when the status column changes to "Done"

          Perfect, I understand. Here is my plan:

          1. Google Sheets Trigger - poll for changes every minute
          2. IF Node - check if status column equals "Done"  
          3. Slack Node - send message to your channel

          I will create this now and run a test...

          Workflow created: "Sheet Status to Slack" (ID: abc123)
          Testing with sample data...
          Test passed! 

          The workflow is active. It will check your sheet every minute and 
          send a Slack message when any row's status changes to "Done".

          Want me to adjust the check frequency or message format?
```

#### Pattern 2: Automatic Error Healing

**User Journey**:
1. User is testing a workflow (via chat or directly in n8n)
2. Error occurs
3. System catches error and announces it
4. System diagnoses and fixes automatically
5. System retests and confirms fix
6. User continues development

**Example Conversation**:
```
User: Test the workflow
Assistant: Running test now...

          Error detected in "Slack" node:
          "channel_not_found: The channel #notifications does not exist"

          Analyzing... This looks like a configuration issue. The Slack 
          channel name might be incorrect or the bot is not invited.

          Let me check the available channels in your Slack workspace...

          Found channels: #general, #alerts, #team-updates

          I will update the node to use #alerts instead. Applying fix...

          Fix applied. Retesting...

          Test passed! Message successfully sent to #alerts.

          Note: If you want a different channel, let me know and I will update it.
```

#### Pattern 3: External Issue Guidance

**User Journey**:
1. Error occurs that requires human action
2. System explains the issue clearly
3. System provides specific steps for resolution
4. User performs the action
5. User confirms completion
6. System retests

**Example Conversation**:
```
Assistant: Error detected in "HubSpot" node:
          "401 Unauthorized - Invalid API key"

          This is an external authentication issue that I cannot fix automatically.

          What you need to do:
          1. Go to your n8n credentials page
          2. Find the HubSpot credential
          3. Update the API key (it may have expired or been revoked)
          4. Save the credential

          Once you have done that, say "retry" and I will test again.

User: I regenerated the API key and updated it. retry
Assistant: Retesting now...

          Test passed! HubSpot authentication is working and the workflow 
          completed successfully.
```

### Error Communication Guidelines

When communicating errors to users, the system follows these principles:

**Be Specific**: Instead of "there was an error in the HTTP node", say "the HTTP Request node returned a 401 Unauthorized error when calling the Slack API"

**Explain Why**: Help users understand root causes. "This usually means the API token has expired or does not have the required scopes"

**Provide Action Steps**: For external issues, give numbered steps the user can follow

**Show Confidence Level**: If the system is uncertain about a diagnosis, say so. "This looks like a rate limiting issue, but it could also be a temporary service outage"

**Avoid Blame**: Never imply the user did something wrong. Focus on what needs to happen next

### Session State Expectations

**Within a Session**:
- System remembers all workflows discussed
- System remembers user preferences expressed
- Previous context informs current responses
- Follow-up requests do not require re-explanation

**Across Sessions**:
- No conversation history retained
- Workflows persist in n8n but system does not automatically know about them
- Users can reference existing workflows by asking system to look them up

---

## Technical Specifications

### Bridge Server Technology Stack

**Runtime**: Node.js 20+

**Core Dependencies**:
- ws: WebSocket server implementation
- express: HTTP server for error callbacks
- @anthropic-ai/claude-code: Claude Code CLI wrapper (if available) or child_process for direct CLI
- @aws-sdk/client-secrets-manager: Credential retrieval

**Process Management**:
- Each session spawns a Claude Code child process
- stdin/stdout pipes for communication
- Process cleanup on disconnect or timeout

### Claude Code Configuration

**MCP Configuration File** (~/.claude/mcp.json):
```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["@n8n/mcp-server"],
      "env": {
        "N8N_API_URL": "${N8N_API_URL}",
        "N8N_API_KEY": "${N8N_API_KEY}"
      }
    }
  }
}
```

**Skills Installation**:
```bash
# Clone and install n8n-skills
git clone https://github.com/czlonkowski/n8n-skills.git
cp -r n8n-skills/dist/* ~/.claude/skills/
```

**Claude Code Launch Command**:
```bash
claude --allowedTools mcp__n8n --mcp-config /path/to/mcp.json
```

### Frontend Technology Stack

**Recommended**: React or Vue.js single-page application

**Key Libraries**:
- WebSocket client with reconnection (reconnecting-websocket or similar)
- Markdown renderer (marked or react-markdown)
- State management for conversation history

**Hosting**: S3 + CloudFront or similar static hosting

### AWS Services Configuration

| Service | Purpose | Configuration |
|---------|---------|---------------|
| ECS Fargate | Bridge server hosting | 0.5-1 vCPU, 1-2 GB memory per task |
| ECR | Container image registry | Single repository |
| ALB | WebSocket load balancing | Sticky sessions, WebSocket support |
| API Gateway | Alternative WebSocket endpoint | WebSocket API type |
| Secrets Manager | Credential storage | Anthropic key, n8n credentials |
| CloudWatch | Logging and metrics | Log groups per service |
| IAM | Service permissions | Task roles, execution roles |

---

## AWS Deployment Strategy

### Phase 1: Single-User Deployment

**Objective**: Get the system working for one user with minimal complexity

**Infrastructure**:
- Single ECS task (no auto-scaling initially)
- Direct ALB access (no API Gateway)
- Credentials hardcoded in Secrets Manager
- CloudWatch for basic logging

**Deployment Steps**:
1. Create ECR repository
2. Build and push container image
3. Create ECS cluster and task definition
4. Configure ALB with WebSocket support
5. Deploy ECS service
6. Deploy frontend to S3/CloudFront
7. Create n8n error handler workflow
8. Test end-to-end

### Phase 2: Production Hardening

**Objective**: Make the system reliable and observable

**Additions**:
- Auto-scaling based on connection count
- Health checks and automatic recovery
- Comprehensive logging and metrics
- Alerting on failures
- Backup error handling (queue undeliverable errors)

### Phase 3: Multi-User Support (Future)

**Objective**: Support multiple users with isolated credentials

**Additions**:
- User authentication (Cognito or similar)
- Per-user credential storage
- Session isolation and resource limits
- Usage tracking and billing integration

### Container Dockerfile Outline

```dockerfile
FROM node:20-slim

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Install n8n-skills
RUN git clone https://github.com/czlonkowski/n8n-skills.git /tmp/n8n-skills \
    && mkdir -p /root/.claude/skills \
    && cp -r /tmp/n8n-skills/dist/* /root/.claude/skills/ \
    && rm -rf /tmp/n8n-skills

# Install bridge server dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Configure MCP
COPY mcp-config.json /root/.claude/mcp.json

EXPOSE 8080 3000

CMD ["node", "server.js"]
```

### Infrastructure as Code

Recommended: Terraform or AWS CDK

**Key Resources to Define**:
- VPC with public/private subnets
- ECS cluster and service
- Task definition with container config
- ALB with target group
- Security groups
- IAM roles and policies
- Secrets Manager secrets
- CloudWatch log groups
- S3 bucket for frontend
- CloudFront distribution

---

## Testing Strategy

### Unit Testing

**Bridge Server Tests**:
- Session management (create, destroy, lookup)
- Message routing logic
- Error callback parsing
- Credential retrieval

**Frontend Tests**:
- WebSocket connection handling
- Message display rendering
- Reconnection logic

### Integration Testing

**Component Integration**:
- WebSocket connection establishment
- Message round-trip (user -> Claude Code -> user)
- Error callback routing
- MCP operation execution

**Test Environment**:
- Dedicated n8n instance for testing
- Mock credentials
- Isolated from production

### End-to-End Testing

**Test Scenarios**:

| Scenario | Description | Success Criteria |
|----------|-------------|------------------|
| Simple Build | Create basic webhook workflow | Workflow exists and executes |
| Build with Error | Create workflow with intentional error | Error detected and fixed automatically |
| External Error | Trigger auth error | Clear guidance provided, retry works |
| Complex Build | Multi-node workflow with data transformation | All nodes configured correctly |
| Modification | Change existing workflow | Changes applied, tests pass |

### Load Testing

**Metrics to Measure**:
- Concurrent session capacity
- Response latency under load
- Error callback processing time
- Memory usage over time

---

## Success Metrics

### Primary Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Auto-Fix Rate | % of code/data errors fixed without human intervention | > 70% |
| Time to Working | Minutes from description to tested workflow | < 10 min for simple workflows |
| Error Resolution Time | Seconds from error to successful retest | < 60s for auto-fixable |

### Secondary Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Session Duration | Average time users engage per session | > 15 min (indicates value) |
| Workflows Created | Total workflows successfully created | Growth over time |
| Return Usage | % of users who return for multiple sessions | > 50% |

### Quality Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Hallucinated Fixes | Fixes that break other functionality | < 5% |
| Infinite Loops | Repeated failed fix attempts | < 2% of errors |
| False External | Auto-fixable errors incorrectly classified as external | < 10% |

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| n8n API limitations | Medium | High | Research API early, design for degradation |
| Claude Code session instability | Medium | Medium | Health checks, session recycling, max duration |
| MCP integration complexity | Medium | High | Evaluate existing servers, budget custom dev time |
| n8n-skills knowledge gaps | Low | Medium | Contribute fixes upstream, maintain local patches |

### User Experience Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Overconfidence in fixes | Medium | Medium | Always summarize changes, encourage review |
| Capability confusion | Medium | Low | Clear onboarding, graceful out-of-scope handling |
| Slow response times | Low | High | Streaming responses, progress indicators |

### Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Cost overruns | Medium | Medium | Usage tracking, spending alerts |
| Security incident | Low | High | Follow best practices, rotate credentials, audit logs |
| Service dependency outage | Low | Medium | Graceful degradation, user notification |

---

## Future Enhancements

### Version 2 Features

**Workflow Templates**:
- Pre-built patterns for common use cases
- User can say "create a lead capture workflow" and get a template
- Templates customized based on connected services

**Proactive Suggestions**:
- Analyze existing workflows for improvement opportunities
- Suggest error handling additions
- Identify potential performance issues

**Version Control**:
- Track changes to workflows over time
- Enable rollback to previous versions
- Diff view for changes

### Version 3 Features

**Multi-Workflow Orchestration**:
- Help design systems of interconnected workflows
- Manage dependencies between workflows
- Test entire workflow systems together

**Team Collaboration**:
- Multiple users working on workflows
- Shared context and history
- Role-based access control

**Natural Language Monitoring**:
- Describe alerts in natural language
- System configures monitoring and notifications
- "Alert me if this workflow fails more than 3 times in an hour"

### Integration Expansions

**Additional Platforms**:
- Make (Integromat) support
- Zapier support
- Custom automation platforms

**IDE Integration**:
- VS Code extension
- Bring conversational builder into development environment

**Messaging Bot**:
- Slack or Teams bot interface
- Build and manage workflows without leaving chat

---

## Appendices

### Appendix A: Claude Code System Prompt Template

```
You are an expert n8n workflow developer and debugger with direct access to the 
user's n8n instance via MCP tools. You have comprehensive knowledge from the 
n8n-skills knowledge base.

ROLE:
- Build n8n workflows from natural language descriptions
- Diagnose and fix workflow errors automatically
- Guide users through issues you cannot fix directly

CAPABILITIES:
- Create, read, update workflows via n8n MCP
- Trigger test executions
- Access n8n-skills knowledge for correct patterns and syntax
- Classify errors as auto-fixable or external

WORKFLOW FOR BUILDING:
1. Understand the user's goal
2. Consult n8n-skills for appropriate patterns
3. Plan the workflow structure
4. Communicate plan to user
5. Build incrementally, testing after each significant addition
6. Report completion with summary

WORKFLOW FOR ERRORS:
1. Receive error context
2. Consult n8n-skills error catalogs
3. Classify error:
   - CODE_ERROR: Logic bugs, syntax errors -> Fix automatically
   - DATA_ERROR: Missing fields, wrong types -> Fix automatically  
   - EXTERNAL_ERROR: Auth, API limits, service issues -> Guide user
4. For auto-fixable: Apply fix via MCP, retest, report result
5. For external: Explain clearly, provide steps, wait for "retry"

COMMUNICATION STYLE:
- Concise but informative
- Show work in progress
- Confirm actions taken
- Never blame the user
- Express uncertainty when appropriate

BOUNDARIES:
- Do not modify workflows marked as production without explicit confirmation
- Do not access systems outside n8n MCP
- Do not store or log sensitive data from workflows

SAFETY:
- Always warn before destructive actions
- Never delete without explicit confirmation
- Preserve existing functionality when modifying
```

### Appendix B: Error Classification Reference

**Auto-Fixable Errors (CODE_ERROR)**:
- Expression syntax errors
- Missing required fields in node configuration
- Incorrect data type handling
- JSON parsing errors
- Reference errors (wrong node names)
- Array vs single item mismatches

**Auto-Fixable Errors (DATA_ERROR)**:
- Null/undefined field access
- Missing expected properties
- Data format mismatches
- Empty array handling

**External Errors (Require Human Action)**:
- Authentication failures (401, 403)
- API rate limiting (429)
- Service unavailable (503)
- Invalid credentials
- Missing permissions/scopes
- Network connectivity issues
- External service bugs

### Appendix C: n8n Error Handler Workflow JSON Template

```json
{
  "name": "Self-Healing Error Handler",
  "nodes": [
    {
      "name": "Error Trigger",
      "type": "n8n-nodes-base.errorTrigger",
      "position": [250, 300]
    },
    {
      "name": "Extract Context",
      "type": "n8n-nodes-base.code",
      "position": [450, 300],
      "parameters": {
        "jsCode": "// Extract error context\nconst errorContext = {\n  sessionId: $input.first().json.workflow.settings?.sessionId || 'default',\n  workflowId: $input.first().json.workflow.id,\n  workflowName: $input.first().json.workflow.name,\n  failedNodeName: $input.first().json.execution.lastNodeExecuted,\n  errorMessage: $input.first().json.execution.error.message,\n  errorStack: $input.first().json.execution.error.stack || '',\n  executionId: $input.first().json.execution.id,\n  timestamp: new Date().toISOString()\n};\n\nreturn [{ json: errorContext }];"
      }
    },
    {
      "name": "Send to Bridge",
      "type": "n8n-nodes-base.httpRequest",
      "position": [650, 300],
      "parameters": {
        "method": "POST",
        "url": "={{ $env.BRIDGE_CALLBACK_URL }}/error-callback",
        "sendBody": true,
        "bodyContentType": "json",
        "body": "={{ JSON.stringify($json) }}"
      }
    }
  ],
  "connections": {
    "Error Trigger": {
      "main": [[{"node": "Extract Context", "type": "main", "index": 0}]]
    },
    "Extract Context": {
      "main": [[{"node": "Send to Bridge", "type": "main", "index": 0}]]
    }
  }
}
```

### Appendix D: Glossary

| Term | Definition |
|------|------------|
| Bridge Server | AWS-hosted service managing chat connections and Claude Code sessions |
| Claude Code | Anthropic's command-line AI agent with tool execution capabilities |
| Error Handler Workflow | n8n workflow that catches and routes errors to the bridge server |
| Healing Mode | System state where errors are automatically caught and processed |
| MCP | Model Context Protocol - standard for AI tool integration |
| n8n | Open-source workflow automation platform |
| n8n-skills | Curated knowledge base for n8n development best practices |
| Self-Healing | Automatic error diagnosis and repair without human intervention |
| Session | Single user interaction period from connection to disconnection |

### Appendix E: Reference Links

- n8n Documentation: https://docs.n8n.io
- n8n MCP Server: https://github.com/czlonkowski/n8n-mcp
- n8n-skills: https://github.com/czlonkowski/n8n-skills
- n8n-skills Website: https://www.n8n-skills.com
- Claude Code Documentation: https://docs.anthropic.com/claude-code
- MCP Specification: https://modelcontextprotocol.io

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-27 | Initial | Complete project outline |

---

*This document serves as the comprehensive specification for the Interactive n8n Workflow Builder with Self-Healing Capabilities project. It is intended to provide sufficient detail for Claude Code or a development team to implement the system.*
