# Full Stack FastAPI and PostgreSQL - Boilerplate

Work Roadmap:

- [x] base nx setup with web and api apps
- [x] Web base
  - to build a simple web base for a commercial website
    - simple login to web with clerk
- [x] Api base
  - to build an api
    - has simple test routes that are unprotected
- [x] Api base clerk
  - has protected routes that require an auth from the clerk front end
- [x] Api DB simple
  - some sort of prisma setup with sqlite
  - connects the database with sqlite
  - get a simple value and augment and decrement a test value in a counter table
  - generate the prisma client scripts and migrations
  - setup prisma studio in nx target
- [x] Api Db user
  - make a User table and retrieve a user from the database
  - will need some sort of new user signup page and signup end points
  - make the CRUD for Users and link them to a google account
- [x] Web account page where info can be changed
  - make an account page for the user to see their info
    - add edit form for the user to change their info
- [x] Auth with Google
  - get a Google auth strategy in the front end and protect api routes
- [x] Auth with GitHub
  - get a GitHub auth strategy in the front end and protect api routes
- [x] Normalize the nx targets
  - [x] normalize the build for all targets in the nx workspace
  - [x] run through the entire build process and document the running in dev and prod
- [x] Look to implement drizzle
  - [x] switch to drizzle
  - [x] get migration working and execute on the User type in the web user-details form
  - [x] get the prod build working once
  - [x] comb through and realign all the build targets for nx
- [x] Turso public db on dev and prod
  - [x] get the turso public db up and running on dev
  - [x] get the turso public db up and running on prod
  - [x] set up the env vars to allow for single-source of db .env vars
  - [x] namespace the env per nx package
- [ ] go through the plan for ideas/pulumi-aws-entry-level-turso-plan.md
  - [ ] read through the plan
  - [ ] start hacking through the top
  - [ ] finish the plan and update it
- [ ] pulumi launch
  - [ ] build pulumi stack
  - [ ] deploy pulumi stack
  - [ ] run pulumi destroy
- [ ] Spike on docker
  - [ ] would docker help the build process or help the pulumi deploy?
- [ ] Apply error handling to calls in web. There are crashes and db problems rendering in the web app.
- [ ] TanStack query
  - to build out a simple query system for the front end to talk to the api
  - utilize resources, queries, and cache
- [ ] Github scan
  - to build a simple GitHub analysis tool
- [ ] Public github scan
  - to build a gitCraft site that other people can log in and see their numbers
- [ ] Intro credit store
  - to build out a simple store for people to spend their credits at

### Next

### Todo

- [ ] maybe add drizzle studio in the db setup
