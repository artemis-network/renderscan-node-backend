FROM nikolaik/python-nodejs:latest

RUN pip install PILLOW

WORKDIR /app

COPY tsconfig.json ./
COPY package.json ./

RUN npm install 

COPY src ./src
RUN npm run build



EXPOSE 5001
EXPOSE 587

CMD ["npm","start"]