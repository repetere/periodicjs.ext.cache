'use strict';

var replicationController,
	mongoose,
	logger,
	appSettings;

/**
 * cli replication controller
 * @module clireplicationController
 * @{@link https://github.com/typesettin/periodicjs.ext.replication}
 * @author Yaw Joseph Etse
 * @copyright Copyright (c) 2014 Typesettin. All rights reserved.
 * @license MIT
 * @param  {object} resources variable injection from current periodic instance with references to the active logger and mongo session
 * @return {object}           replication cli
 */
var extscript = function (resources) {
	logger = resources.logger;
	mongoose = resources.mongoose;
	appSettings = resources.settings;
	replicationController = require('./controller/replication')(resources);
	// node index.js --cli --extension replication --task replicate --repenv production
	var cli = function (argv) {
		if (argv.task === 'replicate') {
			console.time('replication task');
			replicationController.replicate_periodic({
					environment: argv.repenv
				},
				function (err, result) {
					console.timeEnd('replication task');
					if (err) {
						logger.error(err.stack.toString());
						logger.error(err.toString());
					}
					else {
						logger.info('replication result', result);
					}
					process.exit(0);
				});
		}
		else {
			logger.silly('invalid replication task', argv);
			process.exit(0);
		}
	};

	return {
		cli: cli
	};
};

module.exports = extscript;
