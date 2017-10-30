# Contributing to Kitematic

Thanks for contributing and supporting the Kitematic project!

Before you file an issue or a pull request, read the following tips on how to keep development of the project awesome for all of the contributors:

## Table of Contents

 - [Mac Prerequisites](#prerequisites-for-developing-kitematic-on-mac)
 - [Windows Prerequisites](#prerequisites-for-developing-kitematic-on-windows)
 - [Getting Started](#getting-started)
 - [Architecture](#architecture)
 - [GitHub Issues](#github-issues)
 - [Pull Requests](#pull-requests)
 - [Code Guidelines](#code-guidelines)
 - [Testing](#testing)
 - [License](#license)


### Prerequisites for developing Kitematic on Mac
You will need to install:
- The [Docker Toolbox](https://docker.com/toolbox)
- [Node.js](https://nodejs.org/)
- Wine `brew install wine` (only if you want to generate a Windows release on OS X)
- The latest Xcode from the Apple App Store.

### Prerequisites for developing Kitematic on Windows
You will need to install:
- The [Docker Toolbox](https://docker.com/toolbox)
- [Node.js](https://nodejs.org/)
- Open a command prompt (`cmd`) and run the command `mkdir ~/AppData/Roaming/npm`
- [Visual Studio 2013 Community](https://www.visualstudio.com/en-us/products/visual-studio-community-vs.aspx) (or similar) - You do not need to install any optional packages during install.
- [Python](https://www.python.org/downloads/release/python-2710/)

![Toolbox Env Var](https://cloud.githubusercontent.com/assets/251292/10656552/adaedb20-7834-11e5-8881-d5402d3fee37.png)

### Getting Started

- `npm install`

To run the app in development:

- `npm start`

Running `npm start` will download and install the Docker client,
[Docker Machine](https://github.com/docker/machine), [Docker Compose](https://github.com/docker/compose)
the [Boot2Docker iso](https://github.com/boot2docker/boot2docker),
[Electron](http://electron.atom.io/).

### Building & Release

- `npm run release`

### Unit Tests

- `npm test`

## Architecture

### Overview

**Note: This architecture is work in progress and doesn't reflect the current state of the app, yet!**

Kitematic is an application built using [electron](https://github.com/atom/electron) and is powered by the [Docker Engine](https://github.com/docker/docker). While it's work in progress, the goal is to make Kitematic a high-performance, portable Javascript ES6 application built with React and Flux (using [alt](https://github.com/goatslacker/alt). It adopts a single data flow pattern:

```
╔═════════╗       ╔════════╗       ╔═════════════════╗
║ Actions ║──────>║ Stores ║──────>║ View Components ║
╚═════════╝       ╚════════╝       ╚═════════════════╝
     ^                                      │
     └──────────────────────────────────────┘
```

There are three primary types of objects:
- **Actions**: Interact with the system (Docker Engine, Docker Machine, Registries, Hub, etc)
- **Views**: Views make up the UI, and trigger available actions.
- **Stores**: Stores store the state of the application.

and since Kitematic has a large amount of interaction with outside systems, we've added utils:
- **Utils**: Utils interact with APIs, outside systems, CLI tools and generate. They are called by user-generated actions and in return, also create actions based on API return values, CLI output etc.

### Guidelines

- Avoid asynchronous code in Actions, Stores or Views. Instead, put code involving callbacks, promises or generators in utils or actions.

## GitHub Issues

Please try and label any issue as:
- `bug`: clearly a defect or unwanted behavior (errors, performance issues)
- `enhancement`: making an existing, working feature better (UI improvements, better integration)
- `feature`: an entirely new feature. Please work on [roadmap features](https://github.com/kitematic/kitematic/blob/master/ROADMAP.md).

Before creating an issue, please:

1. **Search the existing issues** to see if an issue already exists (and if so, throw in a handy :+1:)!

2. **Make sure you're running the latest version of Kitematic**. The bug may already be fixed!

3. **Explain how to reproduce the bug**. This will save maintainers tons of time!

Please be as detailed as possible. Include a description of your environment and steps on how to reproduce a bug.

## Pull Requests

We're thrilled to receive pull requests of any kind. Anything from bug fix, tests or new features are welcome.

That said, please let us know what you're planning to do! For large changes always create a proposal. Maintainers will love to give you advice on building it and it keeps the app's design coherent.

### Pull Request Requirements:
- Includes tests
- [Signed Off](https://github.com/docker/docker/blob/master/CONTRIBUTING.md#sign-your-work)

## Testing

Please try to test any new code.
- Tests can be run using `npm test`
- Kitematic uses the [Jest framework](https://facebook.github.io/jest/) by Facebook. To keep tests fast, please mock as much as possible.

## Code Guidelines

### Javascript

Kitematic is es6 ready. Please use es6 constructs where possible, they are powerful and make the code more succinct, understandable and fun.

- Semicolons
- 2 spaces (no tabs)

#### Checking Javascript code standards with ESlint

Run `npm run lint` before committing to ensure your javascript is up to standard. Feel free to suggest changes to the lint spec in `.eslintrc`.

We designed Kitematic to be easy to build, extend and distribute for developers.

## License

By contributing your code, you agree to license your contribution under the [Apache license](https://github.com/kitematic/kitematic/blob/master/LICENSE).
