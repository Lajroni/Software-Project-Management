var mongoose = require('mongoose');
var Project = require('./project')

var EmployeeSchema = new mongoose.Schema({
    FirstName: {
      type: String,
      required: true,
    },
	LastName: {
      type: String,
      required: true,
    },
	Title: {
      type: String,
      required: true,
    },
	UserID:{
	  type: String,
	  unique: false,
      required: false,
	},
	EmployeeID:{
		type: String,
		required: true,
		unique: true
	},
	Projects:[{type: mongoose.Schema.ObjectId, ref: 'Project', require: false}]
}
);

EmployeeSchema.statics.getNameTitleFromUserID = function(userID, callback){
	Employee.findOne({UserID: userID}).exec( function (error, employee){
		if (error) {
          return callback(error);
        } else if ( !employee ) {
          var err = new Error('Employees not found.');
          err.status = 401;
          return callback(err);
        }
		var nameAndTitle = employee.FirstName + " " + employee.LastName + ", " + employee.Title + ". "
		return callback(null, nameAndTitle)
	})
}

EmployeeSchema.statics.getEmployees = function(callback){
	Employee.find({}).exec( function (error, employee){
		if (error) {
          return callback(error);
        } else if ( !employee ) {
          var err = new Error('Employees not found.');
          err.status = 401;
          return callback(err);
        }
		return callback(null, employee)
	})
}

var Employee = mongoose.model('Employee', EmployeeSchema);
	