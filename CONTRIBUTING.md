# Contributing to Kitematic

Thanks for contributing and supporting the Kitematic project.

Before you file a bug or pull request, please take a comment to read the
following guidelines for more details on how to file a bug report or submit a
pull request to help make the contribution process awesome for
everyone working on this project.

Following these guidelines helps to communicate that you respect the time of
the developers managing and developing this open source project. In return,
they should reciprocate that respect in addressing your issue or assessing
patches and features.


## Table of Contents

 - [Using the Issue Tracker](#using-the-issue-tracker)
 - [Bugs Reports](#bug-reports)
 - [Feature Requests](#feature-requests)
 - [Submitting Pull Requests](#submitting-pull-requests)
 - [Code Guidelines](#code-guidelines)
 - [License](#license)


## Using the Issue Tracker

The [Issue Tracker](https://github.com/kitematic/kitematic/issues) is
the preferred channel for [Bug Reports](#bug-reports), [Features Requests](#feature-requests)
and [Submitting Pull Requests](#submitting-pull-requests), but please respect the following
restrictions:

## Bug Reports

A bug is a _demonstrable problem_ that is caused by the code in the repository.
Good bug reports are extremely helpful, so thanks!

Guidelines for bug reports:

1. **Use the GitHub issue search** &mdash; check if the issue has already been
	reported.

2. **Check if the issue has been fixed** &mdash; try to reproduce it using the
	latest `master` or development branch in the repository.

3. **More details are encouraged** &mdash; please give more details on the steps
	to reproduce the bug and attach a screenshot of the bug if possible.

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

Feature requests are welcome. But take a moment to find out whether your idea
fits with the scope and aims of the project. A roadmap of the project is kept
on the [Kitematic Roadmap](https://trello.com/b/G5Aw0Rqc/kitematic-roadmap) Trello board.
It's up to *you* to make a strong case to convince the project's developers of
the merits of this feature. Please provide as much detail and context as possible.



## Submitting Pull Requests

Good pull requests—patches, improvements, new features—are a fantastic
help. They should remain focused in scope and avoid containing unrelated
commits.

**Please ask first** before embarking on any significant pull request (e.g.
implementing features, refactoring code, porting to a different language),
otherwise you risk spending a lot of time working on something that the
project's developers might not want to merge into the project.

Please adhere to the [Code Guidelines](#code-guidelines) used throughout the
project (indentation, accurate comments, etc.) and any other requirements
(such as test coverage).

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

- Semicolons (in client-side JS)
- 2 spaces (no tabs)
- strict mode
- "Attractive"

#### Checking Javascript code standards with JSHint

Run `sh jshint.sh` before committing to ensure your changes follow our coding
standards. Add any exceptions to global variables at the bottom of the
*.jshintrc* file.

### HTML

[Adhere to the Code Guide.](http://codeguide.co/#html)

- Use tags and elements appropriate for an HTML5 doctype (e.g., self-closing tags).
- Use CDNs and HTTPS for third-party JS when possible. We don't use protocol-relative URLs in this case because they break when viewing the page locally via `file://`.
- Use [WAI-ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) attributes in documentation examples to promote accessibility.

### CSS/LESS

[Adhere to the Code Guide.](http://codeguide.co/#css)

- When feasible, default color palettes should comply with [WCAG color contrast guidelines](http://www.w3.org/TR/WCAG20/#visual-audio-contrast).
- Except in rare cases, don't remove default `:focus` styles (via e.g. `outline: none;`) without providing alternative styles. See [this A11Y Project post](http://a11yproject.com/posts/never-remove-css-outlines/) for more details.



## License

By contributing your code, you agree to license your contribution under the [AGPL license](https://github.com/kitematic/kitematic/blob/master/LICENSE).
