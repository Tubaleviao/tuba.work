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
	existUser: function(user, callback){
		users = db.collection('users');
		users.findOne({username: user}, function(err, record){
			if(err){ console.log(err); callback(false);}
			else{
				if(record==null){
					callback(false);
				}else{
					callback(record);
				}
			}
		});
	},
	existId: function(id, callback){
		id = ObjectID.createFromHexString(id);
		users = db.collection('users');
		users.findOne({_id: id}, function(err, record){
			if(err){ console.log(err); callback(false);}
			else{
				if(record==null){
					callback(false);
				}else{
					callback(record);
				}
			}
		});
	},
	auth: function(user, pass, callback){
		users = db.collection('users');
		users.findOne({username: user}, function(err, record){
			if(err){console.log(err); callback(false);}
			if(record){
				bcrypt.compare(pass, record.password, function(err, success){
					if(err){ console.log(err); callback(false);}
					if(success) { callback(true); }
					else{ callback(false); }
				});
			}else{ callback(false); }
		});
	},
	setEmail: function(data, callback){
		users = db.collection('users');
		users.update({username: data.user}, {$set: {email: data.email}}, function(err, resp){
			if(err){ console.log(err); callback(false);
			}else{ callback(resp); }
		});
	},
	addUser: function(user, pass, email, callback){
		users = db.collection('users');
		bcrypt.hash(pass, 8, function(err, hash) {
			if (err){ console.log(err); callback(false);
			}else{
				var d = new Date();
				users.insert({username: user, password: hash, email: email, date: d.getTime()}, {w: 1}, function(err, result){
					if(err){ console.log(err); callback(false);
					}else{ callback(result.insertedIds[0]); }
				});
			}
		});
	},
	saveNote: function(data, callback){
		var notes = db.collection('notes');
		notes.update({user: data.user, id: data.id}, {$set: {note: data.note}}, {upsert: true}, function(err, resp){
			if(err){ console.log(err); callback(false);
			}else{ callback(true); }
		});
	},
	saveChat: function(data, callback){
		var chats = db.collection('chats');
		chats.insertOne(data, function(err, resp){
			if(err){ console.log(err); callback(false);
			}else{ callback(true); }
		});
	},
	getChat: function(data, callback){
		var chats = db.collection('chats');
		chats.find( {room: data} ).toArray(function(err, docs){
			if(err){console.log(err); callback(false);
			}else{callback(docs);}
		});
	},
	saveNoteSize: function(data, callback){
		var notes = db.collection('notes');
		notes.update({user: data.user, id: data.id}, {$set: {x: data.x, y: data.y}}, {upsert: true}, function(err, resp){
			if(err){ console.log(err); callback(false);
			}else{ callback(true); }
		});
	},
	takeNotes: function(user, callback){
		var notes = db.collection('notes');
		notes.find({user: user}).toArray(function(err, docs){
			if(err){console.log(err); callback(err, null);}
			else{
				callback(null, docs);
			}
		});
	},
}

//if(record._id) record._id = ObjectID.createFromHexString(record._id);