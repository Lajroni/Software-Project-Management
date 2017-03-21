var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var app = express();
var hbs = require('hbs');
var fs = require('fs');

hbs.registerPartial('header', fs.readFileSync(__dirname + '/views/partials/header.hbs', 'utf8'));
hbs.registerPartials(__dirname + '/views/partials');
hbs.registerPartials(__dirname + '/views');

app.set('port', process.env.PORT || 3000);

// mongodb connection
mongoose.connect("mongodb://localhost:27017/bookworm");
var db = mongoose.connection;
// mongo error
db.on('error', console.error.bind(console, 'connection error:'));

// use sessions for tracking logins
app.use(session({
    secret: 'treehouse loves you',
    resave: true,
    saveUninitialized: false,
    store: new MongoStore({
        mongooseConnection: db
    })
}));

// make user ID available in templates
app.use(function (req, res, next) {
    res.locals.currentUser = req.session.EmployeeID;
	res.locals.name = "Lisian Ajroni"
    next();
});

// parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// serve static files from /public
app.use(express.static(__dirname + '/public'));

// view engine setup
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');
app.engine('html', require('hbs').__express);
hbs.registerHelper("extend", function(a,b){
    return;
})

// include routes
var routes = require('./routes/index');
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('File Not Found');
    err.status = 404;
    next(err);
});

// error handler
// define as the last app.use callback
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

// listen on port 3000
app.listen(3000, function () {
    console.log('Express app listening on port 3000');
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    if(res.locals.currentUser)
        res.render('/overview')
    else
        res.render('/login')
});


app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('login');
});


module.exports = app;