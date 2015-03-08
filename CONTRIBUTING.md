# Contributing to Kitematic

Thanks for contributing and supporting the Kitematic project!

Before you fil an issue or a pull request, quickly read of the following tips on how to keep development of the project awesome for all of the contributors:

## Table of Contents

 - [Using the Issue Tracker](#using-github-issues)
 - [Bugs Reports](#bug-reports)
 - [Feature Requests](#feature-requests)
 - [Submitting Pull Requests](#submitting-pull-requests)
 - [Code Guidelines](#code-guidelines)
 - [Testing](#testing)
 - [License](#license)

## Using GitHub Issues

Please limit GitHub issues to Bugs and Feature suggestions:

## Bug Reports

A bug is a reproducable and caused by the code in the repository. For bug reports:

1. **Search the existing issues** to see if an issue already exists (and if so, throw in a handy :+1:)!

2. **Make sure you're running the latest version of Kitematic**. The bug may already be fixed!

3. **Explain how to reproduce the bug**. This will save maintainers tons of time!

A good bug report shouldn't leave others needing to chase you up for more
information. Please try to be as detailed as possible in your report. What is
your environment? What steps will reproduce the issue? What browser(s) and OS
experience the problem? Do other browsers show the bug differently? What
would you expect to be the outcome? All these details will help people to fix
any potential bugs.

Example:

> Short and descriptive example bug report title
>
> A summary of the issue and the browser/OS environment in which it occurs. If
> suitable, include the steps required to reproduce the bug.
>
> 1. This is the first step
> 2. This is the second step
> 3. Further steps, etc.
>
> `<url>` - a link to the screen shot of the bug if possible
>
> Any other information you want to share that is relevant to the issue being
> reported. This might include the lines of code that you have identified as
> causing the bug, and potential solutions (and your opinions on their
> merits).

## Feature Requests

Feature requests are most certainly welcome (and often exciting / interesting!). Please make sure your idea is within the scope and direction of the project outlined by our [Roadmap](https://github.com/kitematic/kitematic/blob/master/ROADMAP.md).

## Submitting Pull Requests

We're thrilled to receive pull requests of any kind. Anything from bug fix, tests or new features are welcome. That said, Kitematic is a highly-visual product.

**Please ask first** before starting your journey on any significant pull request (refactoring, new or large features). It never hurts to open a pull request proposing what you'd like to build. This will just help anyone who's currently well-versed in the project by letting them know, and in return you'll get some awesome advice on how to build the new feature.

Please adhere to the [Code Guidelines](#code-guidelines) used throughout the
project (indentation, accurate comments, etc.).

Adhering to the following process is the best way to get your work
included in the project:

1. [Fork](http://help.github.com/fork-a-repo/) the project, clone your fork,
	and configure the remotes:

 ```bash
 # Clone your fork of the repo into the current directory
 git clone https://github.com/<your-username>/kitematic.git
 # Navigate to the newly cloned directory
 cd kitematic
 # Assign the original repo to a remote called "upstream"
 git remote add upstream https://github.com/kitematic/kitematic.git
 ```

2. If you cloned a while ago, get the latest changes from upstream:

	```bash
	git checkout master
	git pull upstream master
	```

3. Create a new topic branch (off the main project development branch) to
	contain your feature, change, or fix:

	```bash
	git checkout -b <topic-branch-name>
	```

4. Commit your changes in logical chunks. Please adhere to these [git commit
	message guidelines](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html)
	or your code is unlikely be merged into the main project. Use Git's
	[interactive rebase](https://help.github.com/articles/interactive-rebase)
	feature to tidy up your commits before making them public.

5. Locally merge (or rebase) the upstream development branch into your topic branch:

	```bash
	git pull [--rebase] upstream master
	```

6. Push your topic branch up to your fork:

	```bash
	git push origin <topic-branch-name>
	```

7. [Open a Pull Request](https://help.github.com/articles/using-pull-requests/)
	 with a clear title and description against the `master` branch.



## Code Guidelines

### Javascript

Kitematic uses the babel es6 polyfill for features such as fat arrows, and runs in io.js which supports great features such as generators. Please make use of es6 features! They are powerful and make the code more succinct, understandable and fun.

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
