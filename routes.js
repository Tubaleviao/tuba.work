const express = require('express')
const router = express.Router()
const functions = require('./functions')
const multer  = require('multer')
const upload = multer()
const fs = require('fs')
const middle = require("./middle")
const cors = require("cors")
const request = require('request')

const userAuth = (req, res, next) => (req.session && req.session.user) ? next() : res.redirect('/home')
//let verified = (req, res, next) => (req.session.verified) ? next(): res.redirect('/home')

router.post('/upload', upload.single('soundBlob'), function (req, res, next) {
  console.log(req.file);
  let uploadLocation = __dirname + `/public/mp3/${new Date().getTime()}.mp3`
  fs.writeFileSync(uploadLocation, Buffer.from(new Uint8Array(req.file.buffer)));
  res.sendStatus(200);
})
router.get('/parabains', (req, res) => 
           request(`http://localhost:3000/?names=${req.query.names ? req.query.names : "Álvaro,Natália"}`, (e,r,b) => res.send(b)))
router.get('/hibo', (req, res) => res.render('rec'));
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
router.get('/default', functions.default); // verified
router.get('/talking', functions.talking); // verified
// API
router.get('/songs', middle.auth, functions.songs)
router.post('/jwt', functions.jwt)
router.post('/join', functions.join)
router.post('/audio/:user', functions.audio);
router.get('*', (req, res) => res.sendStatus(404))

module.exports = router
