FROM ubuntu:14.04
MAINTAINER Kite <contact@usekite.com>

RUN apt-get update
RUN apt-get install -q -y dnsmasq wget psmisc

RUN mkdir /app
WORKDIR /app
RUN wget https://github.com/jwilder/docker-gen/releases/download/0.3.2/docker-gen-linux-amd64-0.3.2.tar.gz
RUN tar xvzf docker-gen-linux-amd64-0.3.2.tar.gz
RUN rm docker-gen-linux-amd64-0.3.2.tar.gz

ADD . /app

ENV DOCKER_HOST unix:///tmp/docker.sock

EXPOSE 53/udp
CMD ["sh", "/app/start"]