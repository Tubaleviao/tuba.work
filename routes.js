const express = require('express')
const router = express.Router()
const functions = require('./functions')

const userAuth = (req, res, next) => (req.session && req.session.user) ? next() : res.redirect('/home')
//let verified = (req, res, next) => (req.session.verified) ? next(): res.redirect('/home')

router.get('/webcam_face_detection', (req, res) => res.render('face'));
router.get('/profile', userAuth, functions.profile);
router.get('/home', functions.home);
router.post('/login', functions.login);
router.get('/logout', functions.logout);
router.post('/signup', functions.signup);
router.get('/auth', functions.auth);
router.get('/', userAuth, functions.dashboard);
router.get('/player', functions.player); // verified
router.get('/notes', functions.notes); // verified
router.get('/chat', functions.chat);
router.get('/chat/:room', functions.chat);
router.get('/shooter', functions.shooter); // verified
router.get('*', (req, res) => res.sendStatus(404))

module.exports = router