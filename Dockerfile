FROM nikolaik/python-nodejs:latest

ENV NODE_OPTIONS=--max_old_space_size=1024

RUN pip install Pillow==9.0.0

WORKDIR /app

COPY tsconfig.json ./
COPY package.json ./

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true    
RUN apt-get update && apt-get install curl gnupg -y \
  && curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install google-chrome-stable -y --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*
RUN npm install 

COPY src ./src
COPY slugs ./slugs
RUN npm run build



EXPOSE 5001
EXPOSE 587

CMD ["npm","start"]
