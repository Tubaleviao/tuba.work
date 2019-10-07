import moment from 'moment';
import mongo from './mongo';
import fs from 'fs';
import getSize from 'get-folder-size';

let nav = ["chat", "player", "shooter", "notes"]

export function home({ip, session}, res) {
  let date = new Date();
	let visit = {ip: ip, date: date.getTime(), user: session.user};
	let data = {};
	
	if(session.verified || session.user){
		data.title = 'Dashboard';
		data.nav = nav;
		data.user = session.user;
		res.render('dashboard', data);
		visit.page = "dashboard";
	}/*else if(req.session.user){
		data.title = 'Verify';
		data.user = req.session.user;
		data.email = req.session.email;
		res.render('verify', data);
		visit.page = "verify";
	}*/else{
		data.title = 'Home';
		res.render('home', data);
		visit.page = "home";
	}
	mongo.saveRecord('visits', visit);
}

export function profile({ip, session}, res) {
  let date = new Date();
	let visit = {ip: ip, date: date.getTime(), user: session.user, page: "profile"};
	let data = {};
	data.title = 'Profile', data.user = session.user
	mongo.getUserInfo(session.user, (err, resp)=>{
		if(err){console.log(err)}else{
			data.userinfo = resp;
			res.render("profile", data);
			mongo.saveVisit(visit);
		}
	});
}

export function login({ip, session, body}, res) {
  let date = new Date();
	let visit = {ip: ip, date: date.getTime(), user: session.user};
	
	mongo.existUser(body.username, (exist) => {
		if(exist){
			mongo.auth(body.username, body.password, (success) => {
				if(success){
					session.user = body.username
					session.email = exist.email
					session.verified = true
          if(body.url == "login"){
            res.redirect("home")
          }else{
            res.redirect(body.url);
            console.log(body.url)
          }
				}else{
					res.render('home', {title: 'Home', msg: 'Wrong password'})
				}
			});	
		}else{
			res.render('home', {title: 'Home', msg: 'User don\'t exists'})
		}
	});	
	mongo.saveRecord('visits', visit)
}

export function logout({ip, session}, res) {
  let date = new Date();
	let visit = {ip: ip, date: date.getTime(), user: session.user, page: "about"};
	session.destroy();
	res.redirect('/home');
	mongo.saveRecord('visits', visit);
}

export function signup({body, session, ip}, res) {
  let now = moment();

	mongo.existUser(body.username, (exist) => {
		if(exist){
			res.render('home', {title: 'home', msg: 'User already exists'});
		}else{
      console.log(body.username)
			mongo.addUser(body.username, body.password, body.email, (success) => {
				if(success){
					session.user = body.username;
					session.email = body.email;
          res.redirect(`/auth?id=${success.ops[0]._id}`);
				}else{
					res.render('home', {title: 'home', msg: 'User not registred'});
				}
			});
		}
	});
	console.log(`${ip} ${now.format('DD/MM/YYYY HH:mm:ss')} sigup`);
}

export function auth({query, session}, res) {
  if(query.id){
		mongo.existId(query.id, record => {
			if(record){
				session.verified = true;
				record.verified = true;
				mongo.updateRecord('users', {_id: record._id}, record, resp => {
					if(resp){
						let dir = `${__dirname}/public/users/${record.username}`;
						if (!fs.existsSync(dir)){fs.mkdirSync(dir);}
						res.redirect('/');
					}
				});
			}
		});
	}else{
		mongo.setEmail({user: session.user, email: query.email}, resp => {
			if(resp){
				otherEmail = true;
				session.email = query.email;
				mongo.existUser(session.user, exist => {
					if(exist) res.redirect(`/auth?id=${exist._id}`);
				});
			}
		});
	}
}

export function dashboard({ip, session}, res) {
	let data = {};
	let date = new Date();
	let visit = {ip: ip, date: date.getTime(), user: session.user};
	
	if(session.verified || session.user){
		data.title = 'Dashboard';
		data.user = session.user;
		data.nav = nav;
		res.render('dashboard', data);
		visit.page = "dashboard";
	}/*else if(req.session.user){
		data.title = 'Verify';
		data.user = req.session.user;
		data.email = req.session.email;
		if(otherEmail){
			otherEmail = false;
			data.msg = "Email changed ~";
		}
		res.render('verify', data);
		visit.page = "verify";
	}*/else{
		data.title = 'Home';
		res.render('home', data);
		visit.page = "home";
	}
	mongo.saveRecord('visits', visit);
}

export function player({session, ip}, res) {
  let dir = `${__dirname}/public/users/${session.user}`;
	let date = new Date();
	let data = {};
	let visit = {ip: ip, date: date.getTime(), user: session.user, page: "player"};
	
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  
	getSize(dir, (err, folder_size) => {
		if (err) { console.log(err);
		}else{
			fs.readdir(dir, (err, files) =>{
				if(err) throw err;
				data.musics = files
        data.size = (folder_size/1024/1024).toFixed(2)
				data.user = session.user
        data.title = 'Player'
				res.render('player', data);
				mongo.saveRecord('visits' , visit);
			});
		}
	});
}

export function notes({ip, session}, res) {
	let data = {};
	let date = new Date();
	let visit = {ip: ip, date: date.getTime(), user: session.user, page: "notes"};
	data.title = 'Notes', data.user = session.user, data.nav = nav
	mongo.takeNotes(session.user, (err, docs) => {
		if(!docs){res.render('notes', data);}else{
			if(docs){
				data.notes = docs;
				res.render('notes', data);
			}else{
				res.render('notes', data);
			}
		}
	});
	mongo.saveRecord('visits', visit);
}

export function chat({ip, session, params}, res) {
	let now = moment();
	let date = new Date();
	let visit = {ip: ip, date: date.getTime(), user: session.user, page: "chat"};
	let data = {title: 'Chat'};
	if(session.user != null){
		data.user = session.user;
	}
	if(params.room){
		data.room = params.room;
	}
	res.render('chat', data);
	mongo.saveRecord('visits', visit);
}

export function shooter({session, ip}, res) {
  let now = moment();
	res.render('shooter', {title: 'Shooter', user: session.user});
	console.log(`${ip} ${now.format('DD/MM/YYYY HH:mm:ss')} shooter`);
}