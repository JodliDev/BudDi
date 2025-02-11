# syntax=docker/dockerfile:1
ARG NODE_VERSION=20.17.0


FROM node:${NODE_VERSION}-alpine as build

RUN mkdir -p /buddi
WORKDIR /buddi

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .
RUN npm run build_production

RUN touch ./dist/frontend/options.js


FROM node:${NODE_VERSION}-alpine as main
ENV NODE_ENV production

COPY --from=build /buddi/dist /buddi/dist
COPY --from=build /buddi/package.json /buddi/package.json
COPY --from=build /buddi/docker-entrypoint.sh /buddi/docker-entrypoint.sh

# Only needed for better exception messages in run_production:
COPY --from=build /buddi/src/backend /buddi/src/backend

# Only needed for better exception messages in run_production:
COPY --from=build /buddi/src/shared /buddi/src/shared

WORKDIR /buddi


RUN --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev && chown -R node:node ./dist/config && chown node:node ./dist/frontend/options.js

#USER node

VOLUME ./dist/buddi/config/
EXPOSE 1304

# Run the application.
#CMD npm run run_production
ENTRYPOINT ["/bin/sh", "docker-entrypoint.sh"]
CMD ["npm run run_production"]
