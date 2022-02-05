FROM node:14.15-stretch

COPY package.json .
COPY index.js .
COPY index.js.map .
COPY index.ts .
COPY node_modules ./node_modules
COPY imports ./imports

ENTRYPOINT ["node", "index.js"]
