# Kitematic CLI and configuration management

Store configuration for a projects container(s) in the repository and start all of it's containers from the command line.

## Example Configuration File

### docker-compose.yaml
```yaml
mysql:
  image: mysql/mysql-server:5.7
  environment:
    - MYSQL_ALLOW_EMPTY_PASSWORD=yes
drupal:
  image: timbrandin/drupal
  ports:
    - "80"
  volumes:
    - ./web:/var/www
  links:
    - mysql
```

## Command Line Interface – API

* `kitematic list`

  Lists the status of container(s) managed in the docker-compose.yml.

* `kitematic run`

  Starts the container(s) with it's setup from the docker-compose.yml.

* `kitematic run CONTAINER`

  Starts the container with it's setup from the docker-compose.yml.

* `kitematic stop`

  Stops the container(s) defined in the docker-compose.yml.

* `kitematic stop CONTAINER`

  Stops the container.

* `kitematic remove`

  Removes the container(s) defined in the docker-compose.yml.

* `kitematic remove CONTAINER`

  Removes the container(s) defined in the docker-compose.yml.

* `kitematic restart`

  Restart the container(s) defined in the docker-compose.yml.

* `kitematic remove CONTAINER`

  Removes the container(s) defined in the docker-compose.yml.

* `kitematic exec`

  Opens a shell to the container(s). Though it should warn if there are multiple containers running.

* `kitematic exec CONTAINER`

  Opens a shell to the container. Though it should warn if there are multiple containers running.

* `kitematic exec COMMAND`

  Executes a command in the container(s). Though it should warn if there are multiple containers running.

* `kitematic exec CONTAINER COMMAND`

  Executes a command in the container.

* `kitematic cli`

  Open a docker-cli shell in your machine.

* `kitematic init`

  Create an example docker-compose.yml
