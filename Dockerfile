FROM nginx:alpine

COPY ./nginx.default.conf /etc/nginx/conf.d/default.conf
COPY dist/graph-editor /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
