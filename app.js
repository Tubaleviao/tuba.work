require('dotenv').config(); // load environment variables
let expresss = require('express');
let prod = process.env.PROD == "true" || false;
const protocol = prod ? require('https') : require('http');
const fs = require('fs');
const session = require('express-session');
const socketio = require('socket.io');
const upio = require('up.io');
const { mongo, checkFolders } = require('./middle');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cookieParser = require('cookie-parser');
const router = require('./routes'); 
const io_code = require('./io_code');
const app = expresss();
const cert = prod ? () => ({
    key: fs.readFileSync(process.env.CERT_KEY),
    cert: fs.readFileSync(process.env.CERT_CHAIN),
    allowHTTP1: true
}) : () => false;
const server = prod ? protocol.createServer(cert(), app) : protocol.createServer(app);
const io = socketio(server);
const port = process.env.PORT;
const cookie = { secret: process.env.SESSION_SECRET,
    cookie: { sameSite: true, httpOnly: true, secure: prod },
    resave: true, saveUninitialized: false };
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(checkFolders);
app.use(upio.router);
app.use(expresss.urlencoded({ extended: true }));
app.use(expresss.json());
app.use(session(cookie));
app.use(expresss.static('public'));
app.use(expresss.static('public/face-stuff/weights'));
app.use(mongo);
app.use('/', router);
app.use((err, req, res, next) => {
    if (err) console.log(err);
    else next();
});
app.use((req, res) => {
    if(!req.secure && prod ){
        res.redirect("https://"+req.headers.host+req.url)
    }
});
io.of('/').on('connection', io_code.chat);
io.of('/home').on('connection', io_code.home);
io.of('/player').on('connection', io_code.player);
io.of('/notes').on('connection', io_code.notes);
io.of('/chat').on('connection', io_code.chat);
io.of('/shooter').on('connection', io_code.shooter);
io.of('/default').on('connection', io_code.default);
io.of('/talking').on('connection', io_code.talking);
io.of('/money').on('connection', io_code.money);
server.listen(port, () => console.log(`Port ${port}!`));
module.exports = app;
