# per https://github.com/node-gfx/node-canvas-prebuilt/issues/77#issuecomment-1975794256
FROM node:20-alpine AS build
RUN apk add --no-cache make gcc g++ python3 pkgconfig pixman-dev cairo-dev pango-dev libjpeg-turbo-dev
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
# Copy over src/other files
COPY ./src ./src
COPY ./fonts ./fonts
COPY ./images ./images
COPY ./wiki ./wiki
# Build the project, then re-install only runtime dependencies
RUN npm run build \ 
    && npm ci --omit=dev
# - - - FRESH BUILD STAGE - - -
FROM node:20-alpine as deploy
## These are runtime dependencies required by node-canvas
RUN apk add --no-cache cairo pango libjpeg-turbo
WORKDIR /home/node/app
# Set user 'node' as the owner for all copied files
COPY --chown=node:node --from=build /app/build ./build
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node package*.json *.config.js ./
COPY --chown=node:node --from=build /app/fonts ./fonts
COPY --chown=node:node --from=build /app/images ./images
COPY --chown=node:node --from=build /app/wiki ./wiki
# Set 'node' as owner of this directory (permits creating files eg. logs)
RUN chown -h node:node .
USER node
# Start the application
CMD ["node", "build/src/index.js"]
