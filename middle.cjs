"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = require("jsonwebtoken");
const fs = require('fs');
const path = require('path');
const mc = require('mongodb').MongoClient;
const mongoPort = process.env.MONGO_PORT
let db;
const url = `${process.env.MONGO_PROTOCOL}://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}${mongoPort ? ':'+mongoPort : ''}/${process.env.MONGO_OPTIONS}`;
const client = new mc(url, { useNewUrlParser: true, useUnifiedTopology: true, });
const auth = (req, res, next) => {
    try {
        const { token } = req.headers;
        let json = jsonwebtoken_1.verify(token, process.env.JWT_KEY);
        req.me = json;
        next();
    }
    catch (err) {
        next({ msg: "token not valid", error: err });
    }
};
const mongo = async (req, res, next) => {
    if (!db) {
        try {
            const mdb = await client.connect();
            db = mdb.db(process.env.MONGO_DB);
        }
        catch (e) {
            next({ msg: "db error", error: e });
        }
    }
    req.db = db;
    next();
};
const connect = async () => {
    if (!db) {
        try {
            const mdb = await client.connect();
            db = mdb.db(process.env.MONGO_DB);
        }
        catch (e) {
            console.error(e);
        }
    }
    return db;
};
const checkFolders = async (req, res, next) => {
    let dir = path.join(__dirname, 'public', 'users');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    next();
};
const crossOrigin = (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    console.log(req.body);
    next();
};
module.exports = { connect, auth, crossOrigin, mongo, checkFolders };
