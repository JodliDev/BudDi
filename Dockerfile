# syntax=docker/dockerfile:1
ARG NODE_VERSION=20.17.0


FROM node:${NODE_VERSION}-alpine as build

RUN mkdir -p /budgetSpender
WORKDIR /budgetSpender

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .
RUN npm run build_production

RUN touch ./dist/frontend/options.js


FROM node:${NODE_VERSION}-alpine as main
ENV NODE_ENV production

COPY --from=build /budgetSpender/dist /budgetSpender/dist
COPY --from=build /budgetSpender/package.json /budgetSpender/package.json
COPY --from=build /budgetSpender/docker-entrypoint.sh /budgetSpender/docker-entrypoint.sh

# Only needed for better exception messages in run_production:
COPY --from=build /budgetSpender/src/backend /budgetSpender/src/backend

# Only needed for better exception messages in run_production:
COPY --from=build /budgetSpender/src/shared /budgetSpender/src/shared

WORKDIR /budgetSpender


RUN --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev && chown -R node:node ./dist/config && chown node:node ./dist/frontend/options.js

#USER node

VOLUME ./dist/config/
EXPOSE 1304
EXPOSE 13040

# Run the application.
#CMD npm run run_production
ENTRYPOINT ["/bin/sh", "docker-entrypoint.sh"]
CMD ["npm run run_production"]
