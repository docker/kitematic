# [Kitematic](https://kitematic.com)

**Note:** If the installer gets stuck at any step for more than 1 minute, there is probably an error. Please help us troubleshoot by running it from the command line, and submit the logs to [contact@kitematic.com](mailto:contact@kitematic.com).

1. `cd <dir with Kitematic.app>`
2. Run `./Kitematic.app/Contents/MacOS/node-webkit` 

Kitematic is still in Beta. Any effort in helping us find issues and improving the experience is greatly appreciated!

[Fixes for Known Issues](http://kitematic.com/docs/known-issue-fixes)

![Kitematic Screenshot](https://s3.amazonaws.com/kite-installer/screenshot.5843.png)

## Table of Contents

 - [Development](#development)
 - [Bugs and Feature Requests](#bugs-and-feature-requests)
 - [Documentation](#documentation)
 - [Contributing](#contributing)
 - [Community](#community)
 - [Versioning](#versioning)
 - [Creators](#creators)
 - [Copyright and License](#copyright-and-license)

## Development

- Install any version of Node.js
- Install meteor.js `curl https://install.meteor.com/ | sh`.
- Install meteorite `npm install meteorite -g`
- Install demeteorizer `npm install demeteorizer -g`
- Run ./script/setup.sh to download the binary requirements (things like virtualbox).

### Running the development Server

- ./script/run.sh

### Building the Mac OS X Package

- ./script/bundle.sh  # Generates the app bundle under ./bundle
- ./script/dist.sh    # Generates the app under ./dist./osx/Kitematic.app

## Uninstalling

(This will improve over time.)

- Remove VirtualBox
- rm /usr/local/bin/boot2docker
- sudo route delete -net 172.17.0.0 -netmask 255.255.0.0 -gateway 192.168.60.103 (disable routing to containers through VM)
- rm -rf ~/Library/Application\ Support/Kitematic (remove app data)
- rm /Library/LaunchAgents/com.kitematic.route.plist (remove launch job that sets up routing to the containers)

## Bugs and Feature Requests

Have a bug or a feature request? Please first read the [Issue Guidelines](https://github.com/kitematic/kitematic/blob/master/CONTRIBUTING.md#using-the-issue-tracker) and search for existing and closed issues. If your problem or idea is not addressed yet, [please open a new issue](https://github.com/kitematic/kitematic/issues/new).

## Documentation

Kitematic's documentation and other information can be found at [http://kitematic.com/docs](http://kitematic.com/docs).

## Contributing

Please read through our [Contributing Guidelines](https://github.com/kitematic/kitematic/blob/master/CONTRIBUTING.md). Included are directions for opening issues, coding standards, and notes on development.

Development [Roadmap](https://trello.com/b/xea5AHRk/kitematic-roadmap) can be found on our Trello board.

## Community

Keep track of development and community news.

- Follow [@kitematic on Twitter](https://twitter.com/kitematic).
- Check out Kitematic's [Roadmap](https://trello.com/b/xea5AHRk/kite-roadmap) on our Trello board.
- Read and subscribe to [The Official Kitematic Blog](https://kitematic.com/blog).
- Chat with developers using Kitematic in our [HipChat room](http://www.hipchat.com/giAT9Fqb5).

## Versioning

For transparency into our release cycle and in striving to maintain backward compatibility, Kitematic is maintained under the [Semantic Versioning Guidelines](http://semver.org/). We'll try very hard to adhere to those rules whenever possible.

## Creators

Team E-mail: [contact@kitematic.com](mailto:contact@kitematic.com)

**Sean Li**

- <https://twitter.com/lisean106>
- <https://github.com/Elesant>
- Email: [sean@kitematic.com](mailto:sean@kitematic.com)
- [LinkedIn](https://www.linkedin.com/in/lishang)

**Jeffrey Morgan**

- <https://twitter.com/jmorgan>
- <https://github.com/jeffdm>
- Email: [jeff@kitematic.com](mailto:jeff@kitematic.com)
- [LinkedIn](https://www.linkedin.com/in/jeffdmorgan)

**Michael Chiang**

- <https://twitter.com/mchiang0610>
- <https://github.com/mk101>
- Email: [mike@kitematic.com](mailto:mike@kitematic.com)
- [LinkedIn](https://www.linkedin.com/in/mchiang0610)

## Copyright and License

Code released under the [AGPL license](LICENSE).
