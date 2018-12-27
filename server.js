//Install and use required packages.
var express = require('express');
var mongoose = require('mongoose');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
const flash = require('express-flash');
const session = require('express-session');
var moment = require('moment');
const bcrypt = require('bcrypt');
mongoose.connect('mongodb://localhost/27017');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, './static')));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');
app.use(flash());
app.set('trust proxy', 1);
app.use(session({
    secret: 'itsasecret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}))
app.locals.moment = moment;

// Here we create our User Schema for MongoDb.
const UserSchema = new mongoose.Schema({
    FirstName: { type: String, required: [true, "First name is required."], minlength: 3, maxlength: 255 },
    LastName: { type: String, required: [true, "Last name is required."], minlength: 3, maxlength: 255 },
    Email: { type: String, required: true, match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'], maxlength: 255 },
    Password: { type: String, required: [true, "Password is required."], minlength: 8, maxlength: 255 },
    Birthday: { type: Date, required: [true, "Birthday is required."] }
}, { timestamps: true });
// Assign the UserSchema to a variable called 'User'.
const User = mongoose.model('User', UserSchema);

// Login / Registration page.
app.get('/', function (req, res) {
    res.render('index');
})

app.get('/success', function (req, res) {
    if (req.session.UserId == undefined) {
        res.redirect('/');
    }
    User.findOne(req.session.UserId, function (err, User) {
        res.render('success', { User: User });
    })
})

app.post('/register', function (req, res) {
    if (req.body.Password != req.body.Confirm) {
        req.flash('register', "Passwords did not match.");
        res.redirect('/');
    }
    User.find(req.body.Email, function (err, User) {
        if (User) {
            req.flash('register', "This email is already registered with an account.")
            res.redirect('/');
        }
    })
    bcrypt.hash(req.body.Password, 10)
        .then(hashed_password => {
            req.body.Password = hashed_password;
        })
        .catch(error => { });
    User.create(req.body, function (err, User) {
        if (err) {
            for (var key in err.errors) {
                req.flash('register', err.errors[key].message);
            }
            res.redirect('/');
        }
        req.session.UserId = User._id;
        res.redirect('/success');
    })
})

// app.post('/login', function (req, res) {
//     User.findOne(req.body, function (err, User) {
//         if (err) {
//             for (var key in err.errors) {
//                 req.flash('login', err.errors[key].message);
//             }
//             res.redirect('/');
//         }
//         else {

//         }
//     })
// })

app.listen(8000, function () {
    console.log("listening on port 8000");
})