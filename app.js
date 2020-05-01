require('dotenv').config() // load environment variables
const express = require('express')
const prod = process.env.PROD
const protocol = prod ? require('https'): require('http') // spdy
const fs = require('fs')
const session = require('express-session')
const socketio = require('socket.io')
const upio = require('up.io');
//const helmet = require('helmet');

const router = require('./routes')
const io_code = require('./io_code')

const app = express()
const cert = prod? () => ({key: fs.readFileSync(process.env.CERT_KEY), cert: fs.readFileSync(process.env.CERT_CERT), allowHTTP1: true}) : false
const server = prod ? protocol.createServer(cert(), app) : protocol.createServer(app)
const io = socketio(server)
const port = process.env.PORT
app.set('view engine', 'ejs')

//app.use(helmet())
app.use(upio.router);
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(session({secret: process.env.SESSION_SECRET ,cookie: {}, resave: true, saveUninitialized: false}))
app.use(express.static('public'))
app.use(express.static('public/face-stuff/weights'))
app.use('/', router)

app.use((err, req, res, next)=>{
  if(err) console.log(err);
  else next();
})

io.of('/').on('connection', io_code.chat)
io.of('/home').on('connection', io_code.home)
io.of('/player').on('connection', io_code.player)
io.of('/notes').on('connection', io_code.notes)
io.of('/chat').on('connection', io_code.chat)
io.of('/shooter').on('connection', io_code.shooter)
io.of('/default').on('connection', io_code.default)
io.of('/talking').on('connection', io_code.talking)

server.listen(port, () => console.log(`Port ${port}!`))

module.exports = app