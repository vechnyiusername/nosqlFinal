require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const authRoutes = require('./routes/authRoutes');

const app = express();
const port = process.env.PORT || 5000;

// MongoDB Atlas Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.log(err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Change to true in production
}));

// Static Files
app.use(express.static('public'));
app.use('/css', express.static(__dirname + 'public/css'));

// Set Templating Engine
app.use(expressLayouts);
app.set('layout', './layouts/full-width');
app.set('view engine', 'ejs');

// Routes
app.use('/', authRoutes);

// Protect Routes Middleware
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/login');
}

// Dashboard Route (Protected)
app.get('/dashboard', isAuthenticated, async (req, res) => {
    const user = await User.findById(req.session.userId);
    res.render('dashboard', { title: 'Dashboard', user });
});

// Home Route
app.get('', (req, res) => {
    res.render('index', { title: 'Home Page' });
});

app.get('/about', (req, res) => {
    res.render('about', { title: 'About Page', layout: './layouts/sidebar' });
});

// Listen on Port
app.listen(port, () => console.info(`App listening on http://localhost:${port}`));



// Authentication Routes (routes/authRoutes.js)
const router = express.Router();

router.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    // if (!user || !(await bcrypt.compare(password, user.password))) {
    //     return res.render('login', { title: 'Login', error: 'Invalid credentials' });
    // }

    User.findOne({ email })
        .then(user => {
            //if user not exist than return status 400
            if (!user) return res.status(400).json({ msg: "User not exist" })

            //if user exist than compare password
            //password comes from the user
            //user.password comes from the database
            bcrypt.compare(password, user.password, (err, data) => {
                //if error than throw error
                if (err) throw err

                //if both match than you can do anything
                if (data) {
                    return res.status(200).json({ msg: "Login success" })
                } else {
                    return res.status(401).json({ msg: "Invalid credencial" })
                }

            })

        })

    req.session.userId = user._id;
    res.redirect('/dashboard');
});

router.get('/register', (req, res) => {
    res.render('register', { title: 'Register' });
});

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        await User.create({ username, email, password });
        res.redirect('/login');
    } catch (error) {
        res.render('register', { title: 'Register', error: 'Error creating account' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

module.exports = router;
