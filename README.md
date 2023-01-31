## Heal Remote Schemas

A script for auto healing the inconsistent remote schemas in graphql-engine.

### Configurable parameters:

This script uses the following configurable parameters (environment variables) for running the auto-healing node server:
1. `GRAPHQL_ENGINE_URL`: The url of the graphql engine (e.g. `http://localhost:8080`)
2. `HASURA_GRAPHQL_ADMIN_SECRET`: The admin secret of the graphql engine.
3. `CHECK_INTERVAL_SECONDS`: The interval for checking the metadata for any inconsistencies (in seconds).
4. `RELOAD_INTERVAL_SECONDS`: The interval for reloading the remote schemas (in seconds).

### How does this work?

The checking thread runs the following query to the graphql-engine every `CHECK_INTERVAL_SECONDS`:
```
POST v1/metadata
admin

{
  "type": "get_inconsistent_metadata",
  "args": {}
}
```
If the above query returns any inconsistent remote schema, it stores them in an array.

Now, the reloading thread checks if the inconsistent remote schema array is empty every `RELOAD_INTERVAL_SECONDS`. If it
is empty, then it will just log:
```
All remote schemas are consistent.
```

Now, if the array is not empty, then it will try reloading the inconsistent remote schemas:
```
POST v1/metadata
admin

{
  "type" : "reload_metadata",
  "args": {
    "reload_remote_schemas": *inconsistentSchemas
  }
}
```

To run this server locally:
### Via node
```
npm install
touch .env
npm start
```

### Via docker
The image is also pushed to docker hub. So you can directly use that in your `docker-compose.yaml` file or run it
separately via docker run.

```yaml
version: '3.6'
services:
  heal-rs:
    image: paritosh08/heal-remote-schema
    environment:
      NODE_ENV: production
      GRAPHQL_ENGINE_URL: http://graphql-engine:8080
      HASURA_GRAPHQL_ADMIN_SECRET: hasura
      CHECK_INTERVAL_SECONDS: 10
      RELOAD_INTERVAL_SECONDS: 1
  graphql-engine: ...
```
