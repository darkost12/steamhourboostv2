FROM node:18

ADD https://github.com/darkost12/steamhourboostv2/archive/refs/heads/main.zip .

RUN set -ex ;\
  apt-get update ;\
  apt-get install unzip ;\
  unzip main.zip

WORKDIR /steamhourboostv2-main

RUN set -ex ;\
  yarn install

ENV HOME=/steamhourboostv2-main/config

CMD yarn run start
