FROM node:10
RUN mkdir /home/tuba /home/tuba/nodejs /home/tuba/nodejs/tuba.work
WORKDIR /home/tuba/nodejs/tuba.work
RUN git clone https://github.com/tubaleviao/tuba.work .
RUN echo $'PROD=\nPORT=3000\nSESSION_SECRET="some secret words"\nMONGO_HOST=void-wfsmn.mongodb.net\n\
MONGO_USER=alvro\nMONGO_PASS=thisissecret\nMONGO_PORT=27017\nMONGO_DB=test\n\
MONGO_PROTOCOL="mongodb+srv"\nMONGO_OPTIONS="?retryWrites=true&w=majority"\n\
JWT_KEY="some other secret words"\n' > .env 
RUN npm install \
&& npm run build
EXPOSE 80
EXPOSE 443
EXPOSE 3000
CMD ["npm", "start"]