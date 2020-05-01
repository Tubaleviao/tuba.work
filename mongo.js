const ObjectID = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');

exports.findOneRecord = (col, query, callback) => {
		let collection = this.collection(col);
		collection.findOne(query, (err, record) => {
			if(err){ console.log(err); callback(false);}
			else{ record==null ? callback(false): callback(record); }
		});
	}

exports.saveRecordCallback = (col, record, callback) => {
  let collection = this.collection(col);
		collection.insertOne(record, {w:1}, (err, inserted) => {
			if(err){ console.log(err); callback(false);
			}else callback(inserted);
		});
	}

exports.saveRecord = function(col, record){
		let collection = this.collection(col);
		collection.insertOne(record, {w:1}, (err, inserted) => {
			if(err) console.log(err);
		});
	}

exports.updateRecord = (col, query, update, callback) => {
    let collection = this.collection(col);
		collection.updateOne(query, {$set: update },{upsert: true}, (err, resp) => {
			if(err){ console.log(err); callback(false);
			}else callback(resp);
		});
  }

exports.findRecords = (col, query, callback) => {
    let collection = this.collection(col);
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
        success ? callback(record) : callback(false); // true
      });
    }else{ callback(false); }
  }
  this.findOneRecord('users', {username: user}, c)
}

exports.addUser = (user, pass, email, callback) => {
  users = this.collection('users');
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
exports.getUserInfo = (user, callback) => {
  let users = this.collection('users');
		
  users.findOne( {username: user}, {verified: 0}, (err, record) => {
    if(err){ console.log(err); callback(false)}
    else{
      let info = record;
      let createdDate = new Date(record.date);
      let visits = this.collection('visits');
      info.date = createdDate.getDate()+'/'+createdDate.getMonth()+'/'+createdDate.getFullYear()+' ';
      info.date += createdDate.getHours()+':'+createdDate.getMinutes()+':'+createdDate.getSeconds();
      visits.aggregate([{$match: {user: user}}, {$group: {_id: "$page", count: {$sum: 1}}}, {$sort: {count: -1}}]).toArray((err2, results)=>{
        if(err2){console.log(err2); callback(false)}else{
          let visitedPages = {};
          results.forEach(page => {visitedPages[page._id] = page.count})
          info.visitedPages = visitedPages;
          callback(null, info);
        }
      })
    }
  })
}
exports.delete = (col, query) => {
  let collection = this.collection(col);
  collection.deleteOne(query, (err, obj) => err ? console.log(err) : true)
}
exports.existId = (id, callback) => {
  id = ObjectID.createFromHexString(id);
  this.findOneRecord.bind(this)('users', {_id: id}, callback)
}
exports.existUser = (user, callback) => {
  this.findOneRecord.bind(this)('users', {username: user}, callback)
}
exports.setEmail = (data, callback) => {
  this.updateRecord.bind(this)('users', {username: data.user}, {$set: {email: data.email}}, callback);
}
exports.saveNote = (data, callback) => {
  this.updateRecord.bind(this)('notes', {user: data.user, id: data.id}, {note: data.note}, callback) // query, update
}
exports.saveNoteSize = (data, callback) => {
  this.updateRecord.bind(this)('notes', {user: data.user, id: data.id}, {x: data.x, y: data.y}, callback)
}
exports.takeNotes = (user, callback) => {
  this.findRecords.bind(this)('notes', {user: user}, callback)
}
exports.deleteNote = (data, callback) => {
  this.delete.bind(this)('notes', {user: data.user, id: data.id})
  callback(true)
}
exports.saveChat = (data, callback) => {
  this.saveRecordCallback.bind(this)('chats', data, callback)
}
exports.getChat = (data, callback) => {
  this.findRecords.bind(this)('chats', {"room": data}, callback)
}
exports.saveVisit = (visit) => {
  this.saveRecord.bind(this)('visits', visit);
}

//if(record._id) record._id = ObjectID.createFromHexString(record._id);