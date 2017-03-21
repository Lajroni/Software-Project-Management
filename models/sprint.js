var mongoose = require('mongoose');
var Project = require('./project');
var UserStory = require('./userstory')

var SprintSchema = new mongoose.Schema({
	SprintN:     {type: String,unique:  true,required:  true,trim:  true},
	ProjectLink: {type: mongoose.Schema.ObjectId, ref: 'Project', require: false},
	UserStories: [{type: mongoose.Schema.ObjectId, ref: 'UserStory', required: false, unique: false}],
});

var Sprint = mongoose.model('Sprint', SprintSchema);
module.exports = Sprint;