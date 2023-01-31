'use strict';

const axios = require("axios");
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
  
}

const gqlEngine = process.env.GRAPHQL_ENGINE_URL;
const checkInterval = process.env.CHECK_INTERVAL_SECONDS;
const reloadInterval = process.env.RELOAD_INTERVAL_SECONDS;
const adminSecret = process.env.HASURA_GRAPHQL_ADMIN_SECRET;

var inconsistentSchemas = []

// Check if the graphql engine var is set
if (! gqlEngine) {
  throw new Error('expected a non null environment variable GRAPHQL_ENGINE_URL');
}
const gqlEngineURL = new URL(gqlEngine);
console.log(`GQL engine running on ${gqlEngineURL.href}`);

const headers = {
  'x-hasura-admin-secret': adminSecret
}

// Async function to check the remote schemas
async function runCheck() {
  gqlEngineURL.pathname = 'v1/metadata'
  axios.post(gqlEngineURL.href, {
    "type": "get_inconsistent_metadata",
    "args": {}
  }, {headers: headers})
  .then(function (response) {
    let isConsistent = response.data["is_consistent"];
    if (!isConsistent) {
      inconsistentSchemas = getAllInconsistentRemoteSchemas(response.data['inconsistent_objects']);
    }
    else {
      inconsistentSchemas = [];
    }
  })
  .catch(function (error) {
    console.log(error);
  })
} 

function runCheckEveryNSeconds(n) {
  setInterval(runCheck, n * 1000);
}
// Run check when starting up
runCheck()
// Run check every N seconds
runCheckEveryNSeconds(checkInterval);

// Async function to reload the inconsistent remote schemas
async function runReload() {
  if (inconsistentSchemas.length == 0) {
    console.log("All remote schemas are consistent.")
  }
  else {
    console.log("Inconsistent schemas: " + inconsistentSchemas);
    gqlEngineURL.pathname = 'v1/metadata'
    axios.post(gqlEngineURL.href, {
      "type" : "reload_metadata",
      "args": {
        "reload_remote_schemas": inconsistentSchemas
      }
    }, {headers: headers})
    .then(function (response) {
      let isConsistent = response.data["is_consistent"];
      if (!isConsistent) {
        inconsistentSchemas = getAllInconsistentRemoteSchemas(response.data['inconsistent_objects']);
      }
      else {
        inconsistentSchemas = [];
      }
    })
    .catch(function (error) {
      console.log(error);
    })
  }
} 

function runReloadEveryNSeconds(n) {
  setInterval(runReload, n * 1000);
}

// Run reload every N seconds
runReloadEveryNSeconds(reloadInterval);

// ----------------------- Utils -----------------------

function getAllInconsistentRemoteSchemas(jsonData) {
  var inconsistentRemoteSchemas = []
  for (let obj of jsonData) {
    if (obj["name"].startsWith("remote_schema")) {
      const remoteSchemaName = obj["name"].split(/ (.*)/s)[1];
      inconsistentRemoteSchemas.push(remoteSchemaName);
    }
  }
  return inconsistentRemoteSchemas
}
