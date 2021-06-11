### :warning: Deprecation Notice: This project and repository is now deprecated and is no longer under active development, see [the related roadmap issue](https://github.com/docker/roadmap/issues/67). Please use [Docker Desktop](https://www.docker.com/products/docker-desktop) instead where possible.

[![Build Status](https://travis-ci.org/docker/kitematic.svg?branch=master)](https://travis-ci.org/docker/kitematic)


[![Kitematic Logo](https://cloud.githubusercontent.com/assets/251292/5269258/1b229c3c-7a2f-11e4-96f1-e7baf3c86d73.png)](https://kitematic.com)

Please give us feedback on the new [Docker Desktop Dashboard](https://docs.docker.com/docker-for-mac/edge-release-notes/)!

In the latest Edge release of Docker Desktop we have introduced the new [Docker Desktop Dashboard](https://docs.docker.com/docker-for-mac/edge-release-notes/). As part of this, Docker is working on providing a common user experience to developers and bringing the best Kitematic features to its Desktop customers. 

As a result, we plan on achieving feature parity and archiving the Docker Kitematic Project during 2020. After we archive the Kitematic Project there will be no new releases of Kitematic. 



![Kitematic Screenshot](https://cloud.githubusercontent.com/assets/251292/8246120/d3ab271a-15ed-11e5-8736-9a730a27c79a.png)

Kitematic is a simple application for managing Docker containers on Mac, Linux and Windows.


## Installing Kitematic

[Download the latest version](https://github.com/docker/kitematic/releases) of Kitematic via the github release page.

## Documentation

Kitematic's documentation and other information can be found at [http://kitematic.com/docs](http://kitematic.com/docs).

## Security Disclosure

Security is very important to us. If you have any issue regarding security, please disclose the information responsibly by sending an email to security@docker.com and not by creating a github issue.


## Archive FAQ

**Why are you archiving Kitematic?**
We are learning from  the capabilities in Kitematic and incorporating them into a common developer User experience and benefit all Docker Desktop users.

**When will this happen?**
Once we have reached feature parity and provided the most important capabilities from the existing Kitematic UI. We aim to achieve this and then to archive Kitematic in 2020. 

**What can I do if the new UI doesn't support something I need?**
Tell us! Please add requests on the Kitematic repo. We need you to tell us what features you use so we can bring them across into the new UI.  We are very interested in your feedback starting with the Edge release.


## Bugs and Feature Requests

Have a bug? Please first read the [Issue Guidelines](https://github.com/kitematic/kitematic/blob/master/CONTRIBUTING.md#using-the-issue-tracker) and search for existing and closed issues. 

If your idea is not in the new UI, [please open a new issue](https://github.com/kitematic/kitematic/issues/new).


If your problem is not addressed yet, [please open a new issue](https://github.com/kitematic/kitematic/issues/new).


## Community


- Ask questions on our [user forum](https://forums.docker.com/c/open-source-projects/kitematic).
- Follow [@Docker on Twitter](https://twitter.com/docker).

## Uninstalling

**Mac**

- Remove Kitematic.app
- Remove any unwanted Virtual Machines in VirtualBox
```bash
# remove app data
rm -rf ~/Library/Application\ Support/Kitematic
```

**Windows**

Open `Programs and Features` from `Control Panel`

- Uninstall Kitematic
- Uninstall Oracle VM VirtualBox

## Copyright and License

Code released under the [Apache license](LICENSE).
Images are copyrighted by [Docker, Inc](https://www.docker.com/).
