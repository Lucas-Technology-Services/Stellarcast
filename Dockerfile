
FROM node:latest


WORKDIR /app


COPY package.json ./
COPY package-lock.json ./


RUN npm install


COPY . .
ENV CLIENT_ID_1="" \
    SECRET_1="" \
    PODCAST_BSE_URL="" \
    API_URL="" \
    JWT_SECRET="" \
    PORT=3000 \
    DB_HOST="" \
    DB_NAME="" \
    DB_PASSWORD="" \
    DB_USER="" \
    DB_PORT="" \
    DB_TIMEZONE="" \
    PLATFORM_BASE_URL="" \
    PLAYER_TOKEN_SECRET="" \
    RABBITMQ_API_PASSWORD="" \
    RABBITMQ_API_USERNAME="" \
    RABBITMQ_BASE_URL="" \
    RABBITMQ_CLOUD_URL="" \
    RABBITMQ_VHOST="" \
    SWAGGER_PASSWORD="" \
    SWAGGER_USER="" \
    MINIO_ENDPOINT="" \
    MINIO_ACCESS_KEY="" \
    MINIO_SECRET_KEY="" \
    MINIO_BUCKET_NAME="" 


RUN npm run build


EXPOSE 3000


CMD ["npm", "start"]
