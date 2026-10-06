# Azure AZ-104 Lite Deployment

This branch is optimized for a one-month Azure trial.

## Required resources

1. Resource Group: rg-murgdur-az104
2. App Service Plan: Linux B1 for the trial
3. Web App: murgdur-api
4. Azure Database for PostgreSQL Flexible Server: murgdur-db
5. Storage Account: murgdur<unique>
6. Application Insights
7. Log Analytics workspace
8. Cost Management budget

Redis and Meilisearch are intentionally removed from the runtime path. Redis functionality uses an in-process TTL cache and search indexing uses PostgreSQL filtering.

## App Service settings

DATABASE_URL
JWT_SECRET
JWT_REFRESH_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
FRONTEND_URL
NODE_ENV=production
PORT=8080

Startup command: npm run start:prod

Health endpoint: GET /health

## PostgreSQL

Use a DATABASE_URL ending with ?sslmode=require.

The startup command runs prisma migrate deploy.

## AZ-104 evidence

Capture screenshots of the resource group, App Service plan, App Service configuration, PostgreSQL networking, Storage Account/container, RBAC assignments, managed identity, tags, Application Insights, Log Stream, metrics, Monitor alert, Cost Management budget, and GitHub Actions deployment.

## Cost control

Use the trial credit only for the project period. Delete the resource group when finished so the App Service and database cannot continue consuming paid credit.
