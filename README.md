# tuba.work
This is an open website for you to develop useful (or not useful) tools

## how to use
Go to https://tuba.work

## how to run

### with docker

```
docker build -t baloon https://github.com/tubaleviao/tuba.work.git
docker run -d -p 3000:3000/tcp --name tw baloon
```

### with node

Before you run, you may need to create a .env file with your environment variables:

```
PROD=
PORT=3000
SESSION_SECRET="some secret words"
MONGO_HOST=void-wfsmn.mongodb.net
MONGO_USER=alvro
MONGO_PASS=thisissecret
MONGO_PORT=27017
MONGO_DB=test
MONGO_PROTOCOL="mongodb+srv"
MONGO_OPTIONS="?retryWrites=true&w=majority"
JWT_KEY="some other secret words"
```

OBS: The database above is not the same as production, it was created just for testing purposes.

After creating the .env file, just run the application:

```
npm install
npm start
```

## how to change the original website

Just make a pull request

:beer:
