FROM node:20-alpine3.18 as build
WORKDIR /app
# Copy files for npm install and TS compile
COPY package*.json tsconfig.json ./
# Copy Prisma src files needed to generate the Prisma client
COPY prisma/schema.prisma ./prisma/schema.prisma
# Install dependencies
RUN npm install
# Copy src files after installing deps -- allows deps caching if they're unchanged
COPY ./src ./src
# Compile TS, remove node_modules folder, then install without dev deps
RUN npm run build \
    && rm -rf node_modules \
    && npm ci --omit-dev

# - - - FRESH BUILD STAGE - - -
FROM node:20-alpine3.18 as deploy
WORKDIR /home/node/app
# Copy runtime files with perms for user 'node' (included in node docker image)
COPY --chown=node:node --from=build /app/build ./build
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node package*.json *.config.js ./
COPY --chown=node:node prisma ./prisma/
RUN chown -h node:node .
# Run npm start as user 'node'
USER node
CMD [ "npm", "start" ]