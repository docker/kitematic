#!/bin/bash

if [ -n $(docker ps -aq -f name="<%= name %>") ]; then
  docker stop <%= name %>
fi
