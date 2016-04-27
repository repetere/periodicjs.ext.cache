'use strict';
//https://github.com/eiriklv/mongo-cache-client/blob/master/lib/purge.js
const path = require('path');
const async = require('async');
const ViewCache = require(path.resolve(__dirname, '../../../node_modules/periodicjs.core.cache/lib/viewcache.js'));
const merge = require('utils-merge');
var MongoViewCache = class MongoViewCache extends ViewCache{
	constructor(options){
		super();
		let defaultOptions = {
			expires: 120000 //60000 //one min //300000 - 5 mins
		};
		this.client = options.client;
		this._size = 0;
		this._hits = 0;
		this._misses = 0;

		this.type='mongo-view-periodic';
		this.prefix='mongo-view-periodic';
		this.driver = 'mongo';
		this.options = merge(defaultOptions,options);
		this.expires = this.options.expires;


		// this.expires = options.expires ;
		// this.client.monitor(function (err, res) {
	 //    console.log("Entering monitoring mode.",'err', err, 'res',res);
		// });
		// this.client.on("monitor", function (time, args, raw_reply) {
	 //    console.log('>>>mongo monitor: '+time , args); // 1458910076.446514:['set', 'foo', 'bar']
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
			var display_msg = 'check mongoVIEW cache length this._size' || options.msg;
			this.client.count({key:new RegExp(`^${ this.prefix.replace(/([^\w\d\s])/g, '\\$1') }`, 'i')}, (err, keys) => {
				// console.log('length keys',keys);
				this._size = (keys) ? keys : 0;
				// console.log(display_msg,this._size);
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
		// console.log('get options.key',options.key);
		try{
      var output;
			this.client.findOne({key:options.key}, (err, result) => {
			  if (err) {
			  	// console.log('error in getting mongo data');
			    asyncCallback(err.toString());
			  } 
			  else if (!result) {
        	++this._misses;
			    asyncCallback(null, null);
			  } 
			  else {
    			++this._hits;
    			// console.log('cache doc',result);
			    asyncCallback(null, result.val);
			  }
			});

			// this.length({msg:'get mongoVIEW mongoviewcache.length check'});
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
		// console.log('set options.expires',options.expires);
		// console.log('set this.expires',this.expires);
		try{
			let ttl_in_milliseconds = options.expires || this.expires;
			// console.log('ttl_in_milliseconds',ttl_in_milliseconds);
			let key = options.key; 
			let data = options.val;
			let client = this.client;
			let ttl = parseInt(ttl_in_milliseconds / 1000);

      if (!key) return asyncCallback('no key supplied for cache set');
      if (!data) return asyncCallback('no data rupplied for cache set');

      client.create({key:key,val:data}, (err, reply) => {
        if (err) {
			  	// console.log('error in setting mongo data');
			    asyncCallback(err.toString());
        } 
        else if (!reply) {
          asyncCallback('mongo: no reply on setex');
        } 
        else {
    	    asyncCallback(null, 'mongo reply on setex: ' + Object.keys(reply));
          ++this._size;
					// this.length({msg:'set mongoVIEW mongoviewcache.length'});

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
				this.client.remove({key:options.key}, (err, count) => {
				  var count = count || 0;
				  this._size = this._size - count;

				  asyncCallback(err, options.key+': purged ' + count );
					// this.length({msg:'del mongoVIEW mongoviewcache.size'});
				});
			}
			else if(options.model_name && options.model_name_plural && (options.docid || options.docname)){
				// console.log('del options',options);
				let totalDeleteCount=0;
				this.client.remove({
					$or : [
					{ key: new RegExp(`${ this.prefix }:(-?[\\w\\d]+)*-?${ options.model_name }-${ options.docid }(-[\\w\\d]+)*`) },
					{ key: new RegExp(`${ this.prefix }:(-[\\w\\d]+)*-?${ options.model_name }-${ options.docname }(-[\\w\\d]+)*`) },
					{ key: new RegExp(`${ this.prefix }:(-[\\w\\d]+)*-?${ options.model_name_plural }(-[\\w\\d]+)*`) }
					]
				}, (err, count) => {
					// console.log('del count',count);
				  var count = count.result.n || 0;
				  this._size = this._size - count;
				  totalDeleteCount = count;
					// console.log('checking key totalDeleteCount',totalDeleteCount);
					asyncCallback(err, 'purged ' + totalDeleteCount);
					// this.length({msg:'del mongoVIEW mongoviewcache.size'});
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
		// 	console.log('size mongoviewcache.size',this._size);
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
			// console.log('mongo view prefix',prefix);
			this.client.remove({key:new RegExp(`^${ this.prefix.replace(/([^\w\d\s])/g, '\\$1') }`, 'i')},(err, keys) => {
				if(err) {
					return asyncCallback(err);
				}
				// console.log('mongo clear view cache keys',keys.result);
				// console.log('mongo clear view cache keys number',keys.result.n);
			  if (keys.result && keys.result.n < 1) {
			  	asyncCallback(null, 'no mongoVIEW data to purge for prefix: ' + prefix);
			  }
			  else{

			    var count = keys.result.n || 0;

			   	this._size = this._size - count;
		      asyncCallback(err, 'purged ' + count + ' entries for prefix: ' + prefix);
					// this.length({msg:'clearCache mongoVIEW mongoviewcache.size'});
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

module.exports = MongoViewCache;