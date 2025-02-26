FROM node:20.18.0-alpine

ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV
RUN echo "NODE_ENV=${NODE_ENV}"
RUN apk add --update python3 py3-pip

# Adding python to the container
RUN apk add --update python3 py3-pip

# End of Node canvas dependencies

WORKDIR /tc-service-user-manage

# RUN npm config set unsafe-perm true

# Bundle APP files
COPY . .


# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn

# Adding pm2 to the server
RUN npm install -g pm2
# RUN npm ci
RUN npm install

RUN npm run build

#https://www.freecodecamp.org/news/you-should-never-ever-run-directly-against-node-js-in-production-maybe-7fdfaed51ec6/
# command to start server
CMD ["pm2-runtime", "start", "pm2.json", "--env", "$NODE_ENV"]
