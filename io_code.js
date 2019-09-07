const fs = require('fs')

exports.home = function(socket){
	setInterval(() => { socket.emit('attBTC', {}) }, 5000);
};

exports.player = socket => {
	let uploader = new upio();
	let user; 
	uploader.dir = "/public/tmp";
	uploader.listen(socket);
	
	setInterval(() => { socket.emit('attBTC', cur3)	}, 5000);
	
	socket.on('setUser', username => { user = username });

	socket.on('delete', music => {
		fs.unlink(__dirname+'/public/'+user+'/'+music, (err, resp) => {
			if(err) console.log(err);
		});
	});

	socket.on('up_started', event => {
		let data = {};
		if(fs.existsSync(__dirname+'/public/'+user+'/'+event.music)){
			socket.emit('up_abortOne', event.id); 
		}else{
			data.exists = false;
			data.id = event.id;
			data.music = event.music;
			data.size = (event.size/1024/1024).toFixed(2);
			data.loaded = 0;
			socket.emit('addMusicProgress', data);
		}
	});

  socket.on('up_progress', event => {
		let data = {};
		data.id = event.id;
		data.music = event.music;
		data.size = (event.size/1024/1024).toFixed(2);
		data.loaded = (event.loaded/1024/1024).toFixed(2);
		socket.emit("attMusicProgress", data);
	});

  socket.on('up_completed', event => {
    event.id = event.file_id;
		event.music = event.file_name;
    if(event.success){
      fs.rename( __dirname+'/public/tmp/'+event.music, __dirname+'/public/'+user+'/'+event.music, err => {
        if(err) console.log(err);
      });
    }
		socket.emit('deleteMusicProgress', event);
	});

  socket.on("error", event => {
		console.log(event.file.name+" - "+event.memo);
		fs.unlink('./public/tmp/'+event.file.name, (err, resp) => {
			if(err) console.log(err);
		});
	});
}

exports.notes = socket => {
	
	setInterval(() => {socket.emit('attBTC', {}) }, 5000);
	
  socket.on('save', data => {
    mongo.saveNote(data, success => {
      socket.emit('saved', success);
    });
  });
	
	socket.on('saveSize', data => {
    mongo.saveNoteSize(data, success => {
      if(!success) console.log("ERROR ON SAVING NOTE SIZE OMG");
    });
  });
}

exports.chat = socket => {
	let addedUser = false;
  
  socket.on('new message', data => {
    let hora = moment().format('h:mm:ss a');
    let resp = {
      hora: hora,
      username: socket.username,
      room: socket.room,
      message: data
    }
    socket.broadcast.emit('new message', resp);
    socket.emit('new message', resp);
    resp.hora = moment().format('x');
    if(socket.room != ''){
      mongo.saveChat(resp, done => {
        if(!done) console.log('ERROR while saving chat');
      });
    }

  });

  socket.on('add user', data => {
    let client_ip_address = socket.request.connection.remoteAddress;
		let existe_user = false;
		let existe_room = false;
		let user_room, room_json;
		if(data.room){
			user_room = data.room;
		}else{
			user_room = "";
		}
		
		for (let i = 0; i < usernames.length; i++){
			if (usernames[i].room == user_room){
				existe_room = true;
				room_json = usernames[i];
			}
		}
		// [ {room: "tubaroom", users: ["tuba", "joão" , ...]}, {...} ]
		
		if(!existe_room){
			usernames.push({room: user_room, users: []});
			room_json = {room: user_room, users: []};
		}
		
		if(room_json.users.indexOf(data.user) >= 0){
			existe_user = true;
		}
		
		if(!existe_user){
			console.log(socket.username+" "+client_ip_address);
			socket.username = data.user;
			socket.room = user_room;
			room_json.users.push(data.user);
			for (let i = 0; i < usernames.length; i++){
				if (usernames[i].room == data.room){
					usernames[i].users = room_json.users;
				}
			}
			addedUser = true;
			mongo.getChat(data.room, chat => {
				if(!chat){ console.log('ERROR while getting chat')}
				else{
					room_json.chats = chat;
					socket.emit('login', {});
					socket.emit('refresh users', room_json);
				}
				delete room_json.chats;
				socket.broadcast.emit('refresh users', room_json);
			});
		} else {
			socket.emit('login failed', {});
		}
  });
  
  socket.on('disconnect', () => {
		let room_json;
    if (addedUser) {
			for (let i = 0; i < usernames.length; i++){ 
				if (usernames[i].room == socket.room){
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
}

exports.shooter = socket => {
	socket.on('turn', data => { socket.broadcast.emit('turn', data) });

	socket.on('addPlayer', data => {
		players.push({name: data.name});
		socket.broadcast.emit('oldPlayers', data);
		socket.broadcast.emit('addPlayer', data);
	});

	socket.on('oldPlayer', data => { socket.broadcast.emit('loadPlayers', data) })

	socket.on('shoot', data => { socket.broadcast.emit('shoot', data) })

	socket.on('setPosition', data => { socket.broadcast.emit('setPosition', data) })

	socket.on('kill', data => { socket.broadcast.emit('kill', data) })
}