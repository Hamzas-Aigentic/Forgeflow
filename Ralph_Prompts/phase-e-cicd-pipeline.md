# Phase E: CI/CD Pipeline

## Overview
Create GitHub Actions workflows for continuous integration and deployment. Automates testing, building, and deploying both the bridge server and chat UI to AWS.

## Estimated Iterations
50 max

## Dependencies
- Phase D (AWS Infrastructure) complete
- GitHub repository set up
- AWS credentials available for GitHub Actions

---

## Ralph Prompt

```
/ralph-loop:ralph-loop "Create CI/CD pipeline for n8n Self-Healing Workflow Builder using GitHub Actions.

CONTEXT:
- Bridge server is Node.js/TypeScript in /bridge-server
- Chat UI is React/Vite in /chat-ui
- Infrastructure is Terraform in /infrastructure
- Deploying to AWS (ECS for bridge, S3/CloudFront for UI)
- Want automated deployments on push to main

REQUIREMENTS:

1. Workflow Files:

   .github/workflows/ci.yml:
   - Triggers: pull_request, push to main
   - Jobs:
     - lint-bridge: ESLint on bridge server
     - lint-ui: ESLint on chat UI
     - test-bridge: vitest for bridge server
     - test-ui: vitest for chat UI
     - build-bridge: Docker build (verify it works, don't push)
     - build-ui: Vite build
   - Use matrix for Node versions if desired
   - Cache npm dependencies
   - Fail fast on any error

   .github/workflows/deploy-dev.yml:
   - Triggers: push to main
   - Concurrency: cancel in-progress deploys
   - Jobs:
     - build-and-push-bridge:
       - Checkout code
       - Configure AWS credentials
       - Login to ECR
       - Build Docker image
       - Tag with commit SHA and 'latest'
       - Push to ECR
     - deploy-bridge:
       - Needs: build-and-push-bridge
       - Update ECS service to force new deployment
       - Wait for service stability (aws ecs wait)
     - build-and-deploy-ui:
       - Build Vite app with production env vars
       - Sync to S3 bucket
       - Invalidate CloudFront cache
   - Send Slack notification on success/failure (optional)

   .github/workflows/deploy-prod.yml:
   - Triggers: release published OR workflow_dispatch
   - Environment: production (requires approval)
   - Same jobs as deploy-dev but targets prod resources
   - Additional safety: require manual approval

   .github/workflows/terraform.yml:
   - Triggers: push to main (paths: infrastructure/**)
   - Also: pull_request (paths: infrastructure/**)
   - Jobs:
     - plan:
       - Run terraform plan
       - Post plan output as PR comment
     - apply:
       - Only on push to main (not PRs)
       - Environment: infrastructure (requires approval)
       - Run terraform apply

2. Reusable Workflows:

   .github/workflows/docker-build-push.yml:
   - Inputs: dockerfile_path, image_name, ecr_repository, push (bool)
   - Handles: login, build, tag, push
   - Outputs: image_tag

   .github/workflows/s3-cloudfront-deploy.yml:
   - Inputs: source_dir, s3_bucket, cloudfront_distribution_id
   - Handles: sync, invalidate

3. GitHub Environments:
   - dev: auto-deploy on push to main
   - production: require approval
   - infrastructure: require approval for terraform apply

4. Required Secrets (document in README):
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
   - AWS_REGION
   - ECR_REPOSITORY_DEV
   - ECR_REPOSITORY_PROD
   - ECS_CLUSTER_DEV
   - ECS_CLUSTER_PROD
   - ECS_SERVICE_DEV
   - ECS_SERVICE_PROD
   - S3_BUCKET_DEV
   - S3_BUCKET_PROD
   - CLOUDFRONT_DISTRIBUTION_ID_DEV
   - CLOUDFRONT_DISTRIBUTION_ID_PROD
   - SLACK_WEBHOOK_URL (optional)

5. Helper Scripts:

   scripts/deploy-bridge.sh:
   - Takes: cluster, service, image as args
   - Updates ECS service
   - Waits for stability
   - Returns exit code

   scripts/deploy-ui.sh:
   - Takes: bucket, distribution_id, source_dir as args
   - Syncs to S3
   - Invalidates CloudFront
   - Returns exit code

6. Branch Protection (document):
   - Require PR reviews
   - Require status checks to pass
   - No direct pushes to main

FILES TO CREATE:
- .github/workflows/ci.yml
- .github/workflows/deploy-dev.yml
- .github/workflows/deploy-prod.yml
- .github/workflows/terraform.yml
- .github/workflows/docker-build-push.yml
- .github/workflows/s3-cloudfront-deploy.yml
- scripts/deploy-bridge.sh
- scripts/deploy-ui.sh
- .github/CODEOWNERS
- .github/pull_request_template.md
- .github/dependabot.yml
- docs/ci-cd.md (detailed documentation)

SUCCESS CRITERIA:
- CI workflow runs on PR and all jobs pass
- PR shows status checks from CI
- Push to main triggers deploy-dev workflow
- Bridge server image pushed to ECR with correct tags
- ECS service updated and reaches stable state
- UI deployed to S3
- CloudFront cache invalidated
- Terraform plan posts to PR as comment
- Terraform apply requires approval
- Production deploy requires manual trigger and approval
- Workflows use caching (npm, Docker layers)
- Documentation explains all secrets and setup
- Deployment takes < 10 minutes total

OUTPUT <promise>CICD_COMPLETE</promise> when all criteria met." --max-iterations 50 --completion-promise "CICD_COMPLETE"
```

---

## Verification Steps

After completion, verify:

```bash
# 1. Create a test PR
git checkout -b test/ci-workflow
echo "# Test" >> README.md
git add . && git commit -m "Test CI"
git push origin test/ci-workflow
# Open PR - CI should run

# 2. Merge to main
# deploy-dev should trigger automatically

# 3. Check GitHub Actions tab
# All workflows should be green

# 4. Verify deployment
curl https://your-alb-url/health
# Open https://your-cloudfront-url
```

---

## Setting Up GitHub Secrets

```bash
# Using GitHub CLI
gh secret set AWS_ACCESS_KEY_ID --body "your-key"
gh secret set AWS_SECRET_ACCESS_KEY --body "your-secret"
gh secret set AWS_REGION --body "us-east-1"

# Get values from Terraform outputs
cd infrastructure
gh secret set ECR_REPOSITORY_DEV --body "$(terraform output -raw ecr_repository_url)"
gh secret set ECS_CLUSTER_DEV --body "$(terraform output -raw ecs_cluster_name)"
gh secret set ECS_SERVICE_DEV --body "$(terraform output -raw ecs_service_name)"
gh secret set S3_BUCKET_DEV --body "$(terraform output -raw s3_bucket_name)"
gh secret set CLOUDFRONT_DISTRIBUTION_ID_DEV --body "$(terraform output -raw cloudfront_distribution_id)"
```

---

## GitHub Environment Setup

1. Go to Repository Settings → Environments
2. Create `dev` environment (no protection rules)
3. Create `production` environment:
   - Add required reviewers
   - Add deployment branch rule: `main`
4. Create `infrastructure` environment:
   - Add required reviewers
