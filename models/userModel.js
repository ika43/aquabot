var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
	sender: {
		type: String,
		trim: true
	},
	senderId: Number,
	waterDaily: {
		type: Number,
		default: 0
	}
});

module.exports = mongoose.model('user', userSchema);
