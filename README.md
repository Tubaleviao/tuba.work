# tuba.work
This is an open website for you to develop useful (or not useful) tools

## how to use
Go to https://tuba.work

## how to run

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
```

OBS: The database above is not the same as production, it was created just for testing purposes.

After configurating the .env file, just run the application:

```
npm install
node app.js
```

## how to change the original website

Just make a pull request

:beer:
