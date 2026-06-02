FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./

# Intentamos primero el registry oficial de npm (que tiene todos los paquetes,
# incluidos los del scope @stomp). Si falla por red, caemos al espejo
# npmmirror como red de seguridad.
RUN npm install --no-audit --no-fund --loglevel=error \
 || (echo "npm registry oficial falló, probando npmmirror..." \
     && npm config set registry https://registry.npmmirror.com \
     && npm install --no-audit --no-fund --loglevel=error)

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80