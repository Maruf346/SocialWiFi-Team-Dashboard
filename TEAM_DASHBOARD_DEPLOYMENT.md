# RightRoute Team Dashboard Deployment Guide

This guide deploys the RightRoute team dashboard to:

```text
https://team.getrightroute.app/
```

The admin dashboard is already deployed to:

```text
https://admin.getrightroute.app/
```

The production setup uses:

- Amazon S3 for static frontend files
- One shared S3 bucket for both dashboards
- One shared CloudFront distribution for both subdomains
- AWS Certificate Manager for HTTPS
- SiteGround DNS records pointing both subdomains to CloudFront
- GitHub Actions for CI/CD
- GitHub OIDC for AWS authentication without long-lived AWS keys

The shared S3 bucket structure should be:

```text
s3://rightroute-dashboard/
  admin/
    index.html
    assets/...
  team/
    index.html
    assets/...
```

This team dashboard must deploy only to:

```text
s3://rightroute-dashboard/team/
```

## 1. Confirm Existing AWS Setup

Before changing the team dashboard repo, confirm these existing pieces are ready.

AWS:

- S3 bucket exists: `rightroute-dashboard`
- Admin dashboard files are deployed under `admin/`
- CloudFront distribution exists and is already serving `admin.getrightroute.app`
- ACM certificate exists in `us-east-1`
- ACM certificate includes both names:
  - `admin.getrightroute.app`
  - `team.getrightroute.app`
- SiteGround DNS has records for both subdomains pointing to the shared CloudFront distribution

Important: CloudFront certificates for custom domains must be created in:

```text
US East (N. Virginia) us-east-1
```

## 2. Confirm This App Builds To `dist`

This repo is a Vite app. The build command is:

```bash
npm ci
npm run build
```

The production output folder is:

```text
dist/
```

Use this GitHub Actions variable later:

```text
BUILD_DIR=dist
```

## 3. Configure CloudFront For One Shared Distribution

Because both dashboards use one CloudFront distribution and one S3 bucket, CloudFront must know which S3 folder to use for each hostname.

Do not leave the distribution with only:

```text
Origin path: /admin
```

If the origin path stays `/admin`, then `team.getrightroute.app` will also read files from:

```text
s3://rightroute-dashboard/admin/
```

For the shared distribution setup, use this approach:

```text
Origin path: blank
CloudFront Function: rewrites by Host header
admin.getrightroute.app -> /admin/...
team.getrightroute.app  -> /team/...
```

### Origin

In the CloudFront distribution origin settings:

```text
Origin domain: rightroute-dashboard.s3.<region>.amazonaws.com
Origin path: leave empty
Origin access: Origin access control settings
OAC: existing OAC for the private S3 bucket
```

Keep the bucket private. Do not enable public S3 static website hosting.

### Alternate Domain Names

The same distribution should include:

```text
admin.getrightroute.app
team.getrightroute.app
```

Use the existing ACM certificate that includes both names.

## 4. Add The CloudFront Function

Create a CloudFront Function to rewrite requests based on hostname.

Go to:

```text
CloudFront -> Functions -> Create function
```

Example name:

```text
rightroute-dashboard-host-prefix-rewrite
```

Use this function code:

```js
function handler(event) {
  var request = event.request;
  var host = request.headers.host.value;
  var uri = request.uri;

  var prefix = host === 'team.getrightroute.app' ? '/team' : '/admin';

  if (uri === '/' || uri === '') {
    request.uri = prefix + '/index.html';
    return request;
  }

  if (uri.endsWith('/')) {
    request.uri = prefix + uri + 'index.html';
    return request;
  }

  if (!uri.includes('.')) {
    request.uri = prefix + '/index.html';
    return request;
  }

  request.uri = prefix + uri;
  return request;
}
```

Publish the function.

Then attach it to the distribution cache behavior:

```text
CloudFront -> Distribution -> Behaviors -> Default behavior -> Edit
Function associations:
  Viewer request: rightroute-dashboard-host-prefix-rewrite
```

This means:

```text
https://team.getrightroute.app/             -> s3://rightroute-dashboard/team/index.html
https://team.getrightroute.app/assets/x.js -> s3://rightroute-dashboard/team/assets/x.js
https://team.getrightroute.app/routes      -> s3://rightroute-dashboard/team/index.html
```

And admin still maps to:

```text
https://admin.getrightroute.app/             -> s3://rightroute-dashboard/admin/index.html
https://admin.getrightroute.app/assets/x.js -> s3://rightroute-dashboard/admin/assets/x.js
https://admin.getrightroute.app/users       -> s3://rightroute-dashboard/admin/index.html
```

## 5. Review SPA Error Responses

With the CloudFront Function above, normal frontend routes are rewritten to the correct `index.html` before CloudFront reaches S3.

Still keep custom error responses as a safety fallback:

```text
HTTP error code: 403
Customize error response: Yes
Response page path: /index.html
HTTP response code: 200
Error caching minimum TTL: 0
```

```text
HTTP error code: 404
Customize error response: Yes
Response page path: /index.html
HTTP response code: 200
Error caching minimum TTL: 0
```

If the function is active and the origin path is blank, most SPA navigation should work from the function itself.

## 6. Confirm S3 Bucket Policy Allows CloudFront

The bucket should allow the shared CloudFront distribution to read objects from both prefixes.

The bucket policy should look similar to this:

```json
{
  "Version": "2008-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::rightroute-dashboard/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::<AWS_ACCOUNT_ID>:distribution/<DISTRIBUTION_ID>"
        }
      }
    }
  ]
}
```

Replace:

```text
<AWS_ACCOUNT_ID>
<DISTRIBUTION_ID>
```

Keep S3 public access blocked.

## 7. Confirm SiteGround DNS

In SiteGround DNS, both records should point to the same CloudFront distribution domain.

Example:

```text
admin.getrightroute.app -> <cloudfront-domain>.cloudfront.net
team.getrightroute.app  -> <cloudfront-domain>.cloudfront.net
```

For a non-Route 53 DNS provider, this is usually a CNAME record.

After DNS is saved, check:

```bash
nslookup team.getrightroute.app
```

or:

```bash
dig team.getrightroute.app
```

## 8. Create IAM Policy For Team Dashboard Deployment

Create a separate IAM policy for the team dashboard so this repo can deploy only to the `team/` folder.

Go to:

```text
AWS Console -> IAM -> Policies -> Create policy -> JSON
```

Use:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowTeamDashboardS3Deploy",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::rightroute-dashboard",
        "arn:aws:s3:::rightroute-dashboard/team/*"
      ]
    },
    {
      "Sid": "AllowCloudFrontInvalidation",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::<AWS_ACCOUNT_ID>:distribution/<DISTRIBUTION_ID>"
    }
  ]
}
```

Replace:

```text
<AWS_ACCOUNT_ID>
<DISTRIBUTION_ID>
```

Name the policy:

```text
rightroute-team-dashboard-deploy-policy
```

## 9. Create IAM Role For GitHub Actions

Go to:

```text
AWS Console -> IAM -> Roles -> Create role
```

Choose:

```text
Trusted entity type: Web identity
Identity provider: token.actions.githubusercontent.com
Audience: sts.amazonaws.com
```

Attach:

```text
rightroute-team-dashboard-deploy-policy
```

Name the role:

```text
rightroute-team-dashboard-github-actions-role
```

Copy the role ARN:

```text
arn:aws:iam::<AWS_ACCOUNT_ID>:role/rightroute-team-dashboard-github-actions-role
```

## 10. Configure The IAM Trust Policy

Edit the role trust relationship.

Because the admin dashboard required GitHub's ID-based OIDC subject, use the same format for this team dashboard repo.

The team dashboard repository is:

```text
https://github.com/Maruf346/SocialWiFi-Team-Dashboard
```

The current GitHub IDs are:

```text
Owner: Maruf346@117565778
Repo: SocialWiFi-Team-Dashboard@1361011299
```

Use this trust policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::930056746500:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:Maruf346@117565778/SocialWiFi-Team-Dashboard@1361011299:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

This allows deployment only from the `main` branch of this exact team dashboard repository.

If the repository is deleted/recreated, transferred, or GitHub OIDC customization changes, the numeric repo ID may change. In that case, use the temporary debug step below to print the real `sub` claim and update this policy.

If deployment fails with:

```text
Could not assume role with OIDC: Not authorized to perform sts:AssumeRoleWithWebIdentity
```

temporarily add the OIDC debug step from section 15, rerun the workflow, copy the actual `sub` claim, and update the IAM trust policy to match it exactly.

## 11. Add GitHub Actions Variables And Secret

In the team dashboard GitHub repository:

```text
Repository -> Settings -> Secrets and variables -> Actions
```

Add these repository variables:

```text
AWS_REGION
S3_BUCKET
CLOUDFRONT_DISTRIBUTION_ID
BUILD_DIR
```

Example values:

```text
AWS_REGION=ap-south-1
S3_BUCKET=rightroute-dashboard
CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
BUILD_DIR=dist
```

Add this repository secret:

```text
AWS_ROLE_ARN
```

Example:

```text
AWS_ROLE_ARN=arn:aws:iam::<AWS_ACCOUNT_ID>:role/rightroute-team-dashboard-github-actions-role
```

If this app needs frontend environment variables, add them as repository variables too.

For Vite, frontend variables must start with:

```text
VITE_
```

Example:

```text
VITE_API_BASE_URL=https://api.getrightroute.app
```

Do not put backend secrets in Vite frontend environment variables. Anything included in the frontend build is visible in the browser.

## 12. Add The GitHub Actions Workflow

Create:

```text
.github/workflows/deploy-team-dashboard.yml
```

Use:

```yaml
name: Deploy Team Dashboard

on:
  pull_request:
    branches:
      - main
  push:
    branches:
      - main

permissions:
  id-token: write
  contents: read

jobs:
  build:
    name: Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ vars.AWS_REGION }}

      - name: Upload static assets with long cache
        run: |
          aws s3 sync "${{ vars.BUILD_DIR }}/" "s3://${{ vars.S3_BUCKET }}/team/" \
            --delete \
            --exclude "index.html" \
            --cache-control "public,max-age=31536000,immutable"

      - name: Upload index.html with no cache
        run: |
          aws s3 cp "${{ vars.BUILD_DIR }}/index.html" "s3://${{ vars.S3_BUCKET }}/team/index.html" \
            --cache-control "no-cache,no-store,must-revalidate" \
            --content-type "text/html"

      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id "${{ vars.CLOUDFRONT_DISTRIBUTION_ID }}" \
            --paths "/*"
```

If the project later adds tests, add a test step before build.

## 13. Optional Build Environment Variables

If this app needs Vite environment variables, pass them to the build step.

Example:

```yaml
      - name: Build
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ vars.VITE_API_BASE_URL }}
```

Add the same environment block to both `build` and `deploy` jobs if both jobs run `npm run build`.

## 14. First Manual Deployment Test

Before relying on CI/CD, you can test one manual deployment from a machine with AWS CLI access.

Build locally:

```bash
npm ci
npm run build
```

Upload to the team prefix:

```bash
aws s3 sync dist/ s3://rightroute-dashboard/team/ \
  --delete \
  --exclude "index.html" \
  --cache-control "public,max-age=31536000,immutable"
```

Upload `index.html` with no cache:

```bash
aws s3 cp dist/index.html s3://rightroute-dashboard/team/index.html \
  --cache-control "no-cache,no-store,must-revalidate" \
  --content-type "text/html"
```

Invalidate CloudFront:

```bash
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"
```

Then open:

```text
https://team.getrightroute.app/
```

Also test refreshing an internal route, for example:

```text
https://team.getrightroute.app/login
```

## 15. Temporary OIDC Debug Step

Use this only if GitHub Actions cannot assume the AWS role.

Add this step before `Configure AWS credentials`:

```yaml
      - name: Debug GitHub OIDC claims
        run: |
          TOKEN_JSON=$(curl -s -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=sts.amazonaws.com")
          TOKEN=$(echo "$TOKEN_JSON" | jq -r '.value')
          echo "$TOKEN" | awk -F. '{print $2}' | base64 -d 2>/dev/null | jq .
```

Rerun the workflow and find:

```json
"sub": "..."
```

Update the IAM trust policy so this condition matches the printed `sub` value:

```json
"token.actions.githubusercontent.com:sub": "..."
```

After the role works, remove this debug step.

## 16. Deployment Flow After Setup

Expected flow:

```text
Open pull request
  -> GitHub Actions installs dependencies
  -> GitHub Actions runs lint
  -> GitHub Actions builds the app
  -> No deployment happens

Merge or push to main
  -> GitHub Actions installs dependencies
  -> GitHub Actions runs lint
  -> GitHub Actions builds the app
  -> GitHub Actions uploads files to s3://rightroute-dashboard/team/
  -> GitHub Actions invalidates CloudFront
  -> team.getrightroute.app serves the new version
```

## 17. Final Checklist

AWS:

- S3 bucket `rightroute-dashboard` exists
- `team/` prefix exists or will be created by deployment
- S3 public access is blocked
- CloudFront uses the private S3 bucket origin
- CloudFront origin path is blank for shared host-based routing
- CloudFront Function rewrites `team.getrightroute.app` to `/team`
- CloudFront Function rewrites `admin.getrightroute.app` to `/admin`
- CloudFront alternate domain names include `team.getrightroute.app`
- ACM certificate in `us-east-1` includes `team.getrightroute.app`
- S3 bucket policy allows this CloudFront distribution to read objects
- CloudFront invalidation works

SiteGround:

- `team.getrightroute.app` points to the shared CloudFront distribution
- `admin.getrightroute.app` still points to the same CloudFront distribution

IAM:

- GitHub OIDC provider exists
- Team deploy IAM policy exists
- Team deploy IAM role exists
- Trust policy is restricted to this team dashboard repo and `main`
- Policy allows writes only to `s3://rightroute-dashboard/team/*`

GitHub:

- `AWS_ROLE_ARN` secret exists
- `AWS_REGION` variable exists
- `S3_BUCKET=rightroute-dashboard`
- `CLOUDFRONT_DISTRIBUTION_ID` variable exists
- `BUILD_DIR=dist`
- `.github/workflows/deploy-team-dashboard.yml` exists

App:

- `npm ci` works
- `npm run lint` works
- `npm run build` works
- Refreshing frontend routes works on `team.getrightroute.app`
- Static assets load from the `team/` S3 prefix
