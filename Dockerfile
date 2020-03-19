FROM alpine:3.11

RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      freetype-dev \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      nodejs \
      yarn \
      npm

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN yarn add puppeteer@2.1.1

RUN addgroup -S pptruser && adduser -S -g pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads /app \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

USER pptruser

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

CMD [ "node", "src/main.js" ]