import express from 'express'
const router = express.Router();
import functions from './functions.mjs'
import multer from 'multer'
const upload = multer();
import fs from 'fs'
import middle from "./middle.mjs"
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const userAuth = (req, res, next) => (req.session && req.session.user) ? next() : res.redirect('/home');

// used in hibo
router.post('/upload', upload.single('soundBlob'), function (req, res) {
    console.log(req.file);
    let uploadLocation = __dirname + `/public/mp3/${new Date().getTime()}.mp3`;
    fs.writeFileSync(uploadLocation, Buffer.from(new Uint8Array(req.file.buffer)));
    res.sendStatus(200);
});
router.get('/save', userAuth, functions.save);
router.get('/six', userAuth, functions.six);
router.get('/money', userAuth, functions.money);
router.get('/hibo', (req, res) => res.render('rec'));
router.get('/webcam_face_detection', (req, res) => res.render('face'));
router.get('/profile', userAuth, functions.profile);
router.get('/home', functions.home);
router.post('/login', functions.login);
router.get('/logout', functions.logout);
router.post('/signup', functions.signup);
router.get('/auth', functions.auth);
router.get('/', userAuth, functions.dashboard);
router.get('/player', userAuth, functions.player); // verified
router.get('/player/:user', userAuth, functions.player);
router.get('/notes', userAuth, functions.notes); // verified
router.get('/chat', functions.chat);
router.get('/chat/:room', functions.chat);
router.get('/shooter', functions.shooter); // verified
router.get('/default', functions.default); // verified
router.get('/talking', functions.talking); // verified
router.get('/cookies', functions.cookies); // verified
router.get('/privacy', functions.privacy); // verified
router.get('/tuba-player-privacy', functions.tuba_player_privacy); // verified
router.get('/rag', functions.rag);
router.get('/clock', functions.clock);
// API
router.get('/songs', middle.auth, functions.songs);
router.post('/new_pass', functions.cp);
router.post('/jwt', functions.jwt);
router.post('/join', functions.join);
router.post('/audio/:user', functions.audio);
router.all('*', (req, res) => { console.log(`${req.url} not found`); res.sendStatus(404); });

export default router
