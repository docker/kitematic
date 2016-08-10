FROM docs/base:oss
MAINTAINER Docker Docs <docs@docker.com>

ENV PROJECT=kitematic
# To get the git info for this repo
COPY . /src
RUN rm -rf /docs/content/$PROJECT/
COPY . /docs/content/$PROJECT/
