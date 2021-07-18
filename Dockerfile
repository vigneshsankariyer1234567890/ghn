FROM node:14

# Runs python language dependencies
RUN apt-get update || : && apt-get install python3 -y
RUN apt install --upgrade python3-pip

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package.json ./
COPY yarn.lock ./
COPY requirements.txt ./

RUN yarn

COPY . .
COPY .env.production .env

RUN yarn build
RUN pip install -r requirements.txt

ENV NODE_ENV production

EXPOSE 8080
CMD [ "node", "dist/index.js" ]
USER node