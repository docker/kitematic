FROM docs/base:latest
MAINTAINER Sven Dowideit <SvenDowideit@docker.com> (@SvenDowideit)

# to get the git info for this repo
COPY . /src

# Reset the /docs dir so we can replace the theme meta with the new repo's git info
#RUN git reset --hard

RUN grep '"version"' /src/package.json  | sed 's/.*"version": "\(.*\)".*/\1/' > /docs/VERSION
COPY docs/* /docs/sources/kitematic/
# sadly, COPY is only recursive if you don't also need to name the destination
COPY docs/assets/ /docs/sources/kitematic/assets/
COPY docs/mkdocs.yml /docs/mkdocs-dhe.yml

# Then build everything together, ready for mkdocs
RUN /docs/build.sh
