FROM node:20-alpine AS development

WORKDIR /usr/src/app

COPY  package*.json ./
COPY  tsconfig.json tsconfig.build.json
RUN npm ci

COPY src ./src

FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

COPY --from=development /usr/src/app/node_modules ./node_modules

COPY . .

RUN npm run build

ENV NODE_ENV=production

RUN npm ci --omit=dev && npm cache clean --force

FROM node:20-alpine AS production

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

CMD [ "node", "dist/main.js" ]