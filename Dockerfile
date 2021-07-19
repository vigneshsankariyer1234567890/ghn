FROM nikolaik/python-nodejs:python3.9-nodejs14
WORKDIR /usr/src/app
COPY requirements.txt ./
RUN pip3 install --user -r ./requirements.txt

COPY package.json ./
COPY yarn.lock ./
RUN yarn
COPY . .
COPY .env.production .env
RUN yarn build
ENV NODE_ENV production
EXPOSE 8080
CMD [ "node", "dist/index.js" ]
# USER node