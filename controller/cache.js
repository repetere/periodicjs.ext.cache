'use strict';

var Utilities = require('periodicjs.core.utilities'),
	fs = require('fs-extra'),
	path = require('path'),
	CoreUtilities,
	// CoreController,
	appSettings,
	appenvironment,
	cacheconfig,
	cacheconfigfile = path.resolve(process.cwd(), 'content/config/extensions/periodicjs.ext.cache/settings.json'),
	mongoose,
	logger;

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
	CoreUtilities = new Utilities(resources);
	appenvironment = appSettings.application.environment;
	try{
		fs.readJson(cacheconfigfile,function(err,cacheconfigjson){
			if(err){
				logger.error(err);
			}
			else if(cacheconfigjson && global.CoreCache){
				cacheconfig = cacheconfigjson[appenvironment];
				global.CoreCache.setOptions(cacheconfig);
			}
		});
	}
	catch(e){
		logger.error(e);
	}

	// return {
	// 	index: index,
	// 	replicate_periodic: replicate_periodic,
	// 	run_cache: run_cache,
	// };
};

module.exports = controller;
