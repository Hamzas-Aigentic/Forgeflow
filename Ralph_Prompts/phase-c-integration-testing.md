# Phase C: Local Integration Testing

## Overview
Create a comprehensive local testing setup to verify the Bridge Server and Chat UI work together correctly before deploying to AWS. Includes mock Claude for cost-free testing.

## Estimated Iterations
40 max

## Dependencies
- Phase A (Bridge Server) complete
- Phase B (Chat UI) complete

---

## Ralph Prompt

```
/ralph-loop:ralph-loop "Create local integration testing setup for Bridge Server + Chat UI.

CONTEXT:
- Bridge server built in Phase A
- Chat UI built in Phase B
- Need to verify they work together before AWS deployment
- Need to test error callback flow

REQUIREMENTS:

1. Docker Compose Setup (docker-compose.yml in project root):
   - bridge-server service (port 3000)
   - chat-ui service (port 8080)
   - Shared network

2. Mock Claude Script (scripts/mock-claude.sh):
   - Mimics claude -p behavior for testing without API costs
   - Echoes back formatted responses
   - Simulates streaming with sleep delays
   - Includes fake workflow creation responses with workflowIds
   - Example output: 'I created workflow abc123 for you'

3. Test Scripts:

   scripts/test-websocket.sh:
   - Uses wscat to connect and send test message
   - Verifies response received
   - Exits with appropriate code

   scripts/test-error-callback.sh:
   - Sends mock error payload to /error-callback
   - Verifies it routes correctly
   - Checks session received the error

   scripts/e2e-test.ts:
   - Playwright or Puppeteer for full E2E
   - Opens UI in browser
   - Sends message
   - Verifies response appears
   - Triggers error callback via API
   - Verifies error appears in chat

4. Environment Configs:
   - .env.development (local, real claude)
   - .env.mock (local, uses mock claude)
   - .env.test (for CI, uses mock claude)

5. Makefile:
   - make dev: starts bridge + ui with real claude
   - make mock: starts with mock claude (no API costs)
   - make test: runs unit tests for both projects
   - make test-e2e: runs E2E tests
   - make test-integration: runs integration tests
   - make clean: stops everything, removes containers
   - make logs: tails logs from all services

6. Documentation:
   - README section on local development
   - README section on testing
   - README section on mock mode
   - Troubleshooting common issues

FILES TO CREATE OR UPDATE:
- docker-compose.yml (root level, orchestrates both services)
- docker-compose.mock.yml (override for mock mode)
- scripts/mock-claude.sh
- scripts/test-websocket.sh
- scripts/test-error-callback.sh
- tests/e2e/chat.spec.ts
- tests/e2e/error-flow.spec.ts
- playwright.config.ts
- Makefile
- .env.development
- .env.mock
- .env.test
- README.md (update with testing sections)

SUCCESS CRITERIA:
- make mock starts both services with mock Claude
- Can access UI at http://localhost:8080
- UI connects to bridge at ws://localhost:3000/ws
- Full conversation flow works with mock Claude
- make test-integration passes
- Error callback test passes (scripts/test-error-callback.sh)
- E2E test passes (make test-e2e)
- make dev works with real Claude (requires API key)
- Mock responses include workflow IDs that get tracked
- Documentation is clear and complete

OUTPUT <promise>INTEGRATION_COMPLETE</promise> when all criteria met." --max-iterations 40 --completion-promise "INTEGRATION_COMPLETE"
```

---

## Verification Steps

After completion, verify manually:

```bash
# Start in mock mode (no API costs)
make mock

# Open browser to http://localhost:8080
# Send a message - should get mock response

# In another terminal, test error callback
./scripts/test-error-callback.sh

# Check UI - error should appear in chat

# Run full test suite
make test
make test-e2e
```

---

## Mock Claude Behavior

The mock script should simulate realistic Claude responses:

```bash
#!/bin/bash
# scripts/mock-claude.sh

# Read input
input=$(cat)

# Simulate thinking delay
sleep 0.5

# Generate response based on input
if [[ "$input" == *"workflow"* ]]; then
  echo "I'll create a workflow for you."
  sleep 0.3
  echo "Created workflow wf_$(date +%s) with the requested configuration."
else
  echo "I understand. Here's my response to: $input"
fi
```
