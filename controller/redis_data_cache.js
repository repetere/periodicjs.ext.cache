'use strict';
//https://github.com/eiriklv/redis-cache-client/blob/master/lib/purge.js
const path = require('path');
const DataCache = require(path.resolve(__dirname, '../../../node_modules/periodicjs.core.cache/lib/datacache.js'));
const merge = require('utils-merge');
var RedisDataCache = class RedisDataCache extends DataCache{
	constructor(options){
		super();
		let defaultOptions = {
			expires: 60000 //one min //300000 - 5 mins
		};
		this.client = options.client;
		this._size = 0;
		this._hits = 0;
		this._misses = 0;

		this.type='redis-data-periodic';
		this.prefix='redis-data-periodic';
		this.driver = 'redis';
		this.options = merge(defaultOptions,options);
		// this.expires = options.expires ;
		// this.client.monitor(function (err, res) {
	 //    console.log("Entering monitoring mode.",'err', err, 'res',res);
		// });
		// this.client.on("monitor", function (time, args, raw_reply) {
	 //    console.log('>>>redis monitor: '+time , args); // 1458910076.446514:['set', 'foo', 'bar']
		// });
	};

	/**
	 * Returns the current number of entries in the cache
	 * @param  {object} options {key: of cached value}
	 * @param {Function} asyncCallback asyncCallback(err,status)
	 * @return {Function}  asyncCallback
	 */
	length(options,asyncCallback){
		asyncCallback = asyncCallback || function(){};
		try{
			// var self = this;
			this.client.keys(this.prefix + '*', (err, keys) => {
				this._size = (keys.length) ? keys.length : 0;
				console.log('check redis cache length this._size',this._size);
				asyncCallback(null,this._size);
			});

		}
		catch(e){
			asyncCallback(e);
		}
	};

	/**
	 * set the expiretime on a cached view
	 * @param {number} milliseconds [description]
	 */
	setExpires(milliseconds){
		this.expires = milliseconds;
	};

	/**
	 * gets the value of a key from the cache
	 * @param  {object} options {key: of cached value}
	 * @param {Function} asyncCallback asyncCallback(err,viewdata) 
	 * @return {Function} asyncCallback
	 */
	get(options,asyncCallback){
		try{
      var output;
			this.client.get(options.key/*prefix + key*/, (err, result) => {
			  if (err) {
			  	console.log('error in getting redis data');
			    asyncCallback(err.toString());
			  } 
			  else if (!result) {
        	++this._misses;
			    asyncCallback(null, null);
			  } 
			  else {
    			++this._hits;
			    try {
			      output = JSON.parse(result);
			    } 
			    catch (e) {
			      return asyncCallback('error on JSON.parse: ' + e);
			    }
			    asyncCallback(null, output);
			  }
			});

			console.log('get redisdatacache.length check');
			this.length();
		}
		catch(e){
			asyncCallback(e);
		}
	};

	/**
	 * set the value of a key into the cache store
	 * @param  {object} options {key: key name,val:key value,expiretime: number in milliseconds to expire (optional)}
	 * @param {Function} asyncCallback asyncCallback(err,status)
	 * @return {Function} asyncCallback
	 */
	set(options,asyncCallback){
		// this.length();
		// console.log('set options.key',options.key);
		try{
			let ttl_in_milliseconds = options.expires || this.expires;
			let key = options.key; 
			let data = options.val;
			let input;
			let client = this.client;
			let ttl = parseInt(ttl_in_milliseconds / 1000);

      if (!key) return asyncCallback('no key supplied for cache set');
      if (!data) return asyncCallback('no data rupplied for cache set');

      try {
        input = JSON.stringify(data);
      } 
      catch (e) {
        return asyncCallback('error on JSON.stringify: ' + e);
      }

      client.setex(key, ttl, input, (err, reply) => {
        if (err) {
			  	console.log('error in setting redis data');
			    asyncCallback(err.toString());
        } 
        else if (!reply) {
          asyncCallback('redis: no reply on setex');
        } 
        else {
    	    asyncCallback(null, 'redis reply on setex: ' + reply);
          ++this._size;
					console.log('set redisdatacache.length');
					this.length();

        }
      });
		}
		catch(e){
			asyncCallback(e);
		}
	};

	/**
	 * deletes key-val from cache store
	 * @param  {object} options {key: of cached value}
	 * @param {Function} asyncCallback asyncCallback(err,status)
	 * @return {Function}  asyncCallback
	 */
	del(options,asyncCallback){
		try{
			this.client.del(options.key, (err, count) => {
			  var count = count || 0;
			  this._size = this._size - count;

			  asyncCallback(err, 'purged ' + count );
				console.log('del redisdatacache.size');
				this.length();
			});
		}
		catch(e){
			asyncCallback(e);
		}
	};

	// get length(){
	// 	return this._size;
	// };

	/**
	 * Returns the number of entries taking up space in the cache
	 * @param  {object} options {key: of cached value}
	 * @param {Function} asyncCallback asyncCallback(err,status)
	 * @return {Function}  asyncCallback
	 */
	size(options,asyncCallback){
		this.length(options,asyncCallback);
		// try{
		// 	asyncCallback(null,this._size);
		// 	console.log('size redisdatacache.size',this._size);
		// }
		// catch(e){
		// 	asyncCallback(e);
		// }
		// return true;
	};

	// get size(){
	// 	return this._size;
	// };

	/**
	 * flush cache store
	 * @param  {object} options {key: of cached value}
	 * @param {Function} asyncCallback asyncCallback(err,status)
	 * @return {Function}  asyncCallback
	 */
	clearCache(options,asyncCallback){
		try{
			let prefix = this.prefix;
			this.client.keys(prefix + '*', (err, keys) => {
			  if (keys && keys.length < 1) {
			  	asyncCallback(null, 'no data to purge for prefix: ' + prefix);
			  }
			  else{
				  this.client.del(keys, (err, count) => {
				    var count = count || 0;
					  this._size = this._size - count;
			      asyncCallback(err, 'purged ' + count + ' entries for prefix: ' + prefix);
						console.log('clearCache redisdatacache.size');
						this.length();
				  });
			  }
			});
		}
		catch(e){
			asyncCallback(e);
		}
	};

	/**
	 * Returns the number of cache hits
	 * @param  {object} options {key: of cached value}
	 * @param {Function} asyncCallback asyncCallback(err,status)
	 * @return {Function}  asyncCallback
	 */
	hits(options,asyncCallback){
		try{
			asyncCallback(null,this._hits);
		}
		catch(e){
			asyncCallback(e);
		}
	};

	/**
	 * Returns the number of cache misses
	 * @param  {object} options {key: of cached value}
	 * @param {Function} asyncCallback asyncCallback(err,status)
	 * @return {Function}  asyncCallback
	 */
	misses(options,asyncCallback){
		try{
			asyncCallback(null,this._misses);
		}
		catch(e){
			asyncCallback(e);
		}
	};
};

module.exports = RedisDataCache;