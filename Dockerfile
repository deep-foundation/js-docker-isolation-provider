FROM node:16.18

COPY package.json .
COPY index.js .
COPY index.js.map .
COPY index.ts .
COPY node_modules ./node_modules
COPY imports ./imports
COPY key.json .

ENTRYPOINT ["node", "index.js"]
