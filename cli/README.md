# Kitematic CLI and configuration management

Store configuration for a projects container(s) in the repository and start all of it's containers from the command line.

## Kitematicfile

### Kitematic.yaml
```yaml
mysql:
  image: "mysql"
drupal:
  image: "timbrandin/drupal"
  ports: # (optional) Ports definitions.
    80:
      host: 80
      forward: 8080 # (optional) Port forwarded on OSX/Windows
  volumes: # (optional) Shared volumes/folders.
    "/var/www":
      folder: "./web"
      nfs: true # (optional) Use NFS on OSX/Windows
      vm_folder: "/drupal/web"  # (optional) Specify folder used in Virtual Machine on OSX/Windows
  links: # (optional) Container links.
     mysql: "mysql"
  env: # (optional) Environment variables.
```

### Kitematic.json
```json
{
  "mysql": {
    "image": "mysql"
  },
  "drupal": {
    "image": "timbrandin/drupal",
    "ports": {
      "80": {
        "host": 80,
        "forward": 8080
      }
    },
    "volumes": {
      "/var/www": {
        "folder": "./web",
        "nfs": true,
        "vm_folder": "/drupal/web"
      }
    },
    "links": {
      "mysql": "mysql"
    },
    "env": null
  }
}
```

### Kitematic.js

> I'm going to let you imagine how this would be used and implemented, but I guess there could be a benefit having scripted setups.

## Command Line Interface – API

* `kitematic list`

  Lists the status of container(s) managed in the Kitematicfile.

* `kitematic list --all`

  Lists the status of all running container(s) in the Docker-Machine for Kitematic.

* `kitematic run`

  Starts the container(s) with it's setup from the Kitematicfile.

* `kitematic stop`

  Stops the container(s) defined in the Kitematicfile.

* `kitematic restart`

  Restart the container(s) defined in the Kitematicfile.

* `kitematic exec`

  Opens a shell to the container(s). Though it should warn if there are multiple containers running.

* `kitematic exec COMMAND`

  Executes a command in the container(s). Though it should warn if there are multiple containers running.

* `kitematic CONTAINER exec`

  Opens a shell to the container. Though it should warn if there are multiple containers running.

* `kitematic CONTAINER exec COMMAND`

  Executes a command in the container.

* `kitematic CONTAINER run`

  Starts the container with it's setup from the Kitematicfile.

* `kitematic CONTAINER stop`

  Stops the container.

* `kitematic CONTAINER restart`

  Restart the container with it's setup defined in the Kitematicfile.

* `kitematic pull`

  Pull in the latest updates to your defined container's image from the docker registry.

* `kitematic cli`

  Open a docker-cli shell in your machine.

* `kitematic init`

  Create an example Kitematicfile from the running CONTAINERS (asks for JSON or YAML).

* `kitematic init CONTAINER(s)`

  Create an example Kitematicfile from the running CONTAINER(s) (asks for JSON or YAML).
  * For example `kitematic init drupal` or `kitematic init mysql drupal`

* `kitematic add IMAGE`

  Adds configuration for an image named IMAGE in your existing Kitematicfile (it could create the Kitematicfile too if not found).

* `kitematic add IMAGE --name CONTAINER`

  Adds configuration for an image named CONTAINER in your existing Kitematicfile (it could create the Kitematicfile too if not found).

* `kitematic remove IMAGE`

  Removes configuration for an image/container in your existing Kitematicfile.

* `kitematic remove CONTAINER`

  Removes configuration for an container in your existing Kitematicfile.

* `kitematic update`

  Updates configuration from the Kitematic GUI to your defined containers in your existing Kitematicfile.

* `kitematic update IMAGE`

  Updates configuration from the Kitematic GUI to your defined containers in your existing Kitematicfile.

* `kitematic update CONTAINER`

  Updates configuration from the Kitematic GUI to your defined containers in your existing Kitematicfile.

#### Also with support for some common vagrant commands

> I know it's hard to get used to a new tool, lets ease that burden by supporting some vagrant commands.

* `kitematic up`
  Starts the container(s) with it's setup from the Kitematicfile.
* `kitematic halt`
  Stops the container(s) defined in the Kitematicfile.
* `kitematic reload`
  Restart the container(s) defined in the Kitematicfile.
* `kitematic provision`
  Pull in the latest updates to your defined container's image from the docker registry.
* `kitematic ssh`
  Opens a shell to the container(s). Though it should warn if there are multiple containers running.
* `kitematic CONTAINER ssh`
  Opens a shell to the container.
* `kitematic ssh -- COMMAND`
  Executes a command in the container. Though it should warn if there are multiple containers running.
* `kitematic CONTAINER ssh -- COMMAND`
  Executes a command in the container.
