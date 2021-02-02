const ObjectID = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');
const findOneRecord = function (col, query, callback) {
    let collection = this.collection(col);
    collection.findOne(query, (err, record) => {
        if (err) {
            console.log(err);
            callback(false);
        }
        else {
            record == null ? callback(false) : callback(record);
        }
    });
};
const saveRecordCallback = function (col, record, callback) {
    let collection = this.collection(col);
    collection.insertOne(record, { w: 1 }, (err, inserted) => {
        if (err) {
            console.log(err);
            callback(false);
        }
        else
            callback(inserted);
    });
};
const saveRecord = function (col, record) {
    let collection = this.collection(col);
    collection.insertOne(record, { w: 1 }, (err, inserted) => {
        if (err)
            console.log(err);
    });
};
const updateRecord = function (col, query, update, callback) {
    let collection = this.collection(col);
    collection.updateOne(query, { $set: update }, { upsert: true }, (err, resp) => {
        if (err) {
            console.log(err);
            callback(false);
        }
        else
            callback(resp);
    });
};
const findRecords = function (col, query, callback) {
    let collection = this.collection(col);
    collection.find(query).toArray((err, docs) => {
        if (err) {
            console.log(err);
            callback(err, null);
        }
        else
            callback(null, docs);
    });
};
const auth = function (user, pass, callback) {
    let c = record => {
        if (record) {
            bcrypt.compare(pass, record.password, (err, success) => {
                if (err) {
                    console.log(err);
                    callback(false);
                }
                success ? callback(record) : callback(false); // true
            });
        }
        else {
            callback(false);
        }
    };
    findOneRecord.bind(this)('users', { username: user }, c);
};
const getPermission = function (user) {
    findOneRecord.bind(this)('users', { username: user }, (rec) => {
        return new Promise((res, rej) => res(rec.permission || 1));
    });
};
const addUser = function (user, pass, email, callback) {
    let users = this.collection('users');
    bcrypt.hash(pass, 8, (err, hash) => {
        if (err) {
            console.log(err);
            callback(false);
        }
        else {
            let d = new Date();
            users.insertOne({ username: user, password: hash, email: email, date: d.getTime(), permission: 1 }, { w: 1 }, (err, result) => {
                if (err) {
                    console.log(err);
                    callback(false);
                }
                else {
                    callback(result);
                }
            });
        }
    });
};
const getUserInfo = function (user, callback) {
    let users = this.collection('users');
    users.findOne({ username: user }, { verified: 0 }, (err, record) => {
        if (err) {
            console.log(err);
            callback(false);
        }
        else {
            let info = record;
            let createdDate = new Date(record.date);
            let visits = this.collection('visits');
            info.date = createdDate.getDate() + '/' + createdDate.getMonth() + '/' + createdDate.getFullYear() + ' ';
            info.date += createdDate.getHours() + ':' + createdDate.getMinutes() + ':' + createdDate.getSeconds();
            visits.aggregate([{ $match: { user: user } }, { $group: { _id: "$page", count: { $sum: 1 } } }, { $sort: { count: -1 } }]).toArray((err2, results) => {
                if (err2) {
                    console.log(err2);
                    callback(false);
                }
                else {
                    let visitedPages = {};
                    results.forEach(page => { visitedPages[page._id] = page.count; });
                    info.visitedPages = visitedPages;
                    callback(null, info);
                }
            });
        }
    });
};
const del = function (col, query) {
    let collection = this.collection(col);
    collection.deleteOne(query, (err, obj) => err ? console.log(err) : true);
};
const existId = function (id, callback) {
    id = ObjectID.createFromHexString(id);
    findOneRecord.bind(this)('users', { _id: id }, callback);
};
const existUser = function (user, callback) {
    findOneRecord.bind(this)('users', { username: user }, callback);
};
const setEmail = function (data, callback) {
    updateRecord.bind(this)('users', { username: data.user }, { $set: { email: data.email } }, callback);
};
const saveNote = function (data, callback) {
    updateRecord.bind(this)('notes', { user: data.user, id: data.id }, { note: data.note }, callback); // query, update
};
const saveNoteSize = function (data, callback) {
    updateRecord.bind(this)('notes', { user: data.user, id: data.id }, { x: data.x, y: data.y }, callback);
};
const takeNotes = function (user, callback) {
    findRecords.bind(this)('notes', { user: user }, callback);
};
const deleteNote = function (data, callback) {
    del.bind(this)('notes', { user: data.user, id: data.id });
    callback(true);
};
const saveChat = function (data, callback) {
    saveRecordCallback.bind(this)('chats', data, callback);
};
const getChat = function (data, callback) {
    findRecords.bind(this)('chats', { "room": data }, callback);
};
const saveVisit = function (visit) {
    saveRecord.bind(this)('visits', visit);
};
const setPassword = function (user, pass) {
    return new Promise((resolve, reject) => {
        bcrypt.hash(pass, 8, (err, hash) => {
            bcrypt.compare(pass, hash, (err, success) => console.log(err, success));
            updateRecord.bind(this)('users', { username: user }, { password: hash }, resolve);
        });
    });
};
//if(record._id) record._id = ObjectID.createFromHexString(record._id);
module.exports = { setPassword, findOneRecord, saveRecordCallback,
    saveRecord, updateRecord, findRecords, auth,
    addUser, getUserInfo, delete: del, existId, existUser,
    setEmail, saveNote, saveNoteSize, takeNotes,
    deleteNote, saveChat, getChat, saveVisit, getPermission };
