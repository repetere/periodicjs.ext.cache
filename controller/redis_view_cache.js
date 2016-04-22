'use strict';
//https://github.com/eiriklv/redis-cache-client/blob/master/lib/purge.js
const path = require('path');
const async = require('async');
const ViewCache = require(path.resolve(__dirname, '../../../node_modules/periodicjs.core.cache/lib/viewcache.js'));
const merge = require('utils-merge');
const fs = require('fs-extra');
var RedisViewCache = class RedisViewCache extends ViewCache{
	constructor(options){
		super();
		let defaultOptions = {
			expires: 120000 //60000 //one min //300000 - 5 mins
		};
		this.client = options.client;
		this._size = 0;
		this._hits = 0;
		this._misses = 0;

		this.type='redis-view-periodic';
		this.prefix='redis-view-periodic';
		this.driver = 'redis';
		this.options = merge(defaultOptions,options);
		this.expires = this.options.expires;


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
			var display_msg = 'check redisVIEW cache length this._size' || options.msg;
			this.client.keys(this.prefix + '*', (err, keys) => {
				this._size = (keys.length) ? keys.length : 0;
				console.log(display_msg,this._size);
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
		console.log('get options.key',options.key);
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
			    asyncCallback(null, result);
			  }
			});

			this.length({msg:'get redisVIEW redisviewcache.length check'});
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
		console.log('set options.key',options.key);
		// console.log('set options.expires',options.expires);
		// console.log('set this.expires',this.expires);
		try{
			let ttl_in_milliseconds = options.expires || this.expires;
			console.log('ttl_in_milliseconds',ttl_in_milliseconds);
			let key = options.key; 
			let data = options.val;
			let client = this.client;
			let ttl = parseInt(ttl_in_milliseconds / 1000);

      if (!key) return asyncCallback('no key supplied for cache set');
      if (!data) return asyncCallback('no data rupplied for cache set');

      client.setex(key, ttl, data, (err, reply) => {
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
					this.length({msg:'set redisVIEW redisviewcache.length'});

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
			if(options.key){
				this.client.del(options.key, (err, count) => {
				  var count = count || 0;
				  this._size = this._size - count;

				  asyncCallback(err, options.key+': purged ' + count );
					this.length({msg:'del redisVIEW redisviewcache.size'});
				});
			}
			else if(options.model_name && options.model_name_plural && (options.docid || options.docname)){
				let totalDeleteCount=0;
				console.log([
					`${this.prefix}:*${options.model_name}*${options.docname}*`,
					`${this.prefix}:*${options.model_name}*${options.docid}*`,
					`${this.prefix}:*${options.model_name_plural}*`
				]);
				async.each([
					`${this.prefix}:*${options.model_name}*${options.docname}`,
					`${this.prefix}:*${options.model_name}*${options.docid}`,
					`${this.prefix}:*${options.model_name_plural}*`
				],
				(key,eachCB) =>{


					this.client.keys(key, (err, deletekeys) => {
						console.log('checking key',key,'looking for keys',deletekeys,'deletekeys length',deletekeys.length);
					  if (deletekeys && deletekeys.length < 1) {
					  	eachCB(null);
					  }
					  else{
							this.client.del(deletekeys, (err, count) => {
							  var count = count || 0;
							  this._size = this._size - count;
							  totalDeleteCount += count;

							  eachCB(err);
								this.length({msg:'del '+key+' in iterator redisVIEW redisviewcache.size'});
							});
					  }
					});


				},
				function(err){
					asyncCallback(err, 'purged ' + totalDeleteCount);
				});
			}
			else{
				asyncCallback(new Error('missing delete key'));
			}
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
		// 	console.log('size redisviewcache.size',this._size);
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
			  	asyncCallback(null, 'no redisVIEW data to purge for prefix: ' + prefix);
			  }
			  else{
				  this.client.del(keys, (err, count) => {
				    var count = count || 0;
					  this._size = this._size - count;
			      asyncCallback(err, 'purged ' + count + ' entries for prefix: ' + prefix);
						this.length({msg:'clearCache redisVIEW redisviewcache.size'});
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

module.exports = RedisViewCache;