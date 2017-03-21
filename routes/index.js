var express = require('express');
var router = express.Router();
var User = require('../models/user');
var mid = require('../middleware');
var Requirement = require('../models/requirement');
var Project = require('../models/project');
var UserStory = require('../models/userstory')
var Sprint = require('../models/sprint')
var Employee = require('../models/employee')
var mongoose = require('mongoose');
var Type = require('type-of-is');


// GET /login
router.get('/login', mid.loggedOut, function (req, res, next) {
    return res.render('login', { navselect: -1, title: 'Log In' });
});

// POST /login
router.post('/login', function (req, res, next) {   
	Project.findOne().exec(function (error, Project) {
		if(Project){
			req.session.currentProject = Project._id
		}
	})
	Sprint.findOne().exec(function (error, Sprint) {
		if(Sprint){
			req.session.currentSprint = Sprint._id
		}
	})
    if (req.body.email && req.body.password) {
        User.authenticate(req.body.email, req.body.password, function (error, user) {
            if (error || !user) {
                var err = new Error('Wrong email or password.');
                err.status = 401;
                return next(err);
            } else {
                req.session.EmployeeID = user._id;
                return res.redirect('/project');
            }
        });
    } else {
        var err = new Error('Email and password are required.');
        err.status = 401;
        return next(err);
    }
});

// GET /register
router.get('/register', mid.loggedOut, function (req, res, next) {
    return res.render('register', { navselect: -1, title: 'Sign Up' });
});

// POST /register
router.post('/register', function (req, res, next) {
    if (req.body.email &&
        req.body.name &&
		req.body.Title &&
		req.body.EmployeeID && 
        req.body.password &&
        req.body.confirmPassword) {

        // confirm that user typed same password twice
        if (req.body.password !== req.body.confirmPassword) {
            var err = new Error('Passwords do not match.');
            err.status = 400;
            return next(err);
        }


        // create object with form input
        var userData = {
            Email: req.body.email,
            FullName: req.body.name,
            Title: req.body.Title,
			EmployeeID: req.body.EmployeeID,
            password: req.body.password
        };

        // use schema's `create` method to insert document into Mongo
        User.create(userData, function (error, user) {
            if (error) {
                return next(error);
            } else {
                req.session.EmployeeID = user._id;
                return res.redirect('/project');
            }
        });

    } else {
        var err = new Error('All fields required.');
        err.status = 400;
        return next(err);
    }
})

// GET /logout
router.get('/logout', function (req, res, next) {
    if (req.session) {
        // delete session object
        req.session.destroy(function (err) {
            if (err) {
                return next(err);
            } else {
                return res.redirect('/login');
            }
        });
    }
});


// GET /project
router.get('/project', mid.requiresLogin, function (req, res, next) {
    var project = req.query.project;
    if (project) {
        req.session.currentProject = project
		Sprint.findOne().exec(function (error, Sprint) {
			if(Sprint){
				req.session.currentSprint = Sprint._id
			}
		})
        return res.redirect('/overview');
    }
	Project.getProjectsJSON(req.session.EmployeeID, function(error, projectsJSON){
		if (error) 
			return next(error);
			return res.render('project', { title: 'Projects', navselect: -1, projects: projectsJSON });
	})
});

router.post('/addProject', mid.requiresLogin, function(req, res, next){
	var projectID = req.body.ProjectID;
	var PO = req.body.ProductOwner;
	var PM = req.body.ProductManager;
	var ProjectName = req.body.ProjectName;
	var Description = req.body.DescriptionTag;
	if(!Description || !projectID || !req.body.ProjectName){
		var err = new Error('Project ID, Description, and Project Name are required.');
        err.status = 400;
        return next(err);
	}
	
	// var Employees = req.body.Employees
	// console.log(Employees)
	// var employeeArr = Employees.split(";")
	// var EmployeeData = []
	// var i;
	// for(i = 0; i < employeeArr.length; i++){
		// var Items = employeeArr[i].split(",")
		// var EmployeeInstance = {
			// FirstName: Items[0],
			// LastName: Items[1],
			// Title: Items[2],
			// UserID: Items[3]
		// }
		// EmployeeData.push(EmployeeInstance)
		// console.log(EmployeeInstance)
	// }
	
	var ProjectData = {
		ProjectID: projectID,
		DescriptionTag: Description,
		ProductOwner: req.body.ProductOwner,
		ProductManager: req.body.ProductManager,
		Title: req.body.ProjectName,
		OwnedBy: null,		
	}
	var thisUser;
	User.findOne({_id: req.session.EmployeeID}).exec(function (error, user) {
        if (error) {
          return next(error);
        } else if ( !user ) {
          var err = new Error('Unexpected error. Not able to find your user instance');
          err.status = 401;
          return next(err);
        }
		ProjectData.OwnedBy = user._id
		Project.create(ProjectData, function(error, project){
			if (error) {
				return next(error);
			} else {
				req.session.currentProject = project._id
				req.session.currentSprint = ""
				return res.redirect('/project')
			}
			})
      });
})

//Get /overview
router.get('/overview', mid.requiresLogin, function (req, res, next) {
	Requirement.getRequirementsJSON(req.session.EmployeeID, req.session.currentProject, function(error, requirementsJSON){
		if (error) {
			return next(error);}
		UserStory.find({Project: req.session.currentProject}).exec( function (error, UserStories){
			if (error) {
			  return next(error);
			} else if ( !UserStories ) {
			  var err = new Error('User stories not found.');
			  err.status = 401;
			  return next(err);
			}
			Sprint.find({ProjectLink: req.session.currentProject}).exec( function (error, Sprints){
				if (error) {
				  return next(error);
				} else if ( !Sprints ) {
				  var err = new Error('Sprints not found.');
				  err.status = 401;
				  return next(err);
				}
				Project.findOne({_id: req.session.currentProject}).exec( function (error, project){
					if (error) {
					  return next(error);
					} else if ( !project ) {
					  var err = new Error('Project not found.');
					  err.status = 401;
					  return next(err);
					}
					User.find({Projects: { "$in" : [req.session.currentProject]}}).exec(function(error, ProjectEmployees){
						if (error) {
						  return next(error);
						}
						var totalBug = 0;
						for(var i = 0; i < UserStories.length; i++){
							if(UserStories[i].isBug)
								totalBug++;
						}
						var view = true
						if(req.query.view == "backlog" || req.session.viewtype == "backlog")
							var view = false
						res.render('overview', {requirements: requirementsJSON, navselect: 1, EmployeesStr: JSON.stringify(ProjectEmployees), Employees: ProjectEmployees ,  viewtype : req.query.view, view: view, userstories: UserStories, nuserstories: UserStories.length, nbugs: totalBug, nus: UserStories.length - totalBug, sprints: Sprints, projectTitle: project.Title })
					})						
				})			
			})	
		})
	})   
})

//Post /overview
router.post('/overview', mid.requiresLogin, function (req, res, next) {

	
})

//Get data in /overview
router.post('/getData', mid.requiresLogin, function (req, res, next) {
	UserStory.findOne({_id: req.body._id}).exec(function (error, UserStoryy){
		if (error) {
		  return next(error);
		} else if ( !UserStoryy ) {
		  var err = new Error('User story not found.');
		  err.status = 401;
		  return next(err);
		}
		UserStory.find({_id: {$in:UserStoryy.RelativeUS}}).exec(function (error, USRelative){ 
			if(err)
				return next(err)
			UserStory.find({_id: UserStoryy.ParentUS}).exec(function (error, USParent){
				if(err)
					return next(err)
				UserStory.find({_id: {$in:UserStoryy.ChildUS} }).exec(function (error, USChild){
					if(err)
						return next(err)
					Requirement.findOne({_id: UserStoryy.RequirementLink}).exec(function (error, Requirement){
						if(err)
							return next(err)
						Project.findOne({_id: UserStoryy.Project}).exec(function (error, Project){
							if(err)
								return next(err)		
							res.send({UserStory: JSON.stringify(UserStoryy), Requirement: JSON.stringify(Requirement), 
							USParent: USParent, USChild: USChild, USRelative: USRelative, Project: Project})
						
						}) 
					}) 
				})
			})	
		})
	}) 
})

// GET /softwareRequirements
router.get('/softwareRequirements', mid.requiresLogin, function (req, res, next) {
        var project = req.session.currentProject
		
		Requirement.getRequirementsJSON(req.session.EmployeeID, project, function(error, requirementsJSON){
			if (error) {
				return next(error);}
			else{
				Project.findOne({_id: req.session.currentProject}).exec(function (error, Project) {
					if(!Project){
						var err = new Error('Error. Could not find the project.');
						err.status = 404;
						return next(err);
					}
					else{
						return res.render("softwareRequirements", {"title": "Software Requirements", navselect: 2,"projectTitle": Project.Title,"requirements": requirementsJSON      });
					}
				})			
			}
		})       
});

// POST /softwareRequirements
router.post('/softwareRequirements', mid.requiresLogin, function (req, res, next) {
	var project = req.session.currentProject;
	if (!req.body.IDtag || !req.body.DescriptionTag) {
        var err = new Error('ID and Description tag are required.');
        err.status = 400;
        return next(err);
	}

	// create object with form input
	var requirementData = {
		Project: project,
		DescriptionTag: req.body.DescriptionTag,
		AuthorTag: req.body.AuthorTag,
		IDTag: req.body.IDtag,
		AssignedTo: req.session.EmployeeID
	};
	Requirement.findOne({Project: req.session.currentProject,IDTag: req.body.IDtag }).exec(function (error, Project) {
		if(Project){
			var err = new Error('Duplicate requirement ID on the same project. Not allowed.');
            err.status = 401;
            return next(err);
		}
	})
	Requirement.create(requirementData, function(error, requirement){
		if (error) {
		    return next(error);
		} else {
			return res.redirect('/softwareRequirements')
		}
	})
});

//GET Employees
router.get('/employees', mid.requiresLogin, function (req, res, next) {
	var project = req.session.currentProject		
	User.find().exec(function(error, employeeList){
			if (error) {
				return next(error);}
			else{
				User.find({Projects: { "$in" : [req.session.currentProject]}}).exec(function(error, ProjectEmployees){
					if (error) {
						return next(error);}
					else{
						Project.findOne({_id: req.session.currentProject}).exec( function (error, project){
							if (error) {
							  return next(error);
							} else if ( !project ) {
							  var err = new Error('Project not found.');
							  err.status = 401;
							  return next(err);
							}
							return res.render('employees', {AllEmployees: employeeList, navselect: -1, ProjectEmployees: ProjectEmployees, project: project.Title} )
						})
					}
				})
			}
	})
})

//POST Employees
router.post('/employees', mid.requiresLogin, function (req, res, next){
	if(!req.body.Employee){
		var err = new Error('You must select an employee.');
        err.status = 400;
        return next(err);
	}
	if(req.body.Employee){
		User.findOneAndUpdate(
			{_id: req.body.Employee},
			{$push: {Projects: req.session.currentProject}}, { new: true }, function(err, doc){
				if(err)
					next(err)
			}		
		)
	}
	User.findOne({_id: req.body.Employee}).exec(function(error, user){
		if(error){
			return next(error)
		}
		Project.findOneAndUpdate(
			{_id: req.session.currentProject},
				{$push: {Employees: req.body.Employee}}, { new: true }, function(err, doc){
					if(err)
						next(err)
			}
		)
	})
	return res.redirect('/employees')
})

// GET User STories
router.get('/userStories', mid.requiresLogin, function (req, res, next) {
	if (!req.session.currentSprint) {
		Sprint.findOne().exec(function (error, Sprint) {
			if(Sprint){
				req.session.currentSprint = Sprint._id
			}
			else{
				var err = new Error('You need to create Sprints first before creating user stories.');
				err.status = 400;
				return next(err);
			}
		})
	}

	if(req.query.USID){
        return res.render('userstoryopen', {_id: req.query.USID, navselect: -1})
    }
	else {
        UserStory.find({Project: req.session.currentProject}).exec(function (error, UserStories) {
            if (error) {
                return callback(error);
            } else if (!UserStories) {
                var err = new Error('User stories not found.');
                err.status = 401;
                return callback(err);
            }
            Project.findOne({_id: req.session.currentProject}).exec(function (error, Project) {
                if (!Project) {
                    var err = new Error('Error. Could not find the project.');
                    err.status = 404;
                    return next(err);
                }
                Sprint.find().exec(function (error, Sprints) {
                    res.render('userStories', {
                        title: 'User Stories',
                        navselect: 3,
                        Sprints: Sprints,
                        UserStories: UserStories,
                        projectTitle: Project.Title
                    });
                })
            })
        })
    }
})

// POST User Story
router.post('/userstories', mid.requiresLogin, function (req, res, next){
	var project = req.session.currentProject;
	if (!req.body.USID || !req.body.Title || !req.body.Description || !req.body.USorBug) {
        var err = new Error('US ID, Title, Description, and Bug/US radiobutton are required.');
        err.status = 400;
        return next(err);
	}
	
	var isBug = false;
	if(req.body.USorBug == 0)
		isBug = true;
	
	if(!req.session.currentSprint){
		Sprint.findOne().exec(function (error, Sprint) {
			if(Sprint){
				req.session.currentSprint = Sprint._id
			}
		})
	}

	var UserStoryData = {
		USID: req.body.USID,
		Title: req.body.Title,
		Description: req.body.Description,
		isBug: isBug,
		EstimatedHours: req.body.Estimated,
		Release: req.body.Release,
		StoryPoints: req.body.StoryPoints,
		Project: req.session.currentProject,
		SprintN: req.body.SprintN,
	}
	UserStory.create(UserStoryData, function(error, US){
		if (error){
			return next(error);
		}
		   res.redirect('./userStories')
	})
})

router.post('/updateUS', mid.requiresLogin, function (req, res, next){
	if(req.body.AssignedTo == "AssignedToDef")
		req.body.AssignedTo = null
	if(req.body.SprintN == "SprintNDef")
		req.body.SprintN = null
    UserStory.findOneAndUpdate({_id: req.body._id},
	    {$set: {StoryPoints: req.body.StoryPoints, ReproSteps: req.body.ReproSteps, TestCases: req.body.TestCases, Description: req.body.Description, COAs: req.body.COAs, Release: req.body.Release, HoursSpent: req.body.HoursSpent, EstimatedHours: req.body.EstimatedHours , AssignedTo: req.body.AssignedTo, State: req.body.State, SprintN: req.body.SprintN }}, { new: true }, function(err, doc){
			if(err){
				next(err);
				return;
			}
		// UserStory.findOneAndUpdate({_id: req.body._id}, 
		// {$set:  {ChildUS: req.body._id } }, { new: true }, function(err, doc2){
				// if(err){
					// next(err);
					// return;
				// }
				// 
				res.redirect('/overview')
		// })
	})
})

router.post('/addUSLink', mid.requiresLogin, function(req, res, next){
	if(req.body.UserStoryID.length < 1 || req.body._id.length < 1){
		res.send({success: 0})
	}
	else{
		UserStory.findOne({USID: req.body.UserStoryID}).exec(function(error, US){
			if(error){
				res.send(error)
			}
			if(!US){
				var err = new Error('Could not find US.');
				err.status = 400;
				res.send(err)
				return
			}
			if(req.body.isParent == "true"){
				UserStory.findByIdAndUpdate(req.body._id,
				{$set: {ParentUS: US._id.toString()}}, { new: true, safe: true, upsert: true}, function(err, doc){
					if(err){
						res.send(err)
					    return
					}
					res.send({US: US, type: "1"})
					return
				})
			}
			else if(req.body.isChild == "true"){
				UserStory.findByIdAndUpdate(req.body._id,
				{$push: {ChildUS: US._id.toString()}}, { new: true, safe: true, upsert: true}, function(err, doc){
					if(err){
						res.send(err)
					    return
					}
					res.send({US: US, type: "2"})
					return
				})
			}
			else{
				 UserStory.findByIdAndUpdate(req.body._id,
				 {$push: {RelativeUS: US._id.toString()}}, { new: true,safe: true, upsert: true}, function(err, doc){
					 if(err){
						 res.send(err)
						 return;
					 }
					 res.send({US: US, type: "3"})
					 return
				 })
			}
		})
	}
})
// GET Sprints
router.get('/sprints', mid.requiresLogin, function (req, res, next) {
	Sprint.find({ProjectLink: req.session.currentProject}).exec( function (error, Sprints){
		if (error) {
          return callback(error);
        } else if ( !Sprints ) {
          var err = new Error('Sprints not found.');
          err.status = 401;
          return callback(err);
        }
        console.log(req.session.currentProject)
		Project.findOne({_id: req.session.currentProject}).exec(function (error, Project) {
			if(!Project){
				var err = new Error('Error. Could not find the project.');
				err.status = 404;
				return next(err);
			}
			else{
				res.render('sprints', {title: 'Sprints', navselect: 4, Sprints: Sprints, projectTitle: Project.Title});
			}
		})
	})
})

// POST Sprints
router.post('/sprints', mid.requiresLogin, function (req, res, next){
	var project = req.session.currentProject;
	if (!req.body.SprintN) {
        var err = new Error('SprintN required');
        err.status = 400;
        return next(err);
	}
	
	Project.findOne({_id: req.session.currentProject}).exec(function (error, Project) {
		if(!Project){
			var err = new Error('Error. Could not find the project.');
			err.status = 404;
			return next(err);
		}
		var SprintData = {ProjectLink : Project,SprintN : req.body.SprintN}
		Sprint.create(SprintData, function(error, Sprint){
			if (error){
				return next(error);
			}
			req.session.currentSprint = Sprint._id
			res.redirect('./sprints')
	})
	})
})

router.post('/viewtypechanged' ,mid.requiresLogin, function(req, res, next){
	req.session.viewtype = req.body.viewtype
	next()
})
// GET /
router.get('/', function (req, res, next) {
	if(req.session && req.session.EmployeeID)
		return res.redirect('/overview')
	else
		return res.render('/login', { title: 'Home', navselect: -1});
});

router.get('/profile', function (req, res, next){
    if(req.query.user == "currentUser"){
        User.findOne({_id: req.session.EmployeeID}).exec(function (error, user) {
            if (error || !user) {
                res.redirect('/overview')
            }
            return res.render('profile',{
                Email: user.Email,
                navselect: -1,
                Title: user.Title,
                FullName: user.FullName,
                EmployeeID: user.EmployeeID,
                Projects: user.Projects
            })
        })
    }
    else {
        User.findOne({_id: req.query.user}).exec(function (error, user) {
            if (error)
                next(error)
            if (!user || user == null) {
                return res.redirect('/overview')
            }
            else {
                return res.render('profile', {
                    Email: user.Email,
                    navselect: -1,
                    Title: user.Title,
                    FullName: user.FullName,
                    EmployeeID: user.EmployeeID,
                    Projects: user.Projects
                })
            }
        })
    }
})
// GET /about
router.get('/about', function (req, res, next) {
    return res.render('about', { title: 'About' , navselect: -1});
});

// GET /contact
router.get('/contact', function (req, res, next) {
    return res.render('contact', { title: 'Contact', navselect: -1 });
});


module.exports = router;
