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

* `kitematic stop`

  Stops the container(s) defined in the docker-compose.yml.

* `kitematic remove`

  Removes the container(s) defined in the docker-compose.yml.

* `kitematic restart`

  Restart the container(s) defined in the docker-compose.yml.

* `kitematic cli`

  Open a docker-cli shell in your machine.

* `kitematic init`

  Create an example docker-compose.yml

> NOTICE! If you're using the public beta version of the Kitematic tool => Then your docker-machine's name will be "dev". Change the docker machine by exporting "dev" for your DOCKERMACHINE environment variable: `export DOCKERMACHINE="dev"`. If you think it is something else you can always run: `docker-machine list`.
