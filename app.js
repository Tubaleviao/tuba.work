const prod = process.env.PROD
const express = require('express')
const protocol = prod ? require('https'): require('http')
const fs = require('fs')
const app = express()
const port = process.env.PORT
const router = require('./routes')
const io_code = require('./io_code')
const cert = {key: fs.readFileSync(process.env.CERT_KEY), 
              cert: fs.readFileSync(process.env.CERT_CERT)}
const server = prod ? protocol.createServer(cert, app) : protocol.createServer(app)
const io = require('socket.io')(server)

app.use(express.static('public'))
app.set('view engine', 'ejs')
app.use('/', router)

io.of('/home').on('connection', io_code.home)
io.of('/player').on('connection', io_code.player)
io.of('/notes').on('connection', io_code.notes)
io.of('/chat').on('connection', io_code.chat)
io.of('/shooter').on('connection', io_code.shooter)

app.listen(port, () => console.log(`Port ${port}!`))