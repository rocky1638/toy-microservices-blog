FROM node:16-alpine

# so react app runs in docker container
ENV CI=true
ENV WDS_SOCKET_PORT=0

WORKDIR /app
COPY ./package.json ./
RUN npm install
COPY ./ ./

CMD ["npm", "start"]