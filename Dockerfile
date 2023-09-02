FROM node:18

COPY package.json .
COPY index.js .
COPY index.js.map .
COPY index.ts .
COPY node_modules ./node_modules
COPY imports ./imports

RUN apt-get update
RUN apt-get install ffmpeg -y

ENTRYPOINT ["node", "index.js"]
