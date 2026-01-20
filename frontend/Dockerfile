FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
