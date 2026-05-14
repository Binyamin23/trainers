FROM node:18.20.3-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --chown=1001 --from=builder /app/build /site
COPY --from=builder /app/deploy/nginx.conf /etc/nginx/nginx.conf

RUN chmod -R 777 /site

USER 1001

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]


# netstat -ao | findstr 4000
# taskkill /PID $ID /F

