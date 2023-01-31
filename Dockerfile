FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm ci && npm cache clean --force

# Bundle app source
COPY server.js server.js

CMD [ "node", "server.js" ]
