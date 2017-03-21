var mongoose = require('mongoose');
var Requirement = require('./requirement');
var User = require('./user');
var Sprint = require('./sprint');
var Project = require('./project')
var UserStorySchema = new mongoose.Schema({
	USID: 			{type: String,unique:  true,required:  true,trim:  true},
	Title: 			{type: String,unique:  true,required:  true,trim:  true},
	Description:    {type: String,unique: false,required:  true,trim: false},
	isBug:          {type: Boolean,unique: false,required:  true,trim: false},
	State:          {type: String,unique: false,required: false,trim: false},
	ParentUS:       this,
	ChildUS:        [this],
	RelativeUS:     [this],
	HoursSpent:     {type: Number,unique: false,required: false,trim: false},
	EstimatedHours: {type: Number,unique: false,required: false,trim: false},
	Release: 	    {type: String,unique: false,required: false,trim: false},
	Discussion:     {type: String,unique: false,required: false,trim: false},
	Attachments:    {type: String,unique: false,required: false,trim: false},
	StoryPoints:    {type: Number,unique: false,required: false,trim: false},
	COAs:           {type: String,unique: false,required: false,trim: false},
	TestCases:      {type: String,unique: false,required: false,trim: false},
	ReproSteps:     {type: String,unique: false,required: false,trim: false},
    RequirementLink:{type: mongoose.Schema.ObjectId, ref: 'Requirement', require: false},
	AssignedTo:     {type: mongoose.Schema.ObjectId, ref: 'User', require: false},
	SprintN:        {type: mongoose.Schema.ObjectId, ref: 'Sprint', required: false, unique: false},
	Project:        {type: mongoose.Schema.ObjectId, ref: 'Project', require: false}	
})

var UserStory = mongoose.model('UserStory', UserStorySchema);
module.exports = UserStory;