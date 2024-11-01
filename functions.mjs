"use strict";
//Object.defineProperty(exports, "__esModule", { value: true })
import jwt from 'jsonwebtoken'
const { sign, verify } = jwt
import path from 'path'
import moment from 'moment'
import mongo from './mongo.mjs'
import fs from 'fs'
import getSize from 'get-folder-size'
import formidable from 'formidable'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let exports = {}

let nav = ["chat", "player", "shooter", "notes", "webcam_face_detection", "hibo", "money", "clock"]

exports.clock = async (req, res) => {
    let date = new Date()
    let visit = { ip: req.ip, date: date.getTime(), user: req.me?.username, page: "clock" }
    await mongo.saveVisit.bind(req.db)(visit)
    res.render('clock')
}

exports.save = async function (req, res) {
    var record = req.query;
    record.user = req.session.user;
    if (record.page !== "") {
        req.session.page = record.page;
    }
    else {
        delete req.session.page;
    }
    if (record.value !== "") {
        if (record.repeat == "1") {
            delete record.month;
            delete record.year;
            mongo.saveMove(record, function (resp) {
                if (!resp) {
                    console.log('Nãosalvo');
                }
            });
        }
        else {
            delete record.months;
            delete record.years;
            delete record.startm;
            delete record.starty;
            mongo.saveMove(record, function (resp) {
                if (!resp) {
                    console.log('Nãosalvo2');
                }
            });
        }
    }
    res.redirect('/money');
};
exports.six = function (req, res) {
    delete req.session.page;
    res.redirect('/money')
};
exports.money = async (req, res) => {
    let date = new Date()
    let visit = { ip: req.ip, date: date.getTime(), user: req.me?.username, page: "money" }
    await mongo.saveVisit.bind(req.db)(visit)
    res.render('money', { title: 'Money', user: req.session.user, page: req.session.page })
};
exports.rag = async (req, res) => {
    let date = new Date()
    let visit = { ip: req.ip, date: date.getTime(), user: req.me?.username, page: "rag" }
    await mongo.saveVisit.bind(req.db)(visit)
    res.render('rag', { title: 'Ragnatuba', user: req.session.user });
};
exports.tuba_player_privacy = (req, res) => {
    let now = moment();
    res.render('tuba_player_privacy', { title: 'tuba_player_privacy', user: req.session.user });
    console.log(req.ip + " " + now.format('DD/MM/YYYY HH:mm:ss') + ' tuba_player_privacy');
};
exports.privacy = async (req, res) => {
    let date = new Date()
    let visit = { ip: req.ip, date: date.getTime(), user: req.me?.username, page: "privacy" }
    await mongo.saveVisit.bind(req.db)(visit)
    res.render('privacy', { title: 'Privacy', user: req.session.user })
};
exports.cookies = async (req, res) => {
    let date = new Date()
    let visit = { ip: req.ip, date: date.getTime(), user: req.me?.username, page: "cookies" }
    await mongo.saveVisit.bind(req.db)(visit)
    res.render('cookies', { title: 'Cookies', user: req.session.user })
};
exports.talking = async (req, res) => {
    let date = new Date()
    let visit = { ip: req.ip, date: date.getTime(), user: req.me?.username, page: "talking" }
    await mongo.saveVisit.bind(req.db)(visit)
    res.render('talking', { title: 'Talking', user: req.session.user })
};
exports.default = async (req, res) => {
    let date = new Date()
    let visit = { ip: req.ip, date: date.getTime(), user: req.me?.username, page: "default" }
    await mongo.saveVisit.bind(req.db)(visit)
    res.render('default', { title: 'Default', user: req.session.user })
};
exports.home = (req, res) => {
    let date = new Date();
    let visit = { ip: req.ip, date: date.getTime(), user: req.session.user };
    if (req.session.verified || req.session.user) {
        let data = { title: 'Dashboard' };
        data.nav = nav;
        data.user = req.session.user;
        res.render('dashboard', data);
        visit.page = "dashboard";
    } else {
        let data = { title: 'Home' }
        visit.page = "home"
        res.render('home', data)
    }
    mongo.saveRecord.bind(req.db)('visits', visit);
};
exports.profile = async (req, res) => {
    let date = new Date();
    let visit = { ip: req.ip, date: date.getTime(), user: req.session.user, page: "profile" };
    let data = { title: 'Profile' };
    data.token = sign({ username: req.session.user, email: req.session.email }, process.env.JWT_KEY);
    data.user = req.session.user;
    mongo.getUserInfo.bind(req.db)(req.session.user, async (err, resp) => {
        if (err) {
            console.log(err);
        }
        else {
            data.userinfo = resp;
            res.render("profile", data);
            await mongo.saveVisit.bind(req.db)(visit);
        }
    });
};
exports.login = (req, res) => {
    let date = new Date();
    let visit = { ip: req.ip, date: date.getTime(), user: req.session.user };

    mongo.existUser.bind(req.db)(req.body.username, exist => {
        if (exist) {
            mongo.auth.bind(req.db)(req.body.username, req.body.password, (success) => {
                if (success) {
                    req.session.user = req.body.username;
                    req.session.email = exist.email;
                    req.session.permission = exist.permission || 1;
                    req.session.verified = true;
                    if (req.body.url == "/login")
                        res.redirect("home")
                    else
                        res.redirect(req.body.url)
                } else {
                    res.render('home', { title: 'Home', msg: 'Wrong password' });
                }
            });
        } else {
            res.render('home', { title: 'Home', msg: 'User don\'t exists' });
        }
    })
    visit.page = "login"
    mongo.saveRecord.bind(req.db)('visits', visit)
}
exports.logout = (req, res) => {
    let date = new Date();
    let visit = { ip: req.ip, date: date.getTime(), user: req.session.user, page: "logout" };
    req.session.destroy();
    res.redirect('/home');
    mongo.saveRecord.bind(req.db)('visits', visit)
};
exports.signup = (req, res) => {
    const { username, password, email } = req.body
    let date = new Date();
    let visit = { ip: req.ip, date: date.getTime(), user: username, page: "signup" }
    mongo.existUser.bind(req.db)(username, (exist) => {
        if (exist) {
            res.render('home', { title: 'home', msg: 'User already exists' });
        } else {
            mongo.addUser.bind(req.db)(username, password, email, (success) => {
                if (success) {
                    req.session.user = username
                    req.session.email = email
                    res.redirect('/auth?id=' + success.insertedId.toString())
                } else {
                    res.render('home', { title: 'home', msg: 'User not registered' });
                }
            })
        }
    })
    mongo.saveRecord.bind(req.db)('signup', visit)
}
exports.auth = (req, res) => {
    if (req.query.id) {
        mongo.existId.bind(req.db)(req.query.id, record => {
            if (record) {
                req.session.verified = true;
                record.verified = true;
                mongo.updateRecord.bind(req.db)('users', { _id: record._id }, record, resp => {
                    if (resp) {
                        let dir = __dirname + '/public/users/' + record.username;
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir, { recursive: true });
                        }
                        res.redirect('/');
                    }
                });
            }
        });
    }
    else {
        mongo.setEmail.bind(req.db)({ user: req.session.user, email: req.query.email }, resp => {
            if (resp) {
                //otherEmail = true;
                req.session.email = req.query.email;
                mongo.existUser.bind(req.db)(req.session.user, exist => {
                    if (exist)
                        res.redirect('/auth?id=' + exist._id);
                });
            }
        });
    }
};
exports.dashboard = (req, res) => {
    let date = new Date();
    let visit = { ip: req.ip, date: date.getTime(), user: req.session.user };
    if (req.session.verified || req.session.user) {
        let data = { title: 'Dashboard' };
        data.user = req.session.user;
        data.nav = nav;
        res.render('dashboard', data);
        visit.page = "dashboard";
    } else {
        let data = { title: 'Home' }
        visit.page = "home"
        res.render('home', data)
    }
    mongo.saveRecord.bind(req.db)('visits', visit)
};
exports.player = (req, res) => {
    let dir = path.join(__dirname, '/public/users/', (req.params.user ? req.params.user : req.session.user));
    let date = new Date();
    let data = { title: 'Player' }
    data.token = 'none';
    let visit = { ip: req.ip, date: date.getTime(), user: req.session.user, page: "player" };
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    getSize(dir).then(folder_size => {
        fs.readdir(dir, (err, files) => {
            if (err)
                throw err;
            data.musics = files;
            data.size = (folder_size / 1024 / 1024).toFixed(2);
            //data.user = req.session.user
            if (req.params.user)
                data = { ...data, user: req.params.user, owner: false };
            else
                data = { ...data, user: req.session.user, owner: true };
            data.permission = req.session.permission || 1;
            data.token = sign({ username: req.session.user, email: req.session.email, permission: data.permission }, process.env.JWT_KEY);
            res.render('player', data)
            mongo.saveRecord.bind(req.db)('visits', visit);
        })
    }).catch(err => {
        console.log(err)
    })
};
exports.notes = (req, res) => {
    let data = { title: 'Notes' };
    let date = new Date();
    let visit = { ip: req.ip, date: date.getTime(), user: req.session.user, page: "notes" }
    data.user = req.session.user, data.nav = nav;
    mongo.takeNotes.bind(req.db)(req.session.user, (err, docs) => {
        if (!docs) {
            res.render('notes', data);
        }
        else {
            if (docs) {
                data.notes = docs;
                res.render('notes', data);
            }
            else {
                res.render('notes', data);
            }
        }
    });
    mongo.saveRecord.bind(req.db)('visits', visit);
};
exports.chat = (req, res) => {
    let date = new Date();
    let visit = { ip: req.ip, date: date.getTime(), user: req.session.user, page: "chat" };
    let data = { ip: req.ip, title: 'Chat' };
    if (req.session.user != null) {
        data.user = req.session.user;
    }
    else if (req.query.user) {
        data.user = 'u' + Math.floor(Math.random() * 100000000);
    }
    if (req.params.room) {
        data.room = req.params.room;
    }
    res.render('chat', data);
    //mongo.saveRecord.apply( {db:req.db}, ['visits', visit])
    //mongo.saveRecord.call({db:req.db},'visits', visit)
    mongo.saveRecord.bind(req.db)('visits', visit);
};
exports.shooter = async (req, res) => {
    let date = new Date()
    let visit = { ip: req.ip, date: date.getTime(), user: req.me?.username, page: "shooter" }
    res.render('shooter', { title: 'Shooter', user: req.session.user })
    await mongo.saveVisit.bind(req.db)(visit)
};
// API CODE
exports.songs = async (req, res) => {
    let date = new Date();
    let visit = { ip: req.ip, date: date.getTime(), user: req.me.username, page: "songs" };
    let dir = __dirname + '/public/users/' + req.me.username;
    //let songs = 
    if (!fs.existsSync(dir)) {
        res.status(404).send(`User ${req.me.username} has no songs stored in the server!`);
    }
    else {
        fs.readdir(dir, (err, files) => {
            if (err)
                res.send(`Error: ${err}`);
            else {
                const shufle = b => {
                    let a = [...b]; for (let i = a.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [a[i], a[j]] = [a[j], a[i]];
                    } return a;
                };
                res.json(shufle(files));
                mongo.saveVisit.bind(req.db)(visit);
            }
        });
    }
};
exports.jwt = (req, res) => {
    let now = moment();
    mongo.auth.bind(req.db)(req.body.username, req.body.password, user => {
        if (user) {
            const token = sign({ ...user }, process.env.JWT_KEY);
            res.header("auth-token", token).json({ ok: true, token: token, data: user });
        }
        else {
            res.json({ ok: false, msg: "Check your user or password" });
        }
    });
    console.log(req.ip + " " + now.format('DD/MM/YYYY HH:mm:ss') + ' jwt');
};
exports.join = (req, res) => {
    let now = moment();
    mongo.existUser.bind(req.db)(req.body.username, (exist) => {
        if (exist) {
            res.json({ ok: false, msg: 'User already exists' });
        }
        else {
            console.log(req.body.username);
            mongo.addUser.bind(req.db)(req.body.username, req.body.password, req.body.email, (success) => {
                if (success) {
                    const data = { username: req.body.username, email: req.body.email };
                    const token = sign(data, process.env.JWT_KEY);
                    res.header("auth-token", token).json({ ok: true, token: token, data: data });
                }
                else {
                    res.json({ ok: false, msg: 'Error occurred, user not registered' });
                }
            });
        }
    });
    console.log(req.ip + " " + now.format('DD/MM/YYYY HH:mm:ss') + ' join');
};
exports.audio = async (req, res) => {
    let now = moment();
    const data = verify(req.header('token'), process.env.JWT_KEY);
    if (data.username === req.params.user) {
        const p = path.join(__dirname, 'public/users', req.params.user);
        if (!fs.existsSync(p))
            fs.mkdirSync(p);
        const size = () => new Promise((reso, reje) => getSize(p, (err, folder_size) => {
            if (err)
                console.log(err);
            else
                reso((folder_size / 1024 / 1024 / 1024).toFixed(2));
        }));
        let dirSize = await size();
        if (dirSize > (data.permission || 1)) {
            res.json({ ok: false, msg: `You've reached your limit of ${data.permission || 1}GB.` });
        }
        else {
            const formi = formidable({ keepExtensions: true, uploadDir: p });
            formi.parse(req, (err, fields, files) => {
                if (err)
                    res.json({ ok: false, error: err });
                let songs = [];
                for (let key of Object.keys(files)) {
                    let oldn = files[key].path;
                    let newn = oldn.substr(0, oldn.lastIndexOf('/') + 1) + files[key].name;
                    fs.renameSync(oldn, newn);
                    songs.push(files[key].name);
                }
                res.json({ ok: true, song: songs.length === 1 ? songs[0] : songs })
            });
        }
    }
    else
        res.json({ ok: false, msg: "You must to be authenticated to upload" })
    console.log(req.ip + " " + now.format('DD/MM/YYYY HH:mm:ss') + ' audio')
};
exports.cp = async (req, res) => {
    let now = moment();
    const data = verify(req.body.token, process.env.JWT_KEY);
    if (data.username === req.body.user) {
        let np = req.body.password.trim()
        if (np != "") {
            let worked = await mongo.setPassword.bind(req.db)(req.body.user, np)
            res.json({ success: worked, msg: 'Password set!' })
        }
        else res.json({ success: false, msg: 'Password cannot be empty!' })
    }
    else res.json({ success: false, msg: 'You should be the same user!' })
};

export default exports
