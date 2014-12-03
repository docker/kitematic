![Kitematic Logo](https://cloud.githubusercontent.com/assets/251292/5269258/1b229c3c-7a2f-11e4-96f1-e7baf3c86d73.png)

Kitematic is a simple application for managing Docker containers on Mac OS X.

## Installing Kitematic

[Download the latest version](https://kitematic.com/download) of Kitematic.

## Documentation

Kitematic's documentation and other information can be found at [http://kitematic.com/docs](http://kitematic.com/docs).

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

- Remove VirtualBox
```bash
# remove app data
rm -rf ~/Library/Application\ Support/Kitematic
```

## Bugs and Feature Requests

Have a bug or a feature request? Please first read the [Issue Guidelines](https://github.com/kitematic/kitematic/blob/master/CONTRIBUTING.md#using-the-issue-tracker) and search for existing and closed issues. If your problem or idea is not addressed yet, [please open a new issue](https://github.com/kitematic/kitematic/issues/new).

## Contributing

Please read through our [Contributing Guidelines](https://github.com/kitematic/kitematic/blob/master/CONTRIBUTING.md). Included are directions for opening issues, coding standards, and notes on development.

## Community

Keep track of development and community news.

- Follow [@kitematic on Twitter](https://twitter.com/kitematic).
- Read and subscribe to [The Official Kitematic Blog](http://blog.kitematic.com).
- Chat with developers using Kitematic in our [HipChat room](http://www.hipchat.com/giAT9Fqb5).

## Versioning

For transparency into our release cycle and in striving to maintain backward compatibility, Kitematic is maintained under the [Semantic Versioning Guidelines](http://semver.org/). We'll try very hard to adhere to those rules whenever possible.

## Copyright and License

Code released under the [AGPL license](LICENSE).
