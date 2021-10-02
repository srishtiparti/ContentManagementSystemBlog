//import dependencies
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const session = require('express-session');
const fileUpload = require('express-fileupload');

//global variables
var myApp = express();
myApp.use(bodyParser.urlencoded({ extended: true })); // use  QS- supports nesting, array etc true

//setting path for public folder (js and css files) and views (for html file) 
myApp.set('views', path.join(__dirname, 'views'));
myApp.use(express.static(__dirname + '/public'));

//To upload files
myApp.use(fileUpload());

//defining view engine to be used
myApp.set('view engine', 'ejs');

//connecting to database
mongoose.connect('mongodb://localhost:27017/ipsumstore', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// set up session
myApp.use(session({
    secret: '12hajsdjdwbi221ndxjsdlszx4567',
    resave: false,
    saveUninitialized: true
}));

// set up model for page
const Page = mongoose.model('Page', {
    title: String,
    imageName: String,
    content: String
});

// set up model for admin
const Admin = mongoose.model('Admin', {
    username: String,
    password: String
})

// setting up different routes
// setting up homepage
myApp.get('/', function (req, res) {
    Page.find({}).exec(function (err, pages) {
        res.render('homepage', { pages: pages }); //pass all pages to navbar
    });
})

//setting up login page
myApp.get('/login', function (req, res) {
    Page.find({}).exec(function (err, pages) {
        res.render('login', { pages: pages }); //pass all pages to navbar
    });
})

//setting up all pages page
myApp.get('/editPages', function (req, res) {
    //checking if user is logged in
    if (req.session.userLoggedIn) {
        Page.find({}).exec(function (err, pages) {
            console.log(err);
            res.render('editPages', { pages: pages });
        })
    }
    // if user is not logged in, direct to log in page
    else {
        res.redirect('/login');
    }
})

myApp.post('/login', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;

    Admin.findOne({ username: username, password: password }).exec(function (err, admin) {
        //logging errors
        console.log(err);
        if (admin) {
            //store username in session and set logged in true
            req.session.username = admin.username;
            req.session.userLoggedIn = true;
            //redirect to dashboard
            res.render('adminDashBoard', {
                heading: 'Welcome!',
                message: 'Hello Admin! Welcome to the Dashboard'
            });
        }
        else {
            Page.find({}).exec(function (err, pages) {
                res.render('login', { pages: pages }); //pass all pages to navbar
            });
        }
    })
})

myApp.get('/logout', function (req, res) {
    req.session.username = '';
    req.session.userLoggedIn = false;
    Page.find({}).exec(function (err, pages) {
        res.render('login', { pages: pages }); //pass all pages to navbar
    });
})

// to add a new page
myApp.get('/add', function (req, res) {
    //checking if user is logged in
    if (req.session.userLoggedIn) {
        res.render('page');
    }
})

// posting the added page and displaying successfully added message
myApp.post('/added', function (req, res) {
    if (req.session.userLoggedIn) {
        Page.find({}).exec(function (err, pages) {
            //fetch all the form fields
            var title = req.body.title;
            var content = req.body.content;

            //fetch and save the image

            // get the name of the file
            var imageName = Date.now() + "_" + req.files.image.name;
            // get the actual file (temporary file)
            var imageFile = req.files.image;
            // path to save it 
            var imagePath = 'public/uploads/' + imageName;
            // move temp file to the correct folder (public folder)
            imageFile.mv(imagePath)

            // create an object with the fetched data to send to the view
            var pageData = {
                title: title,
                imageName: imageName,
                content: content,
            }

            // save data to database
            var page = new Page(pageData); // not correct yet, we need to fix it.
            page.save();

            //redirect to dashboard
            res.render('adminDashBoard', {
                heading: 'Page Added!',
                message: `Successfully Added ${title} page`
            });
        });
    }
    else {
        res.render('login', { error: 'incorrect username or password' });
    }
});

// to delete a page and show successfully deleted message
myApp.get('/delete/:id', function (req, res) {
    // checking if user is logged in
    if (req.session.userLoggedIn) {
        var id = req.params.id;
        Page.findByIdAndDelete({ _id: id }).exec(function (err, page) {
            if (page) {
                res.render('adminDashBoard', {
                    heading: 'Page Deleted',
                    message: 'You have successfully Deleted the page!'
                });
            }
            else {
                res.render('adminDashBoard', {
                    heading: 'Delete Failed',
                    message: 'Failed to Delete the page! Try Again'
                });
            }
        })
    }
    else {
        res.render('login', { error: 'incorrect username or password' });
    }
})

// to edit a page and show successfully edited message
myApp.get('/edit/:id', function (req, res) {
    // checking if user is logged in
    if (req.session.userLoggedIn) {
        var id = req.params.id;
        Page.findOne({ _id: id }).exec(function (err, page) {
            if (page) {
                res.render('edit', {
                    title: page.title,
                    imageName: page.imageName,
                    content: page.content,
                });
            }
            else {
                res.render('adminDashBoard', {
                    heading: 'Edit Failed',
                    message: 'Failed to Edited the page! Try Again'
                });
            }
        })
    }
})

// posting the edited page and displaying successfully added message
myApp.post('/edit/:id', function (req, res) {
    if (req.session.userLoggedIn) {
        Page.find({}).exec(function (err, pages) {
            console.log(err);
            //fetch all the form fields
            var title = req.body.title;
            var content = req.body.content;

            //fetch and save the image

            // get the name of the file
            var imageName = Date.now() + "_" + req.files.image.name;
            // get the actual file (temporary file)
            var imageFile = req.files.image;
            // path to save it 
            var imagePath = 'public/uploads/' + imageName;
            // move temp file to the correct folder (public folder)
            imageFile.mv(imagePath)

            // create an object with the fetched data to send to the view
            var pageData = {
                title: title,
                imageName: imageName,
                content: content,
            }

            // save data to database
            var page = new Page(pageData); // not correct yet, we need to fix it.
            page.save();

            var id = req.params.id;
            Page.findByIdAndDelete({ _id: id }).exec(function (err, page) {
                if (page) {
                    res.render('adminDashBoard', {
                        heading: 'Page Edited!',
                        message: `Successfully Edited ${title} page`
                    });
                }
            })
        });
    }
    else {
        res.render('login', { error: 'incorrect username or password' });
    }
});


// to view a page 
myApp.get('/view/:id', function (req, res) {
    // checking if user is logged in
    if (req.session.userLoggedIn) {
        Page.find({}).exec(function (err, pages) {
            var id = req.params.id;
            Page.findOne({ _id: id }).exec(function (err, page) {
                if (page) {
                    res.render('displayAdmin', {
                        title: page.title,
                        imageName: page.imageName,
                        content: page.content,
                        pages: pages
                    });
                }
                else {
                    res.send('Error 404: Page Not Available');
                }
            });
        });
    }
    else {
        res.render('login', { error: 'incorrect username or password' });
    }
});

// displaying all the information from database to page
myApp.get('/:id', function (req, res) {
    Page.find({}).exec(function (err, pages) {
        var id = req.params.id;
        Page.findOne({ _id: id }).exec(function (err, page) {
            if (page) {
                res.render('display', {
                    title: page.title,
                    imageName: page.imageName,
                    content: page.content,
                    pages: pages
                });
            }
            else {
                res.send('Error 404: Page Not Available');
            }
        });
    });
})
//start the server and listen to port 2143
myApp.listen(2143); //http://localhost:2143

//confirmation message
console.log('working...');

