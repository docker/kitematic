#!/bin/bash

if [ -n $(docker ps -f name=<%= name %> -aq) ]; then
  docker rm -f <%= name %>
fi
docker run -d \
  --name <%= name %> \<% for(var key in env) { %>
  -e <%- key %>=<%- ("" + env[key]).replace(/./ig, '\\$&') %> \
  <% } %><%= image %>
