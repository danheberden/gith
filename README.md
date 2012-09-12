# gith

githOOKS - simple node server that responds to github post-receive events

## Getting Started
Install the module with: `npm install gith`

```javascript
// create a gith server on port 9001
var gith = require('gith').create( 9001 );

gith( filterMap ).on( actionString, hollabackFn );
```

## Documentation
_(Coming soon)_

## Examples

```javascript
// do something whenever a file is added on danheberden/gith:master
gith({
  repo: 'danheberden/gith',
  branch: 'master',
  file: '*'
}).on( 'add', function( event, payload ) {
  // do something with event data 
});

// do someting when a repository is added
gith({
  repo: '*'
}).on( 'add', function( event, payload ) {
  // do something with event data 
});

// do something when files are removed from any repo
gith({
  repo: 'danheberden/gith',
  file: '*'
}).on( 'remove', function( event, payload ) {
  // do something with event data
});

// do something when files have been modified on 
// danheberden/gith in branches starting with 'issue_'
gith({
  repo: 'danheberden/gith',
  branch: /^issue_/,
  file: '*'
}).on( 'modify', function( event, payload ) {
  // do something with event data
});

// do something when master gets tagged or a tag gets removed
gith({
  repo: 'danheberden/repo',
  branch: 'master',
  tag: '*'
}).on( '*', function( event, payload ) {
  // do something with event data
});

```

## License
Copyright (c) 2012 Dan Heberden
Licensed under the MIT license.
