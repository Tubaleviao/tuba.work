const { sign, verify } = require("jsonwebtoken")
const path = require('path')
const moment = require('moment')
const mongo = require('./mongo')
const fs = require('fs')
const getSize = require('get-folder-size')
const formidable = require('formidable')

let nav = ["chat", "player", "shooter", "notes", "webcam_face_detection", "hibo"]

exports.rag = (req, res) =>{
  let now = moment();
	res.render('rag', {title: 'Ragnatuba', user: req.session.user});
	console.log(req.ip+" "+now.format('DD/MM/YYYY HH:mm:ss')+' rag');
}

exports.tuba_player_privacy = (req, res) =>{
  let now = moment();
	res.render('tuba_player_privacy', {title: 'tuba_player_privacy', user: req.session.user});
	console.log(req.ip+" "+now.format('DD/MM/YYYY HH:mm:ss')+' tuba_player_privacy');
}

exports.privacy = (req, res) =>{
  let now = moment();
	res.render('privacy', {title: 'Privacy', user: req.session.user});
	console.log(req.ip+" "+now.format('DD/MM/YYYY HH:mm:ss')+' privacy');
}

exports.cookies = (req, res) =>{
  let now = moment();
	res.render('cookies', {title: 'Cookies', user: req.session.user});
	console.log(req.ip+" "+now.format('DD/MM/YYYY HH:mm:ss')+' cookies');
}

exports.talking = (req, res) =>{
  let now = moment();
	res.render('talking', {title: 'Talking', user: req.session.user});
	console.log(req.ip+" "+now.format('DD/MM/YYYY HH:mm:ss')+' talking');
}

exports.default = (req, res) =>{
	let now = moment();
	res.render('default', {title: 'Default', user: req.session.user});
	console.log(req.ip+" "+now.format('DD/MM/YYYY HH:mm:ss')+' default');
}

exports.home = (req, res) => {
  let date = new Date();
	let visit = {ip: req.ip, date: date.getTime(), user: req.session.user};
	let data = {};
	data.visitorCount = await mongo.getUniqueVisitors.bind(req.db)();

	if(req.session.verified || req.session.user){
		data.title = 'Dashboard';
		data.nav = nav;
		data.user = req.session.user;
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
	mongo.saveRecord.bind(req.db)('visits', visit)
}

exports.profile = (req, res) => {
  let date = new Date();
	let visit = {ip: req.ip, date: date.getTime(), user: req.session.user, page: "profile"};
	let data = {};
  data.token = sign({username: req.session.user, email: req.session.email}, process.env.JWT_KEY)
	data.title = 'Profile', data.user = req.session.user
	mongo.getUserInfo.bind(req.db)(req.session.user, (err, resp)=>{
		if(err){console.log(err)}else{
			data.userinfo = resp;
			res.render("profile", data);
			mongo.saveVisit.bind(req.db)(visit)
		}
	})
}

exports.login = (req, res) =>{
  let date = new Date();
	let visit = {ip: req.ip, date: date.getTime(), user: req.session.user};
	
	mongo.existUser.bind(req.db)(req.body.username, exist => {
		if(exist){
			mongo.auth.bind(req.db)(req.body.username, req.body.password, (success) => {
				if(success){
					req.session.user = req.body.username
					req.session.email = exist.email
          req.session.permission = exist.permission||1
					req.session.verified = true
					if(req.body.url == "/login") res.redirect("home")
					else res.redirect(req.body.url)
				}else{
					res.render('home', {title: 'Home', msg: 'Wrong password'})
				}
			})
		}else{
			res.render('home', {title: 'Home', msg: 'User don\'t exists'})
		}
	})
	visit.page = "login"
	mongo.saveRecord.bind(req.db)('visits', visit)
}

exports.logout = (req, res) =>{
  let date = new Date();
	let visit = {ip: req.ip, date: date.getTime(), user: req.session.user, page: "about"};
	req.session.destroy();
	res.redirect('/home');
	mongo.saveRecord.bind(req.db)('visits', visit)
}

exports.signup = (req, res) =>{
  let now = moment()
	mongo.existUser.bind(req.db)(req.body.username, (exist) => {
		if(exist){
			res.render('home', {title: 'home', msg: 'User already exists'});
		}else{
      console.log(req.body.username)
			mongo.addUser.bind(req.db)(req.body.username, req.body.password, req.body.email, (success) => {
				if(success){
					req.session.user = req.body.username;
					req.session.email = req.body.email;
          			res.redirect('/auth?id='+success.ops[0]._id);
				}else{
					res.render('home', {title: 'home', msg: 'User not registered'});
				}
			})
		}
	})
	console.log(req.ip+" "+now.format('DD/MM/YYYY HH:mm:ss')+' sigup');
}

exports.auth = (req, res) =>{
  if(req.query.id){
		mongo.existId.bind(req.db)(req.query.id, record => {
			if(record){
				req.session.verified = true;
				record.verified = true;
				mongo.updateRecord.bind(req.db)('users', {_id: record._id}, record, resp => {
					if(resp){
						let dir = __dirname+'/public/users/'+record.username;
						if (!fs.existsSync(dir)){fs.mkdirSync(dir, { recursive: true });}
						res.redirect('/');
					}
				})
			}
		})
	}else{
		mongo.setEmail.bind(req.db)({user: req.session.user, email: req.query.email}, resp => {
			if(resp){
				otherEmail = true;
				req.session.email = req.query.email;
				mongo.existUser.bind(req.db)(req.session.user, exist => {
					if(exist) res.redirect('/auth?id='+exist._id);
				})
			}
		})
	}
}

exports.dashboard = (req, res) =>{
	let data = {};
	let date = new Date();
	let visit = {ip: req.ip, date: date.getTime(), user: req.session.user};
	data.visitorCount = await mongo.getUniqueVisitors.bind(req.db)();
	
	
	if(req.session.verified || req.session.user){
		data.title = 'Dashboard';
		data.user = req.session.user;
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
	//mongo.saveRecord.bind(req.db)('visits', visit)
}

exports.player = (req, res) =>{
  let dir = __dirname+'/public/users/'+(req.params.user ? req.params.user : req.session.user);
	let date = new Date();
	let data = {};
  data.token = 'none'
	let visit = {ip: req.ip, date: date.getTime(), user: req.session.user, page: "player"};
	
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
        //data.user = req.session.user
        if(req.params.user) data = { ...data, user: req.params.user, owner:false }
        else data = { ...data, user: req.session.user, owner:true } 
        data.permission = req.session.permission||1
        data.token = sign({username: req.session.user, email: req.session.email, permission: data.permission}, process.env.JWT_KEY)
        data.title = 'Player'
				res.render('player', data);
				mongo.saveRecord.bind(req.db)('visits' , visit)
			});
		}
	});
}

exports.notes = (req, res) =>{
	let data = {};
	let date = new Date();
	let visit = {ip: req.ip, date: date.getTime(), user: req.session.user, page: "notes"};
	data.title = 'Notes', data.user = req.session.user, data.nav = nav
	mongo.takeNotes.bind(req.db)(req.session.user, (err, docs) => {
		if(!docs){res.render('notes', data);}else{
			if(docs){
				data.notes = docs;
				res.render('notes', data);
			}else{
				res.render('notes', data);
			}
		}
	})
	mongo.saveRecord.bind(req.db)('visits', visit)
}

exports.chat = (req, res) =>{
	let now = moment();
	let date = new Date();
	let visit = {ip: req.ip, date: date.getTime(), user: req.session.user, page: "chat"};
	let data = {ip: req.ip, title: 'Chat'};
	if(req.session.user != null){
		data.user = req.session.user;
	}else if(req.query.user){
    data.user = 'u'+Math.floor(Math.random()*100000000);
  }
	if(req.params.room){
		data.room = req.params.room;
	}
	res.render('chat', data)
	//mongo.saveRecord.apply( {db:req.db}, ['visits', visit])
	//mongo.saveRecord.call({db:req.db},'visits', visit)
	mongo.saveRecord.bind(req.db)('visits', visit)
}

exports.shooter = (req, res) =>{
  let now = moment();
	res.render('shooter', {title: 'Shooter', user: req.session.user});
	console.log(req.ip+" "+now.format('DD/MM/YYYY HH:mm:ss')+' shooter');
}

// API CODE

exports.songs = async (req, res) => {
  let date = new Date();
	let visit = {ip: req.ip, date: date.getTime(), user: req.me.username, page: "songs"};
  let dir = __dirname+'/public/users/'+req.me.username;
  //let songs = 
      
  if (!fs.existsSync(dir)) {
    res.status(404).send(`User ${req.me.username} has no songs stored in the server!`)
  }else{
    fs.readdir(dir, (err, files) =>{
      if(err) res.send(`Error: ${err}`)
      else {
        const shufle = b => {let a = [...b]; for(let i=a.length-1; i>0; i--){const j = Math.floor(Math.random()*(i+1)); [a[i], a[j]] = [a[j], a[i]];} return a;}
        res.json(shufle(files))
        mongo.saveVisit.bind(req.db)(visit)
      }
    })
  }
}

exports.jwt = (req, res) => {
  let now = moment();
  mongo.auth.bind(req.db)(req.body.username, req.body.password, user => {
    if(user){
      const token = sign({ ...user }, process.env.JWT_KEY);
      res.header("auth-token", token).json({ ok: true, token: token, data: user })
    }else{
      res.json({ok: false, msg: "Check your user or password"})
    }
  })
  console.log(req.ip+" "+now.format('DD/MM/YYYY HH:mm:ss')+' jwt');
}

exports.join = (req, res) =>{
  let now = moment();
	mongo.existUser.bind(req.db)(req.body.username, (exist) => {
		if(exist){
			res.json({ok: false, msg: 'User already exists'});
		}else{
      console.log(req.body.username)
			mongo.addUser.bind(req.db)(req.body.username, req.body.password, req.body.email, (success) => {
				if(success){
          const data = { username: req.body.username, email: req.body.email }
          const token = sign(data, process.env.JWT_KEY);
          res.header("auth-token", token).json({ ok: true, token: token, data: data })
				}else{
					res.json({ok: false, msg: 'Error occurred, user not registered'});
				}
			})
		}
	})
	console.log(req.ip+" "+now.format('DD/MM/YYYY HH:mm:ss')+' join');
}

exports.audio = async (req, res) =>{
  let now = moment();
  const data = verify(req.header('token'), process.env.JWT_KEY)
  if(data.username === req.params.user){
    const p = path.join(__dirname, 'public/users', req.params.user)
    if(!fs.existsSync(p)){
      fs.mkdirSync(p)
    }
    
    const size = () => new Promise((reso, reje) => getSize(p, (err, folder_size) => {
      if (err) console.log(err);
      else reso((folder_size/1024/1024/1024).toFixed(2)) 
    }))
    let dirSize = await size()
    if(dirSize > (data.permission || 1)){
      res.json({ ok: false, msg: `You've reached your limit of ${data.permission||1}GB.` })
    }else{
      const formi = formidable({ keepExtensions: true, uploadDir: p });
      formi.parse(req, (err, fields, files) => {
        if(err) console.log(err)
        //console.log(files)
        let oldn = files.audio.path
        let newn = oldn.substr(0,oldn.lastIndexOf('/')+1)+files.audio.name
        fs.renameSync(oldn, newn)
        res.json({ ok: true, song: files.audio.name })
      })
    }
  }else res.json({ ok: false, msg: "You must to be authenticated to upload" })
	console.log(req.ip+" "+now.format('DD/MM/YYYY HH:mm:ss')+' audio');
}

exports.cp = async (req,res) => {
  let now = moment()
  const data = verify(req.body.token, process.env.JWT_KEY)
  if(data.username === req.body.user){
    let np = req.body.password.trim()
    if(np != ""){
      let worked = await mongo.setPassword.bind(req.db)(req.body.user, np)
      res.json({success: worked, msg: 'Password set!'})
    }else res.json({success: false, msg: 'Password cannot be empty!'})
  }else res.json({success: false, msg: 'You should be the same user!'})
}

