# Phase D: AWS Infrastructure

## Overview
Create the AWS infrastructure using Terraform to deploy the n8n Self-Healing Workflow Builder. Includes ECS Fargate for the bridge server, S3/CloudFront for the UI, and all supporting resources.

## Estimated Iterations
60 max

## Dependencies
- Phase C (Integration Testing) complete
- AWS account with appropriate permissions
- Domain name (optional, can use CloudFront/ALB defaults)

---

## Ralph Prompt

```
/ralph-loop:ralph-loop "Create AWS infrastructure for n8n Self-Healing Workflow Builder using Terraform.

CONTEXT:
- Bridge server is a Node.js app that spawns Claude Code processes
- Chat UI is a static React app
- Need WebSocket support (sticky sessions or proper ALB config)
- Claude Code needs ANTHROPIC_API_KEY
- n8n instance is external (user's own cloud or self-hosted)

ARCHITECTURE:
- ECS Fargate for bridge server (serverless containers)
- Application Load Balancer with WebSocket support
- S3 + CloudFront for chat UI static hosting
- Secrets Manager for API keys
- CloudWatch for logging
- Single region deployment (us-east-1 default, configurable)

REQUIREMENTS:

1. Terraform Structure:
   infrastructure/
   ├── main.tf
   ├── variables.tf
   ├── outputs.tf
   ├── providers.tf
   ├── versions.tf
   ├── modules/
   │   ├── networking/
   │   │   ├── main.tf
   │   │   ├── variables.tf
   │   │   └── outputs.tf
   │   ├── ecs/
   │   │   ├── main.tf
   │   │   ├── variables.tf
   │   │   └── outputs.tf
   │   ├── alb/
   │   │   ├── main.tf
   │   │   ├── variables.tf
   │   │   └── outputs.tf
   │   ├── cloudfront/
   │   │   ├── main.tf
   │   │   ├── variables.tf
   │   │   └── outputs.tf
   │   └── secrets/
   │       ├── main.tf
   │       ├── variables.tf
   │       └── outputs.tf
   └── environments/
       ├── dev.tfvars
       └── prod.tfvars

2. Networking Module:
   - VPC with public and private subnets (2 AZs)
   - NAT Gateway for private subnet egress
   - Internet Gateway for public subnets
   - Security groups:
     - ALB: allow 80, 443 from anywhere
     - ECS: allow traffic from ALB only
   - VPC Flow Logs (optional, for debugging)

3. ECS Module:
   - Fargate cluster
   - Task definition for bridge server:
     - 2 vCPU, 4GB memory (Claude Code needs resources)
     - Container port 3000
     - Environment variables from Secrets Manager
     - CloudWatch log group
   - Service with desired count 1 (adjustable)
   - Task role with Secrets Manager read access
   - Execution role for ECR pull and logging
   - Health check on /health

4. ALB Module:
   - Application Load Balancer (public subnets)
   - Target group for ECS service
   - HTTP listener (redirect to HTTPS)
   - HTTPS listener (requires certificate, or HTTP only for dev)
   - Idle timeout set to 3600 seconds (for WebSocket)
   - Stickiness enabled for WebSocket sessions
   - Health check path: /health
   - Health check interval: 30s

5. CloudFront Module:
   - S3 bucket for UI static files (private)
   - Bucket policy for CloudFront OAI
   - CloudFront distribution:
     - Origin: S3 bucket
     - Origin Access Identity
     - HTTPS only (viewer protocol policy)
     - Cache policy for static assets
     - Error pages (404 -> /index.html for SPA)
   - Optional: custom domain with ACM certificate

6. Secrets Module:
   - Secrets Manager secret for ANTHROPIC_API_KEY
   - Secret version with placeholder (user fills in)
   - IAM policy document for ECS task access

7. Additional Resources:
   - ECR repository for bridge server image
   - CloudWatch log groups with retention (30 days)
   - IAM roles and policies

8. Variables (variables.tf):
   - environment (dev/prod)
   - aws_region
   - project_name
   - ecs_cpu
   - ecs_memory
   - desired_count
   - domain_name (optional)

9. Outputs (outputs.tf):
   - cloudfront_url
   - alb_dns_name
   - alb_url (full URL for bridge)
   - ecr_repository_url
   - ecs_cluster_name
   - ecs_service_name
   - s3_bucket_name
   - secrets_manager_arn

FILES TO CREATE:
- infrastructure/main.tf
- infrastructure/variables.tf
- infrastructure/outputs.tf
- infrastructure/providers.tf
- infrastructure/versions.tf
- infrastructure/backend.tf.example
- infrastructure/modules/networking/main.tf
- infrastructure/modules/networking/variables.tf
- infrastructure/modules/networking/outputs.tf
- infrastructure/modules/ecs/main.tf
- infrastructure/modules/ecs/variables.tf
- infrastructure/modules/ecs/outputs.tf
- infrastructure/modules/alb/main.tf
- infrastructure/modules/alb/variables.tf
- infrastructure/modules/alb/outputs.tf
- infrastructure/modules/cloudfront/main.tf
- infrastructure/modules/cloudfront/variables.tf
- infrastructure/modules/cloudfront/outputs.tf
- infrastructure/modules/secrets/main.tf
- infrastructure/modules/secrets/variables.tf
- infrastructure/modules/secrets/outputs.tf
- infrastructure/environments/dev.tfvars
- infrastructure/environments/prod.tfvars
- infrastructure/README.md

CONSIDERATIONS:
- WebSocket idle timeout must be increased (default 60s -> 3600s)
- ECS task needs enough resources for Claude Code processes
- Error callback URL = ALB DNS + /error-callback
- User configures this URL in their n8n error handler workflow
- For dev, can skip HTTPS/certificates and use HTTP only
- For prod, should use ACM certificates

SUCCESS CRITERIA:
- terraform init succeeds
- terraform validate passes
- terraform plan -var-file=environments/dev.tfvars shows expected resources
- terraform apply creates all infrastructure
- ALB health check passes after ECS service deploys
- Can connect to bridge server WebSocket via ALB
- CloudFront distribution serves UI (after manual S3 upload)
- Secrets Manager secret exists (user fills in API key)
- ECS task logs appear in CloudWatch
- terraform destroy cleans up everything
- README documents deployment steps
- Cost estimate included in README

OUTPUT <promise>INFRA_COMPLETE</promise> when all criteria met." --max-iterations 60 --completion-promise "INFRA_COMPLETE"
```

---

## Verification Steps

After completion, verify:

```bash
cd infrastructure

# Initialize
terraform init

# Validate
terraform validate

# Plan (dev environment)
terraform plan -var-file=environments/dev.tfvars

# Apply (creates real AWS resources - costs money!)
terraform apply -var-file=environments/dev.tfvars

# Get outputs
terraform output

# Test ALB health
curl http://$(terraform output -raw alb_dns_name)/health

# Test WebSocket
wscat -c ws://$(terraform output -raw alb_dns_name)/ws

# Clean up when done testing
terraform destroy -var-file=environments/dev.tfvars
```

---

## Post-Deployment Steps

1. **Add API Key to Secrets Manager:**
   ```bash
   aws secretsmanager put-secret-value \
     --secret-id n8n-builder-dev-anthropic-key \
     --secret-string '{"ANTHROPIC_API_KEY":"your-key-here"}'
   ```

2. **Push Docker Image to ECR:**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(terraform output -raw ecr_repository_url)
   docker build -t n8n-builder-bridge ./bridge-server
   docker tag n8n-builder-bridge:latest $(terraform output -raw ecr_repository_url):latest
   docker push $(terraform output -raw ecr_repository_url):latest
   ```

3. **Deploy UI to S3:**
   ```bash
   cd chat-ui
   npm run build
   aws s3 sync dist/ s3://$(terraform output -raw s3_bucket_name)/
   ```

4. **Invalidate CloudFront:**
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id $(terraform output -raw cloudfront_distribution_id) \
     --paths "/*"
   ```
