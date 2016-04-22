'use strict';
const redis_url = require('redis-url');
const redis = require('redis');
const extend = require('utils-merge');
const fs = require('fs-extra');
const path = require('path');
const RedisDataCache = require('./redis_data_cache');
const RedisViewCache = require('./redis_view_cache');

var CoreUtilities,
	// CoreController,
	appSettings,
	appenvironment,
	cacheconfig,
	cacheconfigfile = path.resolve(__dirname, '../../../content/config/extensions/periodicjs.ext.cache/settings.json'),
	mongoose,
	redis_config,
	redis_config_obj,
	redisClient,
	logger;

var init_global_cache = function(){
	global.CoreCache.setOptions(cacheconfig);
	if((cacheconfig.dataCacheType ==='redis-data-periodic' || cacheconfig.viewCacheType ==='redis-view-periodic') && cacheconfig.status==='active'){
		// console.log('redis_config',redis_config);
		// console.log('redis_url.parse(redis_config.url)',redis_url.parse(redis_config.url));
		if((!redis_config.port || !redis_config.host) ){
			redis_config_obj = extend(redis_config,redis_url.parse(redis_config.url));
		}
		else{
			redis_config_obj = redis_config;
		}
		// console.log('redis_config_obj',redis_config_obj);
		if(redis_config_obj.pass || redis_config_obj.password){
			if(redis_config_obj.password){
				redis_config_obj.pass = redis_config_obj.password;
			}
		}
		redisClient = redis.createClient(redis_config_obj);
		redisClient.on('ready',function(){
			console.log('redisClient ready');
		});
		redisClient.on('connect',function(connectionStatus){
			console.log('redisClient connect',connectionStatus);
			if(cacheconfig.dataCacheType ==='redis-data-periodic'){
				global.CoreCache.DataCache = new RedisDataCache({client:redisClient});
			}
			if(cacheconfig.viewCacheType ==='redis-view-periodic'){
				global.CoreCache.ViewCache = new RedisViewCache({client:redisClient});
			}

			global.CoreCache.setStatus('active');
		});
		redisClient.on('error',function(error){
			console.log('redisClient error',error);
			global.CoreCache.setStatus(false);
		});
		redisClient.on('end',function(){
			console.log('redisClient connection ended');
			global.CoreCache.setStatus(false);
		});
	}
	else if( cacheconfig.status==='active'){
		global.CoreCache.setStatus('active');
	}

};

var cache_settings = function(){
	return cacheconfig;
}

/**
 * cache controller
 * @module cacheController
 * @{@link https://github.com/typesettin/periodicjs.ext.cache}
 * @author Yaw Joseph Etse
 * @copyright Copyright (c) 2014 Typesettin. All rights reserved.
 * @license MIT
 * @requires module:async
 * @requires module:periodicjs.core.utilities
 * @requires module:periodicjs.core.controller
 * @param  {object} resources variable injection from current periodic instance with references to the active logger and mongo session
 * @return {object}           cache
 */
var controller = function (resources) {
	logger = resources.logger;
	mongoose = resources.mongoose;
	appSettings = resources.settings;
	// CoreController = new ControllerHelper(resources);
	CoreUtilities = resources.core.utilities;
	appenvironment = appSettings.application.environment;
	redis_config = resources.settings.redis_config;

	try{
		fs.readJson(cacheconfigfile,function(err,cacheconfigjson){
			if(err){
				logger.error(err);
			}
			else if(cacheconfigjson && global.CoreCache){
				// console.log('cacheconfigjson',cacheconfigjson);
				cacheconfig = cacheconfigjson[appenvironment];
				init_global_cache();
			}
		});
	}
	catch(e){
		logger.error(e);
	}
	// console.log('cacheconfigfile',cacheconfigfile);
	// console.log('cacheconfig',cacheconfig);
	return {
		cacheconfig
	};
};

module.exports = controller;
