page_title: Accessing the Docker CLI in Kitematic
page_description: Documentation describing how to work on the Docker command line using Kitematic
page_keywords: docker, documentation, about, technology, kitematic, gui, cli, 


# Docker Command-line Access

You can interact with existing containers in Kitematic or create new containers via the Docker Command Line Interface (CLI). Any changes you make on the CLI are directly reflected in Kitematic.


### Opening a Terminal for the Docker CLI

To open a terminal via Kitematic, just press whale button at the bottom left, as shown below:

![CLI access button](cli-access-button.png)

### Example: Creating a new Redis container

Start by opening a Docker-CLI ready terminal by clicking the whale button as described above. Once the terminal opens, enter `docker run -d -P redis`. This will pull and run a new Redis container via the Docker CLI.

![Docker CLI terminal window](cli-terminal.png)

Now, go back to Kitematic. The Redis container should now be visible.

![Redis container in Kitematic](cli-redis-container.png)
