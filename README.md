# gith

Version: 1.0.4

gith[ooks] - a simple node server that responds to github post-receive events with meaningful data

## Getting Started

### Install

Install the module with: `npm install gith`

### Require

In your node application, require gith and create a gith server. You can specify a port now, or
you can use the `.listen( portNumber )` method later.

```javascript
// create a gith server on port 9001
var gith = require('gith').create( 9001 );
```

### Use

Pass an object of how you want to filter gith (if at all) and subscribe to an event.

```javascript
gith({
  repo: 'danheberden/gith'
}).on( 'all', function( payload ) {
  console.log( 'Post-receive happened!' );
});
```

### Hook

Be sure github.com is sending payload data to your server. From your repository root
go to `Admin > Service Hooks > WebHook URLs` and add your server url, e.g., `http://mycoolserver.com:9001`.

## Filtering

The object passed into `gith()` can utilize four parameters (`repo`, `branch`, `file` and `tag`).
All of these can either be an exact match string, a regular expression or a function.

For example:

```javascript
gith({
  repo: 'danheberden/gith',
  branch: /issue_(\d+)/
}).on( 'branch:add', function( payload ) {
  console.log( 'A branch matching /issue_(\d+)/ was added!' );
  console.log( 'The issue # is', payload.matches.branch[1] );
});
```

You can either omit the key that you don't want to filter (e.g., we would get every file and tag in the above
example) or use `*` to specifiy that it's a wildcard.

## Events

Events available are:

* `all` - as long as the filtering passed, this will get fired
* `branch:add`
* `branch:delete`
* `file:add`
* `file:modify`
* `file:delete`
* `file:all`
* `tag:add`
* `tag:delete`

## Payload

The github payload is very detailed, but can be a bit excessive.

This is the payload that gith gives you:

```javascript
{
  original: the-original-github-payload,
  files: {
    all: [],
    added: [],
    deleted: [],
    modified: []
  },
  tag: tag, /* if a tagging operation */
  branch: branch, /* if working on a branch */
  repo: the-repo-name,
  sha: the-now-current-sha,
  time: when-it-was-pushed,
  urls: {
    head: current-sha
    branch: branch-url-if-available,
    tag: sha-url-of-tag-if-available,
    repo: repo-url,
    compare: compare-url
  },
  reset: did-the-head-get-reset,
  pusher: github-username-of-pusher,
  owner: github-username-of-repo-owner
}
```

Note that this payload will only be fully available in case of standard `push` hooks (see below for more information).

## `gith()`

The gith function returns a new Gith object that has all of the [EventEmitter2](https://github.com/hij1nx/EventEmitter2)
methods.


## Additional `gith` Methods

On the gith server, there are three additional methods available:

#### `gith.close()`

This closes the gith server

#### `gith.listen( port )`

If you didn't pass in a port to `.create()` when you required gith, this
will start the server on the specified port

#### `gith.payload( github-style-payload )`

You can broadcast a payload to the gith server manually.


## Using `gith` for other types of hooks

When you use Github UI to declare a web hook, it's only attached to the `push` event.

Whenever you want to attach you hook to other events, you will have to use [the API](http://developer.github.com/v3/repos/hooks/). In this case, `gith` may not be able to fully interpret the original payload, and you **should consider the *simplified payload* as unreliable**. In those cases, just use `payload.original`.


## License

Copyright (c) 2012 Dan Heberden
Licensed under the MIT license.
