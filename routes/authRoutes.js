const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const router = express.Router();

// Register Route
router.get('/register', (req, res) => {
    res.render('register', { title: 'Register' });
});

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = new User({ username, email, password: hashedPassword });
        await user.save();
        res.redirect('/login');
    } catch (error) {
        res.send('Error registering user.');
    }
});

// Login Route
router.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    // const zhandos = bcrypt.compare(password, user.password)
    // // if (!user || !(await bcrypt.compare(password, user.password))) {
    // if (!(await bcrypt.compare(password, user.password))) {
    //     return res.send(`Invalid email or password!! ${password} ${user.password} $$$$$$$$$$$$$$ ${zhandos}`);
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
                }
            })
        })
    req.session.userId = user._id;
    res.redirect('/dashboard');

});

// Logout Route
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

module.exports = router;
