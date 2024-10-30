import mongodb from 'mongodb'
const { ObjectId } = mongodb
import bcrypt from 'bcrypt'

// money
const deleteMove = function (data, callback) {
    data._id = ObjectId.createFromHexString(data._id)
    del.bind(this)('moves', { _id: data._id });
}, saveMove = function (data, callback) {
    if (data._id && data._id !== "") {
        data._id = ObjectId.createFromHexString(data._id);
        saveRecordCallback.bind(this)('moves', data, callback);
    } else {
        delete data._id;
        saveRecordCallback.bind(this)('moves', data, result => {
            callback({
                id: result.insertedId || result.insertedIds[0],
                name: data.name, value: data.value, in: data.in
            })
        })
    }
}, getFirstRpMove = function (user, callback) {
    const query = [{ $match: { user: user } }, { $group: { _id: "firstRecord", min: { $min: "$starty" } } }];
    aggregate.bind(this)('moves', query, function (result) {
        const query2 = [{ $match: { starty: result.min, user: user } }, { $group: { _id: "firstm", min: { $min: "$startm" } } }];
        aggregate.bind(this)('moves', query2, function (result2) {
            if (result && result2)
                callback({ fy: result.min, fm: result2.min });
            else
                callback(false);
        });
    });
}, getRpMoves = function (user, callback) {
    findRecords.bind(this)('moves', { user: user, repeat: "1" }, callback);
}, getFirstNrpMove = function (user, callback) {
    const query = [{ $match: { user: user } }, { $group: { _id: "firstRecord", min: { $min: "$year" } } }];
    aggregate.bind(this)('moves', query, function (result) {
        if (result) {
            const query2 = [{ $match: { year: result.min, user: user } }, { $group: { _id: "firstm", min: { $min: "$month" } } }];
            aggregate.bind(this)('moves', query2, function (result2) {
                if (result2) {
                    callback({ fy: result.min, fm: result2.min });
                }
            });
        }
    });
}, getNrpMoves = function (user, callback) {
    findRecords.bind(this)('moves', { user: user, repeat: "0" }, callback);
}, getMoves = function (user, callback) {
    findRecords.bind(this)('moves', { user: user }, callback);
};
// others
const aggregate = function (col, query, callback) {
    let collection = this.collection(col);
    collection.aggregate(query).then(record => {
        record == null ? callback(false) : callback(record);
    }).catch(err => {
        console.log(`aggregate Error: ${err}`)
        callback(false)
    })
};
const findOneRecord = function (col, query, callback) {
    let collection = this.collection(col)
    collection.findOne(query).then(record => {
        record == null ? callback(false) : callback(record);
    }).catch(err => {
        console.log(`findOneRecord Error: ${err}`)
    })

};
const saveRecordCallback = function (col, record, callback) {
    let collection = this.collection(col)
    let options = { w: 1, upsert: true }
    if (record._id)
        collection.replaceOne({ _id: record._id }, record, options).then(inserted => {
            callback(inserted)
        }).catch(err => {
            console.log(`saveRecordCallback Error: ${err}`)
            callback(false)
        })
    else collection.insertOne(record, { w: 1 }).then(ins => callback(ins)).catch(err => callback(err))
};
const saveRecord = function (col, record) {
    let collection = this.collection(col)
    collection.insertOne(record, { w: 1 }).catch(err => {
        console.log(`saveRecord Error: ${err}`)
    })
};
const updateRecord = function (col, query, update, callback) {
    let collection = this.collection(col);
    collection.updateOne(query, { $set: update }, { upsert: true }).then(resp => {
        callback(resp);
    }).catch(err => {
        console.log(`updateRecord Error: ${err}`)
        callback(false)
    })
}
const findRecords = function (col, query, callback) {
    let collection = this.collection(col)
    collection.find(query).toArray().then(docs => {
        callback(null, docs)
    }).catch(err => {
        console.log(`findRecords Error: ${err}`)
        callback(err, null)
    })
}
const auth = function (user, pass, callback) {
    let c = record => {
        if (record) {
            bcrypt.compare(pass, record.password, (err, success) => {
                if (err) {
                    console.log(`auth Error: ${err}`);
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
            console.log(`addUser Error: ${err}`);
            callback(false);
        }
        else {
            let d = new Date()
            let query = { username: user, password: hash, email: email, date: d.getTime(), permission: 1 }
            users.insertOne(query, { w: 1 }).then(result => {
                callback(result)
            }).catch(err => {
                console.log(`addUser Error: ${err}`)
                callback(false)
            })
        }
    })
};
const getUserInfo = function (user, callback) {
    let users = this.collection('users')
    users.findOne({ username: user }, { verified: 0 }).then(record => {
        let info = record
        let createdDate = new Date(record.date)
        let visits = this.collection('visits')
        info.date = createdDate.getDate() + '/' + createdDate.getMonth() + '/' + createdDate.getFullYear() + ' ';
        info.date += createdDate.getHours() + ':' + createdDate.getMinutes() + ':' + createdDate.getSeconds();
        visits.aggregate([{ $match: { user: user } }, { $group: { _id: "$page", count: { $sum: 1 } } }, { $sort: { count: -1 } }]).toArray((err2, results) => {
            if (err2) {
                console.log(`getUserInfo Error: ${err2}`);
                callback(false);
            }
            else {
                let visitedPages = {};
                results.forEach(page => { visitedPages[page._id] = page.count; });
                info.visitedPages = visitedPages;
                callback(null, info);
            }
        })
    }).catch(err => {
        console.log(`getUserInfo Error: ${err}`)
        callback(false)
    })
}
const del = function (col, query) {
    let collection = this.collection(col)
    collection.deleteOne(query, (err, obj) => err ? console.log(err) : true)
};
const existId = function (id, callback) {
    id = ObjectId.createFromHexString(id);
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
export default {
    setPassword, findOneRecord, saveRecordCallback,
    saveRecord, updateRecord, findRecords, auth,
    addUser, getUserInfo, delete: del, existId, existUser,
    setEmail, saveNote, saveNoteSize, takeNotes,
    deleteNote, saveChat, getChat, saveVisit, getPermission,
    // money
    deleteMove, saveMove, getFirstRpMove, getRpMoves, getFirstNrpMove,
    getNrpMoves, getMoves
}
