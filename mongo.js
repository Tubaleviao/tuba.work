const mc = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');
let db;
const mdb_user = process.env.MONGO_USER;
const mdb_pass = process.env.MONGO_PASS;
const mdb_port = process.env.MONGO_PORT;
const url = `mongodb://${mdb_user}:${mdb_pass}@localhost:${mdb_port}/wonder`;

mc.connect(url, (err, database) => {
	if(err) throw err;
	db = database;
});

module.exports = {
  saveRecordCallback: (col, record, callback) => {
		let collection = db.collection(col);
		collection.save(record, {w:1}, (err, inserted) => {
			if(err){ console.log(err); callback(false);
			}else callback(inserted);
		});
	},
  saveRecord: (col, record) => {
		let collection = db.collection(col);
		collection.save(record, {w:1}, (err, inserted) => {
			if(err) console.log(err);
		});
	},
  findOneRecord: (col, query, callback) => {
		let collection = db.collection(col);
		collection.findOne(query, (err, record) => {
			if(err){ console.log(err); callback(false);}
			else{ record==null ? callback(false): callback(record); }
		});
	},
  updateRecord: (col, query, update, callback) => {
    collection = db.collection(col);
		collection.update(query, update,{upsert: true}, (err, resp) => {
			if(err){ console.log(err); callback(false);
			}else callback(resp);
		});
  },
  findRecords: (col, query, callback) => {
    let collection = db.collection(col);
		notes.find(query).toArray((err, docs) => {
			if(err){console.log(err); callback(err, null);}
			else callback(null, docs);
		});
  },
	auth: (user, pass, callback) => {
    let c = record => {
      if(record){
        bcrypt.compare(pass, record.password, (err, success) => {
          if(err){ console.log(err); callback(false);}
          success ? callback(true) : callback(false);
        });
      }else{ callback(false); }
    }
    this.findOneRecord('users', {username: user}, c)
	},
	addUser: (user, pass, email, callback) => {
		users = db.collection('users');
		bcrypt.hash(pass, 8, (err, hash) => {
			if (err){ console.log(err); callback(false);
			}else{
				let d = new Date();
				users.insert({username: user, password: hash, email: email, date: d.getTime()}, {w: 1}, (err, result) => {
					if(err){ console.log(err); callback(false);
					}else{ callback(result.insertedIds[0]); }
				});
			}
		});
	},
  existId: (id, callback) => {
    id = ObjectID.createFromHexString(id);
    this.findOneRecord('users', {_id: id}, callback)
	},
	existUser: (user, callback) => {
    this.findOneRecord('users', {username: user}, callback)
	},
	setEmail: function(data, callback){
    this.updateRecord('users', {username: data.user}, {$set: {email: data.email}}, callback);
	},
	saveNote: function(data, callback){
    this.updateRecord('notes', {user: data.user, id: data.id}, {$set: {note: data.note}}, callback)
	},
	saveChat: function(data, callback){
    this.saveRecordCallback('chats', data, callback)
	},
	getChat: (data, callback) => {
    this.findRecords('chats', {room: data}, callback)
	},
	saveNoteSize: (data, callback) => {
    this.updateRecord('notes', {user: data.user, id: data.id}, {$set: {x: data.x, y: data.y}}, callback)
	},
	takeNotes: (user, callback) => {
    this.findRecords('notes', {user: user}, callback)
	},
}

//if(record._id) record._id = ObjectID.createFromHexString(record._id);