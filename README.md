# periodicjs.ext.cache

periodic cache settings configuration and control.

 [API Documentation](https://github.com/typesettin/periodicjs.ext.cache/blob/master/doc/api.md)

## Installation

```
$ npm install periodicjs.ext.cache
```

## Usage


##Development
*Make sure you have grunt installed*
```
$ npm install -g grunt-cli
```

Then run grunt watch
```
$ grunt watch
```
For generating documentation
```
$ grunt doc
$ jsdoc2md controller/**/*.js index.js install.js uninstall.js > doc/api.md
```
##Notes
* Check out https://github.com/typesettin/periodicjs for the full Periodic Documentation
* example cache: clear && node index.js --cli --extension cache --task cache --filename mycache --outputpath ~/Downloads/myperiodiccache