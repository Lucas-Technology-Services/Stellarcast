
FROM node:latest


WORKDIR /app


COPY package.json ./
COPY package-lock.json ./


RUN npm install


COPY . .
ENV CLIENT_ID_1="" \
    SECRET_1="" \
    PODCAST_BSE_URL="" \
    JWT_SECRET="" \
    PORT=3000

RUN npm run build


EXPOSE 3000


CMD ["npm", "start"]