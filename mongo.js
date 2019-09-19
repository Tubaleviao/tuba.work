const mc = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');
let db;
const mdb_user = process.env.MONGO_USER;
const mdb_pass = process.env.MONGO_PASS;
const mdb_port = process.env.MONGO_PORT;
const url = `mongodb://${mdb_user}:${mdb_pass}@localhost:${mdb_port}/wonder`;
const client = new mc(url, {useNewUrlParser: true, useUnifiedTopology: true});

client.connect(err => {
	if(err) throw err;
	db = client.db('wonder')
  client.close()
});

exports.findOneRecord = (col, query, callback) => {
		let collection = db.collection(col);
		collection.findOne(query, (err, record) => {
			if(err){ console.log(err); callback(false);}
			else{ record==null ? callback(false): callback(record); }
		});
	}

exports.saveRecordCallback = (col, record, callback) => {
		let collection = db.collection(col);
		collection.updateOne({bada: "boom"}, {$set: record}, {w:1, upsert:true}, (err, inserted) => {
			if(err){ console.log(err); callback(false);
			}else callback(inserted);
		});
	}

exports.saveRecord = (col, record) => {
		let collection = db.collection(col);
		collection.updateOne({bada: "boom"}, {$set: record}, {w:1, upsert: true}, (err, inserted) => {
			if(err) console.log(err);
		});
	}

exports.updateRecord = (col, query, update, callback) => {
    collection = db.collection(col);
		collection.updateOne(query, update,{upsert: true}, (err, resp) => {
			if(err){ console.log(err); callback(false);
			}else callback(resp);
		});
  }

exports.findRecords = (col, query, callback) => {
    let collection = db.collection(col);
		collection.find(query).toArray((err, docs) => {
			if(err){console.log(err); callback(err, null);}
			else callback(null, docs);
		});
  }

exports.auth = (user, pass, callback) => {
  let c = record => {
    if(record){
      bcrypt.compare(pass, record.password, (err, success) => {
        if(err){ console.log(err); callback(false);}
        success ? callback(true) : callback(false);
      });
    }else{ callback(false); }
  }
  this.findOneRecord('users', {username: user}, c)
}

exports.addUser = (user, pass, email, callback) => {
  users = db.collection('users');
  bcrypt.hash(pass, 8, (err, hash) => {
    if (err){ console.log(err); callback(false);
    }else{
      let d = new Date();
      users.insertOne({username: user, password: hash, email: email, date: d.getTime()}, {w: 1}, (err, result) => {
        if(err){ console.log(err); callback(false);
        }else{ callback(result); }
      });
    }
  });
}
exports.existId = (id, callback) => {
  id = ObjectID.createFromHexString(id);
  this.findOneRecord('users', {_id: id}, callback)
}
exports.existUser = (user, callback) => {
  this.findOneRecord('users', {username: user}, callback)
}
exports.setEmail = (data, callback) => {
  this.updateRecord('users', {username: data.user}, {$set: {email: data.email}}, callback);
}
exports.saveNote = (data, callback) => {
  this.updateRecord('notes', {user: data.user, id: data.id}, {$set: {note: data.note}}, callback)
}
exports.saveChat = (data, callback) => {
  this.saveRecordCallback('chats', data, callback)
}
exports.getChat = (data, callback) => {
  this.findRecords('chats', {room: data}, callback)
}
exports.saveNoteSize = (data, callback) => {
  this.updateRecord('notes', {user: data.user, id: data.id}, {$set: {x: data.x, y: data.y}}, callback)
}
exports.takeNotes = (user, callback) => {
  this.findRecords('notes', {user: user}, callback)
}

//if(record._id) record._id = ObjectID.createFromHexString(record._id);