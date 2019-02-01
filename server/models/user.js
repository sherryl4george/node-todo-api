var mongoose = require('mongoose');

var User = mongoose.model('Users', {
    email: {
        type: String,
        required: true,
        trim: true
    }
});

module.exports = {User};