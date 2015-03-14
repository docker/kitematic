# Contributing to Kitematic

Thanks for contributing and supporting the Kitematic project!

Before you fil an issue or a pull request, quickly read of the following tips on how to keep development of the project awesome for all of the contributors:

## Table of Contents

 - [Bug Reports](#github-issues)
 - [Pull Requests](#submitting-pull-requests)
 - [Code Guidelines](#code-guidelines)
 - [Testing](#testing)
 - [License](#license)

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

## Code Guidelines

### Javascript

Kitematic is es6 ready. Please use es6 constructs where possible, they are powerful and make the code more succinct, understandable and fun.

- Semicolons
- 2 spaces (no tabs)

#### Checking Javascript code standards with JSHint

Run `npm run lint` before committing to ensure your javascript is up to standard. Feel free to suggest changes to the lint spec in `.jshint`.

### React

- Use tags and elements appropriate for React / an HTML5 doctype (e.g., self-closing tags)
- Try to avoid using JQuery or manually changing the DOM. Use React instead.
- Try to build self-contained components that listen and emit events. This is definitely nowhere near perfect yet for the existing codebase.

## Testing

While the project is early, please try to test any new code.
- Tests can be run using `npm test`
- Kitematic uses the [Jest framework](https://facebook.github.io/jest/) by Facebook. To keep tests fast, please mock as much as possible.

## License

By contributing your code, you agree to license your contribution under the [Apache license](https://github.com/kitematic/kitematic/blob/master/LICENSE).
