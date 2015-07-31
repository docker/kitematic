#!/bin/bash

if [ -n $(docker ps -aq -f name="<%= name %>") ]; then
  docker rm -f <%= name %>
fi
