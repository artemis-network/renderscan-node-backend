FROM nikolaik/python-nodejs:latest

ENV NODE_OPTIONS=--max_old_space_size=1024

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