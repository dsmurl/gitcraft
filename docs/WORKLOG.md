# WorkLog

### 2025-09-15

- Made the base plan and road map for the project
- Build the base of the nx repo with apps/web and apps/api
- Worked out the pnx project and the package.json

### 2025-09-16

- Added cleanup scripts
- Added the package build scripts for the api and the web
- New web site with clerk and new api with some test routes. new docs section. nx adjusted apps
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
    - add edit form for the user to change their info
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

### Next

- look into pulumi options or docker options
