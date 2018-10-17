var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');


//session statements
const flash = require('express-flash');
app.use(flash());
var session = require("express-session");
app.use(session({secret: 'thisisasecretkey'}));


//bcrypt statements
const bcrypt = require('bcryptjs');
SALT_WORK_FACTOR = 10;
// const saltRounds = 10;

//mongoose statements
var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

mongoose.connect('mongodb://localhost/login_registration');
mongoose.Promise = global.Promise;

var UserSchema = new mongoose.Schema(
    {
    firstname: { 
        type: String, 
        required: [true, 'First name is required.'], 
        minlength: [2, 'First name must be at least 2 characters.'],
        trim: true
    },
    lastname: { 
        type: String, 
        required: [true, 'Last name is required.'], 
        minlength: [2, 'Last name must be at least 2 characters.'],
        trim: true
    },
    birthday: {
        type: Date, 
        required: [true, "Please enter your birthdate."],
        validate: { validator: function(value) 
            {
                var now = new Date();
                now.setUTCHours(0,0,0,0);
                var then = new Date(value);
                return then < now;
            },
            message: "Birthday must be in the past."
        }
    },
    password: {
        type: String, 
        required: [true, "Password is required."], 
        minlength: [4,"Minimum length 4 characters."]
    },
    email: {
        type: String,
        required: [true, 'Email is required.'],
        unique: [true, "You could not be logged in."],
        validate: {
            validator: function(value) {
                return /\S+@\S+\.\S+/.test(value);
            },
            message: "Email format invalid."
        }
    },
});

UserSchema.pre('save', function(next){
    bcrypt.hash(this.password, 10)
    .then(hashed_password => {
        this.password = hashed_password;
        next();
    })
    .catch(error => {
        console.log(error);
    });

// UserSchema.pre('validate', function(next) {
//     if (this.password !== this.pwconf) {
//         this.invalidate('pwconf', 'enter the same password');
//         }
//         next()
//     });
})

UserSchema.plugin(uniqueValidator);

mongoose.model('User', UserSchema);
var User = mongoose.model('User');

app.get('/', function(request, response) {
    var errors = request.session.errors;
    request.session.errors = [];
    response.render("index", {errors:errors});
});

app.post('/register', function(request, response) {
    console.log("THIS IS REGISTER ");
    
    if (request.body.password !== request.body.pwconf) {
        for(var key in error.errors){
            request.flash('errors', error.errors[key].message);
            }
        }
    var newuser = new User({
    firstname : request.body.firstname,
    lastname : request.body.lastname,
    birthday : request.body.birthday,
    email : request.body.email,
    password : request.body.password,
    });
    newuser.save(function(error){
        console.log(" below the info", error)
        // if (request.body.password !== request.body.pwconf) {
        //     for(var key in error.errors){
        //         request.flash('errors', error.errors[key].message);
        //         }
        //     }
            // request.session.errors.push("Password and confirmation do not match.");
        if (error){
            for(var key in error.errors){
                request.flash('errors', error.errors[key].message);
                // response.redirect("/");
            }
            response.redirect("/");
        }
        else{
            console.log("success from the page.");
            request.session.firstname = newuser.firstname;
            request.session.lastname = newuser.lastname;
            request.session.id = newuser.id;
            response.redirect('/success');
        }
    })
    console.log(newuser);
});

app.post('/login', (request, response) => {
    // const logerrors = [] ;
    // if (request.body.password !== request.body.pwconf && request.body.password !== ''){
    //     logerrors.push({message: "Passwords must match!"});
    // }
    console.log(" THIS IS LOGIN  ", request.body);
        User.findOne({email: request.body.email}, function(error, user){
            if (error){
                console.log("We have an error!", error);
                response.redirect("/");
            }
            else {
                if (user){
                    console.log(user);
                    bcrypt.compare(request.body.password, user.password, function(error, result){
                        if(result) {
                            request.session.firstname = user.firstname;
                            request.session.lastname = user.lastname;
                            request.session.user_id = user._id; 
                            response.redirect("/success");
                        }
                        else {
                            request.flash("errors", "You could not be logged in.");
                            console.log("We have an error!", error);
                            response.redirect("/");
                        }
                    })
                }
                ///only here if email not in DB
                else{
                    request.flash("errors", "You could not be logged in.");
                    console.log('user does not exist in DB. very bottom');
                    // request.flash('Try again', err.errors[key].message);
                    response.redirect('/');
                }
        }
    })
});

app.get("/success", function(request, response){
    User.findOne({_id: request.session.user_id}, function(err, user){
            if(err) {
                response.redirect("/");
            }
            else {
                response.render("success", {user: user});
            }
        });
});
    
app.post('/logout', function(request, response){
    request.session.destroy();
    response.redirect('/');
    console.log("LOGOUT SUCCESSFUL.");
});

app.listen(8000, function() {
    console.log("listening on port 8000");
});




