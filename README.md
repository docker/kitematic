[![Build Status](https://travis-ci.org/docker/kitematic.svg?branch=master)](https://travis-ci.org/docker/kitematic)


[![Kitematic Logo](https://cloud.githubusercontent.com/assets/251292/5269258/1b229c3c-7a2f-11e4-96f1-e7baf3c86d73.png)](https://kitematic.com)

With the release of the new [Docker Desktop Dashboard](https://) Docker will be bringing the best Kitematic features straight to it’s Desktop customers. 

As a result the Docker Kitematic Project will be archived in the first half of 2020, after this date there will be no new releases made of the Kitematic product. 


![Kitematic Screenshot](https://cloud.githubusercontent.com/assets/251292/8246120/d3ab271a-15ed-11e5-8736-9a730a27c79a.png)

Kitematic is a simple application for managing Docker containers on Mac, Linux and Windows.


## Installing Kitematic

[Download the latest version](https://github.com/docker/kitematic/releases) of Kitematic via the github release page.

## Documentation

Kitematic's documentation and other information can be found at [http://kitematic.com/docs](http://kitematic.com/docs).

## Security Disclosure

Security is very important to us. If you have any issue regarding security, please disclose the information responsibly by sending an email to security@docker.com and not by creating a github issue.


## Deprecation FAQ

**Why are you archiving Kitematic?**
We are introducing a new integrated Desktop dashboard and experience that will incorporate the ideas and most of the capabilities of Kitematic into one common UX. 
We are taking the good ideas from Kitematic and incorporating them into a new developer UX that provides a future as part of Docker Desktop.

**When will this happen?**
We plan to deprecate and archive Kitematic in mid 2020 once we have provided the most important features from the existing Kitematic UI. 

**Does this mean I can't use it after the archive date?**
You can continue to use Kitematic but Docker will no longer be making any security updates to the product after this point, nor adding any new features. 
Until this date we will continue to provide critical security fixes on Kitematic. 

**What can I do if the new UI doesn't support something I need?**
Tell us! Please add requests on the Kitematic repo. We need you to tell us what features you use so we can bring them across into the new UI. 


**I want to keep using Kitematic, can't I maintain the repo?**
You are welcome to fork the repo and use the codebase! 
However, the Kitematic brand remains part of Docker so we would ask that you do not use this as any part of the new tools you build. 


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
