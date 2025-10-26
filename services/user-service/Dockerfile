FROM node:18-alpine

WORKDIR /usr/
COPY package*.json ./
COPY . .
RUN npm i
RUN npm run build

EXPOSE 4001
CMD ["node", "dist/server.js"]