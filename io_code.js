"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const usernames = [];
const fs = require('fs');
const mongo = require('./mongo');
const moment = require('moment');
const upio = require("up.io");
const { connect } = require('./middle');
const getSize = require('get-folder-size');
const { sign, verify } = require("jsonwebtoken");
exports.talking = socket => {
    socket.on('talk', data => socket.broadcast.emit('talk', data));
};
exports.default = socket => {
    socket.on('event', data => socket.emit('event', data));
};
exports.home = function (socket) {
    // get user and room (users will need to signup to hide their ips)
    let addedUser = false;
    socket.on('new message', async (data) => {
        let hora = moment().format('h:mm:ss a');
        let resp = {
            hora: hora,
            username: socket.username,
            room: socket.room,
            message: data
        };
        socket.broadcast.emit('new message', resp);
        socket.emit('new message', resp);
        resp.hora = moment().format('x');
        if (socket.room != '') {
            const db = await connect();
            mongo.saveChat.bind(db)(resp, done => done ? true : console.log('ERROR while saving chat'));
        }
    });
    socket.on('add user', async (data) => {
        const client_ip_address = socket.request.connection.remoteAddress;
        let existe_user = false;
        let existe_room = false;
        let user_room, room_json;
        if (data.room) {
            user_room = data.room;
        }
        else {
            user_room = "";
        }
        for (let i = 0; i < usernames.length; i++) {
            if (usernames[i].room == user_room) {
                existe_room = true;
                room_json = usernames[i];
            }
        }
        // [ {room: "tubaroom", users: ["tuba", "joão" , ...]}, {...} ]
        if (!existe_room) {
            room_json = { room: user_room, users: [] };
            usernames.push(room_json);
        }
        if (room_json.users.indexOf(data.user) >= 0) {
            existe_user = true;
        }
        if (!existe_user) {
            socket.username = data.user;
            console.log(socket.username + " " + client_ip_address);
            socket.room = user_room;
            room_json.users.push(data.user);
            for (let i = 0; i < usernames.length; i++) {
                if (usernames[i].room == data.room) {
                    usernames[i].users = room_json.users;
                }
            }
            addedUser = true;
            const db = await connect();
            mongo.getChat.bind(db)(data.room, (err, chat) => {
                if (!chat) {
                    console.log('No records for the room ' + data.room);
                }
                else
                    room_json.chats = chat;
                socket.emit('login', {});
                socket.emit('refresh users', room_json);
                delete room_json.chats;
                socket.broadcast.emit('refresh users', room_json);
            });
        }
        else {
            // block login for non-logged users
            socket.emit('login failed', {});
        }
    });
    socket.on('disconnect', () => {
        let room_json;
        if (addedUser) {
            for (let i = 0; i < usernames.length; i++) {
                if (usernames[i].room == socket.room) {
                    room_json = usernames[i];
                    usernames[i].users.splice(usernames[i].users.indexOf(socket.username), 1);
                }
            }
            socket.broadcast.emit('refresh users', room_json);
            socket.emit('log', "You become disconnected. Please refresh the page");
        }
    });
    socket.on('blink', data => {
        socket.broadcast.emit('blink', data);
    });
};
exports.chat = socket => {
    let addedUser = false;
    socket.on('new message', async (data) => {
        const hora = moment().format('h:mm:ss a');
        const resp = {
            hora,
            username: socket.username,
            room: socket.room,
            message: data
        };
        socket.broadcast.emit('new message', resp);
        socket.emit('new message', resp);
        resp.hora = moment().format('x');
        if (socket.room != '') {
            const db = await connect();
            mongo.saveChat.bind(db)(resp, done => done ? true : console.log('ERROR while saving chat'));
        }
    });
    socket.on('add user', async (data) => {
        const client_ip_address = socket.request.connection.remoteAddress;
        let existe_user = false;
        let existe_room = false;
        let user_room, room_json;
        if (data.room) {
            user_room = data.room;
        }
        else {
            user_room = "";
        }
        for (let i = 0; i < usernames.length; i++) {
            if (usernames[i].room == user_room) {
                existe_room = true;
                room_json = usernames[i];
            }
        }
        // [ {room: "tubaroom", users: ["tuba", "joão" , ...]}, {...} ]
        if (!existe_room) {
            room_json = { room: user_room, users: [] };
            usernames.push(room_json);
        }
        if (room_json.users.indexOf(data.user) >= 0) {
            existe_user = true;
        }
        if (!existe_user) {
            socket.username = data.user;
            console.log(`${socket.username} ${client_ip_address}`);
            socket.room = user_room;
            room_json.users.push(data.user);
            for (let i = 0; i < usernames.length; i++) {
                if (usernames[i].room == data.room) {
                    usernames[i].users = room_json.users;
                }
            }
            addedUser = true;
            const db = await connect();
            mongo.getChat.bind(db)(data.room, (err, chat) => {
                if (!chat) {
                    console.log('No records for the room ' + data.room);
                }
                else
                    room_json.chats = chat;
                socket.emit('login', {});
                socket.emit('refresh users', room_json);
                delete room_json.chats;
                socket.broadcast.emit('refresh users', room_json);
            });
        }
        else {
            socket.emit('login failed', {});
        }
    });
    socket.on('disconnect', () => {
        let room_json;
        if (addedUser) {
            for (let i = 0; i < usernames.length; i++) {
                if (usernames[i].room == socket.room) {
                    room_json = usernames[i];
                    usernames[i].users.splice(usernames[i].users.indexOf(socket.username), 1);
                }
            }
            socket.broadcast.emit('refresh users', room_json);
            socket.emit('log', "You become disconnected. Please refresh the page");
        }
    });
    socket.on('blink', data => {
        socket.broadcast.emit('blink', data);
    });
};
exports.player = socket => {
    const uploader = new upio();
    let user;
    let user_url;
    let token;
    uploader.dir = "/public/tmp";
    uploader.listen(socket);
    socket.on('setUser', obj => { user_url = obj.user_url; user = obj.user; token = obj.token; });
    socket.on('delete', music => {
        fs.unlink(`${__dirname}/public/${user_url}/${music}`, (err, resp) => {
            if (err)
                console.log(err);
        });
    });
    socket.on('up_started', async (event) => {
        const size = () => new Promise((reso, reje) => getSize(`${__dirname}/public/${user_url}`, (err, folder_size) => {
            if (err) {
                console.log(err);
            }
            else {
                reso((folder_size / 1024 / 1024 / 1024).toFixed(2));
            }
        }));
        let dirSize = await size();
        const db = await connect();
        const comming = verify(token, process.env.JWT_KEY);
        if (comming.username === user) {
            let permission = await mongo.getPermission.bind(db)(user);
            if (dirSize > permission) {
                socket.emit('up_abortOne', event.id);
            }
            else {
                if (fs.existsSync(`${__dirname}/public/${user_url}/${event.music}`)) {
                    socket.emit('up_abortOne', event.id);
                }
                else {
                    socket.emit('addMusicProgress', {
                        exists: false,
                        id: event.id,
                        music: event.music,
                        size: (event.size / 1024 / 1024).toFixed(2),
                        loaded: 0
                    });
                }
            }
        }
        else {
            socket.emit('up_abortOne', event.id);
        }
    });
    socket.on('up_progress', event => {
        socket.emit("attMusicProgress", {
            id: event.id,
            music: event.music,
            size: (event.size / 1024 / 1024).toFixed(2),
            loaded: (event.loaded / 1024 / 1024).toFixed(2)
        });
    });
    socket.on('up_completed', event => {
        event.id = event.file_id;
        event.music = event.file_name;
        if (event.success) {
            fs.rename(`${__dirname}/public/tmp/${event.music}`, `${__dirname}/public/${user_url}/${event.music}`, err => {
                if (err)
                    console.log(err);
            });
            console.log(`user: ${user_url}, song: ${event.music}`);
        }
        socket.emit('deleteMusicProgress', event);
    });
    socket.on("error", event => {
        console.log(event.file.name + " - " + event.memo);
        fs.unlink(`./public/tmp/${event.file.name}`, (err, resp) => {
            if (err)
                console.log(err);
        });
    });
};
exports.notes = socket => {
    setInterval(() => { socket.emit('attBTC', {}); }, 5000);
    socket.on('save', async (data) => {
        const db = await connect();
        mongo.saveNote.bind(db)(data, success => {
            socket.emit('saved', success);
        });
    });
    socket.on('delete', async (data) => {
        const db = await connect();
        mongo.deleteNote.bind(db)(data, success => {
            socket.emit('deleted', success);
        });
    });
    socket.on('saveSize', async (data) => {
        const db = await connect();
        mongo.saveNoteSize.bind(db)(data, success => {
            if (!success)
                console.log("ERROR ON SAVING NOTE SIZE OMG");
        });
    });
};
exports.shooter = socket => {
    let players = [];
    socket.on('turn', data => { socket.broadcast.emit('turn', data); });
    socket.on('addPlayer', data => {
        players.push({ name: data.name });
        socket.broadcast.emit('oldPlayers', data);
        socket.broadcast.emit('addPlayer', data);
    });
    socket.on('oldPlayer', data => { socket.broadcast.emit('loadPlayers', data); });
    socket.on('shoot', data => { socket.broadcast.emit('shoot', data); });
    socket.on('setPosition', data => { socket.broadcast.emit('setPosition', data); });
    socket.on('kill', data => { socket.broadcast.emit('kill', data); });
};
