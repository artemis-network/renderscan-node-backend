FROM node:16

WORKDIR /app

COPY tsconfig.json ./
COPY package.json ./

RUN npm install 

COPY src ./src
RUN npm run build

EXPOSE 7000
EXPOSE 587

CMD ["npm","start"]