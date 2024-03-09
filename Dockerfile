FROM node:16-alpine3.16 as base
WORKDIR /app

# Copy files for npm install and TS compile
COPY package*.json tsconfig.json ./
RUN npm ci --quiet

COPY ./src ./src

# Build stage > build project, remove deps and install runtime deps
FROM base AS build
WORKDIR /app

RUN npm run build \ 
    && rm -rf node_modules \
    && npm ci --omit=dev

# Deploy stage > copy runtime files, copy build files (prev. stage), install runtime deps
FROM node:20-alpine3.18 as deploy
WORKDIR /home/node/app

# - - - FRESH BUILD STAGE - - -
FROM node:16-alpine3.16 as deploy
WORKDIR /home/node/app

# Set user 'node' as the owner for all copied files
COPY --chown=node:node --from=build /app/build ./build
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node package*.json *.config.js ./

# Set 'node' as owner of this directory (permits creating files eg. logs)
RUN chown -h node:node .
USER node

USER node
# Start the application
CMD ["node", "build/src/index.js"]
