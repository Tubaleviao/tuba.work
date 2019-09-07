const express = require('express')
const router = express.Router()
const functions = require('./functions')

let userAuth = (req, res, next) => (req.session.user) ? next() : res.redirect('/home')
//let verified = (req, res, next) => (req.session.verified) ? next(): res.redirect('/home')

app.get('/home', functions.home);
app.post('/login', functions.login);
app.get('/logout', functions.logout);
app.post('/signup', functions.signup);
app.get('/auth', functions.auth);
app.get('/', userAuth, functions.dashboard);
app.get('/player', functions.player); // verified
app.get('/notes', functions.notes); // verified
app.get('/chat', functions.chat);
app.get('/chat/:room', functions.chat);
app.get('/shooter', functions.shooter); // verified
router.get('*', (req, res) => res.send(404))

module.exports = router