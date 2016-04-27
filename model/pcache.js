'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId,
	logger = console;

var pcacheSchema = function(ttl){
	return new Schema({
		id: ObjectId,
		key: {
			type: String,
			index: {
				unique: true,
				sparse: false
			}
		},
		val: Schema.Types.Mixed,
		createdat: {
			expires: ttl,
			type: Date,
			'default': Date.now
		}
	});
};

exports = module.exports = pcacheSchema;