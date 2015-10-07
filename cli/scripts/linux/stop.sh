#!/bin/bash

if [ $(docker ps -aq -f name="<%= name %>") ]; then
  docker stop <%= name %>
fi
