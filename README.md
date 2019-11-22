# tuba.work
This is an open website for you to develop useful (or not useful) tools

## how to use
Go to https://tuba.work

## how to run

Before you run, you may need to create a .env file with your environment variables:

```
PROD=true
PORT=443
SESSION_SECRET="some secret words"
MONGO_USER=yourDbUSer
MONGO_PASS=yourDbPass
MONGO_PORT=yourDbPort
CERT_KEY="you/certificate/privatekey/path.pem"
CERT_CERT="/your/certificate/fullchain/path.pem"
```

OBS: if you don't have a certificate, just be sure to set PROD to false and change the port

After configurating the .env file, just run the application:

```
npm install
sudo node app.js
```

## how to change the original website

Just make a pull request

:beer:
