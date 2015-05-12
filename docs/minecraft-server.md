page_title: Kitematic Tutorial: Set up a Minecraft Server
page_description: Tutorial demonstrating the setup of a Minecraft server using Docker and Kitematic
page_keywords: docker, documentation, about, technology, kitematic, gui, minecraft, tutorial

# Kitematic tutorial: Set up a Minecraft server


This is a quick tutorial demonstrating how to set up a local Minecraft server using Kitematic and Docker.

### Create Minecraft Server Container

Create a container from the recommended Minecraft image by clicking the "Create" button.

![create Minecraft container](assets/minecrafte-create.png)

After the image finishes downloading, you’ll see the home screen for the Minecraft container. Your Minecraft server is now up and running inside a Docker container. Note that we’ve marked the IP and port you can use to connect to your Minecraft server in red (your IP and port may be different from what's shown).

![Minecraft server port and IP info](assets/minecraft-port.png)

### Connect to Minecraft server

Open your Minecraft client, log in with your Minecraft account and click on the "Multiplayer" button.

![Minecraft login screen](assets/minecraft-login.png)

Click the "Add Server" button to add the Minecraft server you want to connect to.

![Add server]assets/minecraft-login.png)

Fill in the "Server Address" text box with the marked IP and port from Kitematic you saw earlier.

![Minecraft server address](assets/minecraft-server-address.png)

Click on the play button to connect to your Minecraft server and enjoy!


### Change map using Docker volume

Open the "data" folder from Kitematic. We use Docker Volume to map the folder from the Minecraft Docker container onto your computer.

![Minecraft data volume](assets/minecraft-data-volume.png)

The Finder will open, allowing you to replace your current map with the new one you desire.

![Minecraft maps](assets/minecraft-map.png)

Restart your container by clicking the "Restart" button.

![Restart Minecraft container](assets/minecraft-restart.png)

Go back to your Minecraft client and join your server. The new map should load.


