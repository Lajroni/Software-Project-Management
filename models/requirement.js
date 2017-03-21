var mongoose = require('mongoose');
var User = require('./user')
var UserStory = require('./userstory')
var Project = require('./project')
var RequirementSchema = new mongoose.Schema({
	Project:{type:mongoose.Schema.ObjectId, ref: 'Project', required: false, unique: false},
    IDTag: {type: String, unique: false,required: true,trim: true},
    DescriptionTag: {type: String,required: true,},
    AuthorTag: {type: String,required: false,trim: true},
	AssignedTo: {type: mongoose.Schema.ObjectId, ref: 'User',unique: false,required: true,},
	UserStories:[{type:mongoose.Schema.ObjectId, ref: 'UserStory', required: false, unique: false}],
});

RequirementSchema.statics.getRequirementsJSON = function(userID, projectID, callback){
	Requirement.find({Project: projectID }).exec( function (error, requirement){
		if (error) {
          return callback(error);
        } else if ( !requirement ) {
          var err = new Error('Requirements not found.');
          err.status = 401;
          return callback(err);
        }
		return callback(null, requirement)
	})
}

var Requirement = mongoose.model('Requirement', RequirementSchema);
module.exports = Requirement