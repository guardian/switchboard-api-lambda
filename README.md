Lambda to handle switchboard API requests

## Lambdas

This repository contains multiple lambdas, altogether they handle switchboard API requests. They are bundled in the same RiffRaff artifact.


### switches

Located in `src/switches.js` returns the list of switches.

Being an authenticated request if requires the following body mapping

```json
{
    "context" : {
        "authorizer-principal-id" : "$context.authorizer.principalId"
    }
}
```


### status

Located in `src/status.js` returns the status of all switches.

Being an authenticated request if requires the following body mapping

```json
{
    "context" : {
        "authorizer-principal-id" : "$context.authorizer.principalId"
    }
}
```


### toggle

Located in `src/toggle.js` sets the status of a switch to either `on` or `off`.

It's an authenticated request that requires two path parameters `{switch}` and `{status}`. `{status}` can be only `on` or `off`. The body mapping is

```
##  See http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-mapping-template-reference.html
{
    "params" : {
        "path": {
            #set($params = $input.params().get('path'))
            "switch": "$util.escapeJavaScript($params.get('switch'))",
            "status": "$util.escapeJavaScript($params.get('status'))"
        }
    },
    "context" : {
        "authorizer-principal-id" : "$context.authorizer.principalId",
        "http-method" : "$context.httpMethod"
    }
}
```


### Unit tests

* `npm test` to run your tests once.
* `nodemon --exec 'npm test' --ignore tmp` to watch your files and run tests on save.



## Static files

`static` contains the static UI that talks to switchboard lambda.

### Setup

These steps can be done once

 * Set up nginx mappings using [dev-nginx](https://github.com/guardian/dev-nginx).
 * `npm install -g http-server`

### Run

Run `http-server static -p 3000` from the root of this project and go to switchboard.local.dev-gutools.co.uk
