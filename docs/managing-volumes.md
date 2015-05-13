page_title: Managing Volumes with Kitematic
page_description: Documentation explaining how Kitematic manages container volumes
page_keywords: docker, documentation, about, technology, kitematic, gui, volumes

# Managing Volumes

### Default Volume Directories

Every container created through Kitematic automatically has its volumes exposed
on your Mac, which means you can manage files in volumes via the Finder.
Kitematic exposes a container's volume data under `~/Kitematic/<container's name>/`.
Quick access to this folder (or directory) is available via the app:

![Accessing the volumes directory](../assets/volumes-dir.png)

### Changing Volume Directories

Let's say you have an Nginx webserver running via Kitematic (using the
`kitematic/hello-world-nginx` image on DockerHub). However, you don't want to
use the default directory created for the website_files volume. Instead, you
already have the HTML, Javascript, and CSS for your website under
`~/workspace/website`. Kitematic makes it easy to change the container's volume
to read from this directory instead of the default one created by Kitematic:

![screen shot 2015-02-28 at 2 48 01 pm](../assets/change-folder.png)
