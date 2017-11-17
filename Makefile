.PHONY: docs docs-shell docs-build run

VERSION := $(shell jq -r '.version' package.json)

# TODO: clearly need to note pre-req's - OSX and node installed? - see contributing docs

install:
	npm install

run: install
	npm start

release: install
	npm install electron-packager
	npm run release
	mv release/Kitematic-Mac.zip release/Kitematic-$(VERSION)-Mac.zip
	mv release/Kitematic-Ubuntu.zip release/Kitematic-$(VERSION)-Ubuntu.zip
	mv release/Kitematic-Windows.zip release/Kitematic-$(VERSION)-Windows.zip

#zip:
#	docker container run --rm -it -w /to_zip -v $(PWD)/dist/Kitematic\ \(Beta\)-darwin-x64:/to_zip -v $(PWD)/dist:/out kramos/alpine-zip -r /out/Kitematic-$(VERSION)-Mac.zip .

clean:
	-rm .DS_Store
	-rm -Rf build/
	-rm -Rf dist/
	-rm -Rf release/
	-rm -Rf node_modules/


# Get the IP ADDRESS
DOCKER_IP=$(shell python -c "import urlparse ; print urlparse.urlparse('$(DOCKER_HOST)').hostname or ''")
HUGO_BASE_URL=$(shell test -z "$(DOCKER_IP)" && echo localhost || echo "$(DOCKER_IP)")
HUGO_BIND_IP=0.0.0.0

# import the existing docs build cmds from docker/docker
DOCS_MOUNT := $(if $(DOCSDIR),-v $(CURDIR)/$(DOCSDIR):/$(DOCSDIR))
DOCSPORT := 8000
GIT_BRANCH := $(shell git rev-parse --abbrev-ref HEAD 2>/dev/null)
DOCKER_DOCS_IMAGE := kitematic-docs$(if $(GIT_BRANCH),:$(GIT_BRANCH))
DOCKER_RUN_DOCS := docker run --rm -it $(DOCS_MOUNT)

docs: docs-build
	$(DOCKER_RUN_DOCS) -p $(if $(DOCSPORT),$(DOCSPORT):)8000 "$(DOCKER_DOCS_IMAGE)"  \
		hugo server \
			--port=$(DOCSPORT) --baseUrl=$(HUGO_BASE_URL) --bind=$(HUGO_BIND_IP)

docs-shell: docs-build
	$(DOCKER_RUN_DOCS) -p $(if $(DOCSPORT),$(DOCSPORT):)8000 "$(DOCKER_DOCS_IMAGE)" bash

docs-build:
	docker build -t "$(DOCKER_DOCS_IMAGE)" -f docs/Dockerfile .

