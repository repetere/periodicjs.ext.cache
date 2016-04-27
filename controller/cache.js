'use strict';
const redis_url = require('redis-url');
const redis = require('redis');
const async = require('async');
const ms = require('ms');
const extend = require('utils-merge');
const merge = require('utils-merge');
const fs = require('fs-extra');
const path = require('path');
const pcacheSchema = require('../model/pcache');
const RedisDataCache = require('./redis_data_cache');
const RedisViewCache = require('./redis_view_cache');
const MongoDataCache = require('./mongo_data_cache');
const MongoViewCache = require('./mongo_view_cache');

var CoreUtilities,
	CoreController,
	appSettings,
	appenvironment,
	cacheconfig,
	cacheconfigfile = path.resolve(__dirname, '../../../content/config/extensions/periodicjs.ext.cache/settings.json'),
	mongoose,
	redis_config,
	redis_config_obj,
	redisClient,
	logger,
	pcacheModel;

var init_global_cache = function(){
	global.CoreCache.setOptions(cacheconfig);
	if((cacheconfig.dataCacheType ==='mongo-data-periodic' || cacheconfig.viewCacheType ==='mongo-view-periodic') && cacheconfig.status==='active'){
	
		pcacheModel = mongoose.model('Pcache', pcacheSchema(ms(cacheconfig.viewCacheTTL)));
		if(cacheconfig.dataCacheType ==='mongo-data-periodic'){
			global.CoreCache.DataCache = new MongoDataCache({client:pcacheModel});
		}
		if(cacheconfig.viewCacheType ==='mongo-view-periodic'){
			global.CoreCache.ViewCache = new MongoViewCache({client:pcacheModel});
		}

		global.CoreCache.setStatus('active');
	}
	else if((cacheconfig.dataCacheType ==='redis-data-periodic' || cacheconfig.viewCacheType ==='redis-view-periodic') && cacheconfig.status==='active'){
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
			logger.info('redisClient cache ready');
		});
		redisClient.on('connect',function(connectionStatus){
			logger.info('redisClient cache connect',connectionStatus);
			if(cacheconfig.dataCacheType ==='redis-data-periodic'){
				global.CoreCache.DataCache = new RedisDataCache({client:redisClient});
			}
			if(cacheconfig.viewCacheType ==='redis-view-periodic'){
				global.CoreCache.ViewCache = new RedisViewCache({client:redisClient});
			}

			global.CoreCache.setStatus('active');
		});
		redisClient.on('error',function(error){
			logger.error('redisClient cache error',error);
			global.CoreCache.setStatus(false);
		});
		redisClient.on('end',function(){
			logger.info('redisClient connection ended');
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

var clear_cache = function(req,res){
	let clearCacheFunction = (req.params.type ==='data')? global.CoreCache.DataCache.clearCache: global.CoreCache.ViewCache.clearCache;

	clearCacheFunction({},(err,status)=>{
    if (err) { 
    	CoreController.handleDocumentQueryErrorResponse({
				err: err,
				res: res,
				req: req
			});
    }
    else{
    	CoreController.respondInKind({
				res: res,
				req: req,
				responseData: {clear_status:status}
    	});
    }
	});

};

var index = function(req,res){
	async.parallel({
		data_cache_size:(asyncCB) => global.CoreCache.DataCache.size({},asyncCB),
		data_cache_length:(asyncCB) => global.CoreCache.DataCache.length({},asyncCB),
		view_cache_size:(asyncCB) => global.CoreCache.ViewCache.size({},asyncCB),
		view_cache_length:(asyncCB) => global.CoreCache.ViewCache.length({},asyncCB),
	},
	(err,result)=>{
    if (err) { 
    	CoreController.handleDocumentQueryErrorResponse({
				err: err,
				res: res,
				req: req
			});
    }
    else{
			var viewtemplate = {
				viewname: 'p-admin/cache/index',
				themefileext: appSettings.templatefileextension,
				extname: 'periodicjs.ext.cache'
			},
			viewdata = {
				pagedata: {
					title: 'Cache Settings',
					toplink: '&raquo; Cache Settings',
					extensions: CoreUtilities.getAdminMenu()
				},
				user: req.user,
				cache_config: global.CoreCache.options,
				cache_size:result
			};
			CoreController.renderView(req, res, viewtemplate, viewdata);
    }
	});
};

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
  CoreController = resources.core.controller;
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
		cacheconfig,
		clear_cache,
		index
	};
};

module.exports = controller;
