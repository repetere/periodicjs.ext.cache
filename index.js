'use strict';
var path = require('path');
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
	// express,app,logger,config,db,mongoose
	var cacheRouter = periodic.express.Router(),
		cacheController = require('./controller/cache')(periodic);

	// for (var x in periodic.settings.extconf.extensions) {
	// 	if (periodic.settings.extconf.extensions[x].name === 'periodicjs.ext.admin') {
	// 		cacheRouter.post('/replicatenow', cacheController.run_cache);
	// 		cacheRouter.get('/', cacheController.index);
	// 	}
	// }

	// periodic.app.use('/p-admin/cache', cacheRouter);
};
