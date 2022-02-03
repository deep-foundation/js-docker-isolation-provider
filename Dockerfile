FROM node:14.15-stretch

COPY package.json .
COPY index.js .
COPY index.js.map .
COPY index.ts .
COPY node_modules ./node_modules
COPY imports ./imports

EXPOSE 3020
ENTRYPOINT ["node", "index.js"]
