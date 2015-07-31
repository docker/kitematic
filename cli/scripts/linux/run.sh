#!/bin/bash

if [ -n $(docker ps -aq -f name="<%= name %>") ]; then
  docker rm -f <%= name %>
fi
docker run -d \
  --name <%= name %> \<% for(var key in config.env) { %>
  -e <%- key %>=<%- ("" + config.env[key]).replace(/./ig, '\\$&') %> \
  <% } %><%= config.image %>
