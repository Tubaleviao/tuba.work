import { verify } from "jsonwebtoken";
const mc = require('mongodb').MongoClient;
let db;
const url = `${process.env.MONGO_PROTOCOL
              }://${process.env.MONGO_USER
              }:${process.env.MONGO_PASS
              }@${process.env.MONGO_HOST
              }/${process.env.MONGO_DB
              }${process.env.MONGO_OPTIONS}`;
const client = new mc(url, {useNewUrlParser: true, useUnifiedTopology: true,});

const auth = (req, res, next) => {
  try {
    const {token} = req.headers
    let json = verify(token, process.env.JWT_KEY);
    req.me = json;
    next();
  } catch (err) {
    next({ msg: "token not valid", error: err });
  }
}

const mongo = async (req, res, next) => {
  if(!db){
    try{
      const mdb = await client.connect()
      db = mdb.db(process.env.MONGO_DB)
    }
    catch(e){next({msg: "db error", error: e})}
  }
  req.db = db
  next()
}

const connect = async () => {
  if(!db){
    try{
      const mdb = await client.connect()
      db = mdb.db(process.env.MONGO_DB)
    }
    catch(e){console.error(e)}
  }
  return db
}

const crossOrigin = (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  console.log(req.body)
  next();
}

module.exports = { connect, auth, crossOrigin, mongo };
