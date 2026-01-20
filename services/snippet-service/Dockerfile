FROM node:20-alpine AS common-builder

WORKDIR /common-src
COPY services/common/src ./src
COPY services/common/package*.json ./
RUN cd /common-src && npm install --production && mkdir -p /common/src && cp -r src/* /common/src/ && cp package*.json /common/ && cp -r node_modules /common/

FROM node:20-alpine

WORKDIR /app

# Copy service package and install
COPY services/snippet-service/package*.json ./
RUN npm install --production

# Copy service source
COPY services/snippet-service/src ./src

# Copy common package to service
COPY --from=common-builder /common /common
COPY protos /protos

EXPOSE 3004

CMD ["npm", "start"]
