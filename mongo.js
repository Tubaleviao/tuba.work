import {MongoClient as mc} from 'mongodb';
import {ObjectID} from 'mongodb';
import bcrypt from 'bcrypt';
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

export function findOneRecord(col, query, callback) {
		let collection = db.collection(col);
		collection.findOne(query, (err, record) => {
			if(err){ console.log(err); callback(false);}
			else{ record==null ? callback(false): callback(record); }
		});
	}

export function saveRecordCallback(col, record, callback) {
		let collection = db.collection(col);
		collection.updateOne({bada: "boom"}, {$set: record}, {w:1, upsert:true}, (err, inserted) => {
			if(err){ console.log(err); callback(false);
			}else callback(inserted);
		});
	}

export function saveRecord(col, record) {
		let collection = db.collection(col);
		collection.updateOne({bada: "boom"}, {$set: record}, {w:1, upsert: true}, (err, inserted) => {
			if(err) console.log(err);
		});
	}

export function updateRecord(col, query, update, callback) {
    let collection = db.collection(col);
		collection.updateOne(query, {$set: update },{upsert: true}, (err, resp) => {
			if(err){ console.log(err); callback(false);
			}else callback(resp);
		});
  }

export function findRecords(col, query, callback) {
    let collection = db.collection(col);
		collection.find(query).toArray((err, docs) => {
			if(err){console.log(err); callback(err, null);}
			else callback(null, docs);
		});
  }

export function auth(user, pass, callback) {
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

export function addUser(user, pass, email, callback) {
  users = db.collection('users');
  bcrypt.hash(pass, 8, (err, hash) => {
    if (err){ console.log(err); callback(false);
    }else{
      let d = new Date();
      users.insertOne({username: user, password: hash, email, date: d.getTime()}, {w: 1}, (err, result) => {
        if(err){ console.log(err); callback(false);
        }else{ callback(result); }
      });
    }
  });
}

export function getUserInfo(user, callback) {
  let users = db.collection('users');
		
  users.findOne( {username: user}, {verified: 0}, (err, record) => {
    if(err){ console.log(err); callback(false)}
    else{
      let info = record;
      let createdDate = new Date(record.date);
      let visits = db.collection('visits');
      info.date = `${createdDate.getDate()}/${createdDate.getMonth()}/${createdDate.getFullYear()} `;
      info.date += `${createdDate.getHours()}:${createdDate.getMinutes()}:${createdDate.getSeconds()}`;
      visits.aggregate([{$match: {user}}, {$group: {_id: "$page", count: {$sum: 1}}}, {$sort: {count: -1}}], (err2, results)=>{
        if(err2){console.log(err2); callback(false)}else{
          let visitedPages = {};
          results.forEach(({_id, count}) => {visitedPages[_id] = count})
          info.visitedPages = visitedPages;
          callback(null, info);
        }
      });
    }
  });
  
}

export function existId(id, callback) {
  id = ObjectID.createFromHexString(id);
  this.findOneRecord('users', {_id: id}, callback)
}

export function existUser(user, callback) {
  this.findOneRecord('users', {username: user}, callback)
}

export function setEmail({user, email}, callback) {
  this.updateRecord('users', {username: user}, {$set: {email: email}}, callback);
}

export function saveNote({user, id, note}, callback) {
  this.updateRecord('notes', {user: user, id: id}, {$set: {note: note}}, callback)
}

export function saveChat(data, callback) {
  this.saveRecordCallback('chats', data, callback)
}

export function getChat(data, callback) {
  this.findRecords('chats', {room: data}, callback)
}

export function saveNoteSize({user, id, x, y}, callback) {
  this.updateRecord('notes', {user: user, id: id}, {$set: {x: x, y: y}}, callback)
}

export function takeNotes(user, callback) {
  this.findRecords('notes', {user}, callback)
}

export function saveVisit(visit) {
  this.saveRecord('visits', visit);
}

//if(record._id) record._id = ObjectID.createFromHexString(record._id);