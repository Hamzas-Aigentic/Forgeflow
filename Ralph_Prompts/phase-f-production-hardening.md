# Phase F: Production Hardening

## Overview
Add monitoring, security, and reliability features to prepare the system for real usage. Includes metrics, alerting, rate limiting, security headers, and graceful shutdown handling.

## Estimated Iterations
50 max

## Dependencies
- Phase E (CI/CD Pipeline) complete
- System deployed and working in dev environment

---

## Ralph Prompt

```
/ralph-loop:ralph-loop "Add production hardening to n8n Self-Healing Workflow Builder.

CONTEXT:
- System is deployed and working
- Need to add monitoring, security, and reliability features
- Preparing for real usage beyond personal testing

REQUIREMENTS:

1. Monitoring & Observability:

   Bridge Server Metrics (src/metrics.ts):
   - Prometheus metrics endpoint at GET /metrics
   - Metrics to track:
     - n8n_builder_active_sessions (gauge)
     - n8n_builder_messages_total (counter, labels: direction=in|out)
     - n8n_builder_errors_total (counter, labels: type=websocket|claude|callback)
     - n8n_builder_claude_execution_seconds (histogram)
     - n8n_builder_workflow_registrations_total (counter)
     - n8n_builder_error_callbacks_total (counter, labels: routed=true|false)
   - Use prom-client library

   Structured Logging (update src/logger.ts):
   - JSON format for all logs
   - Include: timestamp, level, message, requestId, sessionId
   - Request ID tracking through entire request lifecycle
   - Log Claude execution start/end with duration

   CloudWatch Integration:
   - CloudWatch dashboard (infrastructure/modules/monitoring/):
     - ECS CPU/Memory utilization
     - ALB request count, latency, errors
     - Active WebSocket connections (custom metric)
   - CloudWatch alarms:
     - ECS task count < desired (unhealthy)
     - ALB 5xx errors > 10 in 5 minutes
     - ALB latency p99 > 5 seconds
     - ECS memory utilization > 80%
   - SNS topic for alarm notifications
   - Log retention: 30 days

2. Security:

   Rate Limiting (src/middleware/rate-limiter.ts):
   - WebSocket connections: 10 per IP per minute
   - Error callbacks: 100 per minute total
   - Message rate: 20 messages per session per minute
   - Use express-rate-limit or custom implementation
   - Return 429 with Retry-After header

   Security Headers (src/middleware/security.ts):
   - Use helmet middleware
   - CORS: restrict to UI domain (configurable)
   - Content-Security-Policy for /health and /metrics
   - X-Request-ID header on all responses

   Input Validation (src/middleware/validation.ts):
   - Validate error callback payload schema
   - Validate WebSocket message format
   - Sanitize log output (no sensitive data)
   - Max message size limit (1MB)

   Infrastructure Security:
   - WAF rules on ALB (infrastructure/modules/waf/):
     - Rate limiting rule
     - SQL injection protection (basic)
     - XSS protection (basic)
     - Block known bad IPs (AWS managed rule)
   - Review security groups (least privilege)
   - S3 bucket: block all public access

3. Reliability:

   Graceful Shutdown (src/graceful-shutdown.ts):
   - Listen for SIGTERM, SIGINT
   - Stop accepting new connections
   - Send close message to all WebSocket clients
   - Wait for active Claude processes to complete (timeout 30s)
   - Close database connections if any
   - Exit cleanly
   - Update Dockerfile: use exec form, add tini

   Connection Management:
   - WebSocket ping/pong for keep-alive (every 30s)
   - Detect and clean up dead connections
   - Reconnection guidance in close message

   Memory Management:
   - Session cleanup job (runs every 5 minutes)
   - Max sessions limit (configurable, default 100)
   - Log memory usage periodically

   Infrastructure Reliability:
   - ECS auto-scaling (infrastructure/modules/ecs/):
     - Scale on CPU > 70%
     - Min 1, Max 3 tasks
     - Scale-in cooldown: 5 minutes
   - Multi-AZ deployment (already in networking)
   - S3 versioning enabled

4. Error Handling:

   Custom Error Classes (src/errors.ts):
   - BaseError (includes correlationId)
   - SessionNotFoundError
   - ClaudeExecutionError
   - RateLimitError
   - ValidationError
   - WebSocketError

   Global Error Handler (src/middleware/error-handler.ts):
   - Catch all errors
   - Log with full context
   - Return appropriate HTTP status
   - Include correlationId in response
   - Never expose stack traces to client

   Dead Letter Handling:
   - If error callback can't route (no session):
     - Log full payload
     - Store in DynamoDB or S3 for debugging (optional)
     - Include in metrics

5. Documentation:

   docs/operations.md:
   - System architecture overview
   - How to monitor (CloudWatch dashboard link)
   - Key metrics and what they mean
   - How to access logs
   - Common issues and troubleshooting
   - Runbook: high error rate
   - Runbook: high latency
   - Runbook: task unhealthy

   docs/security.md:
   - Security architecture
   - Authentication/authorization (none currently, note for future)
   - Secret rotation procedures
   - Security incident response
   - Penetration testing notes

FILES TO CREATE OR UPDATE:
- src/metrics.ts
- src/middleware/rate-limiter.ts
- src/middleware/security.ts
- src/middleware/validation.ts
- src/middleware/error-handler.ts
- src/errors.ts
- src/graceful-shutdown.ts
- src/logger.ts (update for structured logging)
- src/server.ts (integrate new middleware)
- infrastructure/modules/monitoring/main.tf
- infrastructure/modules/monitoring/variables.tf
- infrastructure/modules/monitoring/outputs.tf
- infrastructure/modules/waf/main.tf
- infrastructure/modules/waf/variables.tf
- infrastructure/modules/waf/outputs.tf
- infrastructure/modules/ecs/main.tf (add auto-scaling)
- Dockerfile (update for graceful shutdown)
- docs/operations.md
- docs/security.md

SUCCESS CRITERIA:
- GET /metrics returns Prometheus format metrics
- Metrics include all specified counters and gauges
- Rate limiting blocks excessive requests (test with ab or wrk)
- Structured JSON logs with request IDs
- CloudWatch dashboard shows all key metrics
- CloudWatch alarms configured and can be tested
- WAF rules deployed and active
- Graceful shutdown works (docker stop completes cleanly)
- No sessions leak memory over time
- Auto-scaling policy in place
- Security headers present (test with curl -I)
- Custom errors have correlation IDs
- Documentation is comprehensive and accurate

OUTPUT <promise>HARDENED</promise> when all criteria met." --max-iterations 50 --completion-promise "HARDENED"
```

---

## Verification Steps

After completion, verify:

```bash
# 1. Test metrics endpoint
curl http://localhost:3000/metrics
# Should return Prometheus format

# 2. Test rate limiting
for i in {1..15}; do
  curl -w "%{http_code}\n" -s -o /dev/null http://localhost:3000/health
done
# Should see 429 after limit

# 3. Test security headers
curl -I http://localhost:3000/health
# Should see X-Request-ID, security headers

# 4. Test graceful shutdown
docker run -d --name test-bridge bridge-server
docker stop test-bridge
docker logs test-bridge
# Should see graceful shutdown messages

# 5. Test structured logging
docker logs test-bridge | jq .
# Should be valid JSON

# 6. Load test
wrk -t12 -c400 -d30s http://localhost:3000/health
# Should handle load, rate limit kicks in
```

---

## CloudWatch Dashboard Queries

Example CloudWatch Insights queries for troubleshooting:

```
# Find errors by session
fields @timestamp, @message, sessionId
| filter level = "error"
| sort @timestamp desc
| limit 100

# Find slow Claude executions
fields @timestamp, duration, sessionId
| filter message like /Claude execution complete/
| filter duration > 5000
| sort duration desc

# Error callback routing failures
fields @timestamp, workflowId, @message
| filter message like /No session found for workflow/
| sort @timestamp desc
```

---

## Security Checklist

Before going to production:

- [ ] Secrets Manager contains real API key (not placeholder)
- [ ] WAF rules enabled and tested
- [ ] S3 bucket has no public access
- [ ] Security groups allow only necessary traffic
- [ ] CORS restricted to UI domain
- [ ] Rate limiting tuned for expected usage
- [ ] Logs don't contain sensitive data
- [ ] Error responses don't leak internals
- [ ] HTTPS enforced (not HTTP)
- [ ] Dependency vulnerabilities scanned (npm audit)
