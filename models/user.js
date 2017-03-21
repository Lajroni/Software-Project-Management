var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var Project = require('./project')

var UserSchema = new mongoose.Schema({
    Email: {type: String,unique: true,required: true,trim: true},
    FullName: {type: String,required: true,},
	Title: {type: String,required: true,},
    password: {type: String,required: true},
	EmployeeID: {type: String,unique: true,required: true,trim: true},
	Projects: [{type: mongoose.Schema.ObjectId, ref: 'Project', required: false}]
});

// authenticate input against database documents
UserSchema.statics.authenticate = function(email, password, callback) {
  User.findOne({ Email: email })
      .exec(function (error, user) {
        if (error) {
          return callback(error);
        } else if ( !user ) {
          var err = new Error('User not found.');
          err.status = 401;
          return callback(err);
        }
        bcrypt.compare(password, user.password , function(error, result) {
          if (result === true) {
            return callback(null, user);
          } else {
            return callback();
          }
        })
      });
}

// hash password before saving to database
UserSchema.pre('save', function(next) {
  var user = this;
  bcrypt.hash(user.password, 10, function(err, hash) {
    if (err) {
      return next(err);
    }
    user.password = hash;
    next();
  })
});


var User = mongoose.model('User', UserSchema);
module.exports = User;