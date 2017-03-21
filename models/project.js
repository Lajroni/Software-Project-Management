var mongoose = require('mongoose');
var User = require('./user')
var Requirements = require('./requirement')
var UserStory = require('./userstory')
var Sprint = require('./sprint')

var ProjectSchema = new mongoose.Schema({
    ProjectID: {type: String,unique: true,required: true,trim: true},
	Title: {type: String,required: true, unique: false},
    DescriptionTag: {type: String,required: true,},
    ProductOwner: {type: String,required: false,},
	ProductManager:{type: String,required: false,},
	Employees: [{type: mongoose.Schema.ObjectId, ref: 'User', required: false}],
	Requirements: [{type: mongoose.Schema.ObjectId, ref: 'Requirement', required: false}],
	UserStories: [{type: mongoose.Schema.ObjectId, ref: 'UserStory', required: false, unique: false}],
	Sprints: [{type: mongoose.Schema.ObjectId, ref: 'Sprint', required: false, unique: false}],
	OwnedBy: {type: mongoose.Schema.ObjectId, ref: 'User', required: false}
	});

ProjectSchema.statics.getProjectsJSON = function(userID, callback){
	Project.find({OwnedBy: userID}).exec( function (error, project){
		if (error) {
          return callback(error);
        } else if ( !project ) {
          var err = new Error('Requirements not found.');
          err.status = 401;
          return callback(err);
        }
		return callback(null, project)
	})
}

ProjectSchema.statics.getTitle = function(_id, callback){
	Project.findOne({_id: _id}).exec( function (error, project){
		if (error) {
          return callback(error);
        } else if ( !project ) {
          var err = new Error('Requirements not found.');
          err.status = 401;
          return callback(err);
        }
		return callback(null, project.Title)
	})
}

var Project = mongoose.model('Project', ProjectSchema);
module.exports = Project;