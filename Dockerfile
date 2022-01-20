FROM node:16-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn --fronzen-lockfile

COPY . .
RUN yarn build

ENTRYPOINT [ "/app/dist/index.js" ]