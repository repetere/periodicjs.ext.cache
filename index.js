'use strict';

// var path = require('path');
/**
 * An extension to import json caches into periodic mongodb.
 * @{@link https://github.com/typesettin/periodicjs.ext.cache}
 * @author Yaw Joseph Etse
 * @copyright Copyright (c) 2014 Typesettin. All rights reserved.
 * @license MIT
 * @exports periodicjs.ext.cache
 * @param  {object} periodic variable injection of resources from current periodic instance
 */
module.exports = function (periodic) {
	// console.log('periodic.settings.redis_config',periodic.settings.redis_config);
	// console.log('global.CoreCache',global.CoreCache);
	// console.log('global.CoreCache.status',global.CoreCache.status);
	// global.CoreCache.DataCache = {
	// 	driver:'redis',
	// 	type:'database',
	// 	clearCache:function(options,cb){
	// 		cb(null,{});
	// 	}
	// }

	// express,app,logger,config,db,mongoose
	periodic.app.controller.extension.cache = {
		cache: require('./controller/cache')(periodic)
	};

	var cacheRouter = periodic.express.Router(),
		cacheController = periodic.app.controller.extension.cache.cache;

	// for (var x in periodic.settings.extconf.extensions) {
	// 	if (periodic.settings.extconf.extensions[x].name === 'periodicjs.ext.admin') {
	// 		cacheRouter.post('/replicatenow', cacheController.run_cache);
	// 		cacheRouter.get('/', cacheController.index);
	// 	}
	// }

	// periodic.app.use('/p-admin/cache', cacheRouter);
	return periodic;
};
