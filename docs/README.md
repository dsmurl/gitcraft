# Full Stack FastAPI and PostgreSQL - Boilerplate

Work Roadmap:

- [x] Web base
  - to build a simple web base for a commercial website
    - simple login to web with clerk
- [x] Api base
  - to build an api
    - has simple test routes that are unprotected
- [x] Api base clerk
  - has protected routes that require an auth from the clerk front end
- [ ] Api DB simple
  - connects the database with sqlite
  - get a simple value and augment and decrement a test value in a counter table
- [ ] Api Db user
  - make a User table and retrieve a user from the database
  - make the CRUD for Users and link them to a google account
- [ ] Auth with GitHub
  - try to get a GitHub auth strategy in the front end and protect api routes
- [ ] TanStack query
  - to build out a simple query system for the front end to talk to the api
  - utilize resources, queries, and cache
- [ ] Github scan
  - to build a simple GitHub analysis tool
- [ ] Public github scan
  - to build a gitCraft site that other people can login and see their numbers
- [ ] Intro credit store
  - to build out a simple store for people to spend their credits at

### Prod builds

- `pnpm run build:web`
  - `pnpm dlx serve -s apps/web/dist -l 4173`
- `pnpm run build:api`
  - `pnpm run api:start`
