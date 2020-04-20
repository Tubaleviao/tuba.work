const { verify } = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const [type, token] = req.headers.authorization.split(" ");
    let json = verify(token, process.env.JWT_KEY);
    req.me = json;
    next();
  } catch (err) {
    next({ msg: "token not valid", error: err });
  }
}

const crossOrigin = (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  console.log(req.body)
  next();
}

module.exports = { auth, crossOrigin };
