#!/bin/bash

if [ $(docker ps -aq -f name="<%= name %>") ]; then
  docker rm -f -v <%= name %>
fi
