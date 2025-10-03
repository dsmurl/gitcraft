# WorkLog

### 2025-09-15

- Made the base plan and road map for the project
- Build the base of the nx repo with apps/web and apps/api
- Worked out the pnx project and the package.json

### 2025-09-16

- Added cleanup scripts
- Added the package build scripts for the api and the web
- New website with clerk and new api with some test routes. new docs section. nx adjusted apps
  - Converted from the shoptrad monorepo setup with protected routes and Header
- Added the basic api with some routes like health check and test routes
- Updated the ReadMe and doc structure

### 2025-09-17

- Added the clerk auth processing to the api
  - Added a protected api route that returns the auth data for the current session
- Added a test button for the auth api route to test the auth flow in the web app
- Api DB simple
  - prisma setup with sqlite
    - new lib/prisma nx lib
  - generate the prisma client scripts and migrations
  - setup prisma studio in nx target
- Api Db user
  - make a User table and retrieve a user from the database
  - will need some sort of new user signup page and signup end points
  - make the CRUD for Users and link them to a google account
  - make an account page for the user to see their info
    - add edit-user-form for the user to change their info
  - created svg icons and dir for the web app

### 2025-09-19

- added GitHub strategy to the Clerk configuration of mono-base-fe-be
- api allows multiple origin from .env now
- got the build targets working except stilla problem with api:build

### 2025-09-21

- fixed: got the build targets working except stilla problem with api:build
- got the dev, build, and serve targets working
- started migrations with drizzle with new lib, removed prisma
- copied prisma schema to drizzle
- created base drizzle nx structure and nx dep in api and other libs
- the dev build is currently broken
  - drizzle migrate isn't executing to create the user table

### 2025-09-22

- got the drizzle config aligned properly to generate and migrate
- aligned the env examples and the sqlite db vars to connect
- aligned and connected the user table
- played with intellij data viewer on User table
- aligned all the nx project build rules for dev and prod
  - and to include the drizzle
- ran the dev and prod builds and loaded User from db in both
- combed through the nx project files and aligned their dependencies to be robust
- updated the docs

### 2025-09-23

- Turso public db on dev and prod
  - get the turso public db up and running on dev and prod
  - set up the env vars to allow for single-source of db .env vars
  - saw the net public db for both dev and prod running both sqlite file and turso db
- cleaned initial debug/test counter stuff like api endpoints and COUNTER_INITIAL
- updated the api readme with a simple endpoint map
- aligned the env vars to be more namespaced per package

### 2025-09-24

- build the basic infra app for launching the website into s3 via pulumi
- build the basic foundation app for handling the route53 and the cert long term
- got into my pulumi account and added created a PULUMI_ACCESS_TOKEN to GitHub secrets
- tried a GitHub workflow to build and deploy the web app to s3 and it broke
  - I need to connect my pulumi account to my aws account via from
  - need to figure out GitHub secrets
  - need to figure out aws secrets
- added dev GitHub repo environment to add secrets and var for web per environment
  - added web env var to GitHub so that it can build the web artifact
- MILESTONE !!! aligned the web-build GitHub workflow to successfully build and store FE artifact
  - first successful GitHub action ever

### 2025-09-25

- made a plan for putting the web artifact into 3s and serving it.
- made a doc for web-setup-for-deploy.md
- added deploy job to the web-build github workflow

### 2025-09-26

- minor research of launching of web into s3 bucket

### 2025-09-27

- created step doc for ideas/pulumi-web-next-steps.md
- created the s3 bucket for dsmurl-gitcraft-web-infra-dev
- revised the plan to launch the web through s3
- aws manually created Identity provider, policy, and role for dev deploy from web-setup-for-deploy.md
- copied AWS_ROLE_TO_ASSUME to GitHub dev environment secrets
- added a lot of deploy infra to the web-build and the infra-up workflows
- got all the secrets and variables in place to try the first infra-up in Actions

### 2025-09-28

- conformed aws infra build roll to AWS_ROLE_TO_ASSUME
- patching the infra-preview job with a step for pnpm install and pulumi install
- trying to get the infra-up to work, but it's fully standing up yet

### 2025-10-03

- updated the node to 22.20 and pnpm to 10.18.0
- updated the better-sqlite3 to 12.4.1 from 7 and removed the unneeded types there
- found that api:dev was trying to point towards drizzle/dist/main.js
  - fixed by adding paths to the tsconfig.json to point dev towards libs/drizzle src code

### Next

- Need to figure out why the infra-up failed like "Run aws-actions/configure-aws-credentials@v4
  Error: Credentials could not be loaded, please check your action inputs: Could not load credentials from any
  providers"
  - This error means the OIDC → AssumeRole step didn’t produce AWS creds.

### Todo

- after the first web pulumi up, replace BUCKET_NAME, ACCOUNT_ID, and DISTRIBUTION_ID as appropriate. If you don’t know
  them yet, use one of the options under “When ARNs are unknown” below.

### Bugs

- possible bug: ensure on first load of a new user may be crashing the db call.
