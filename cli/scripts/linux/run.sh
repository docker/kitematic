#!/bin/bash

if [ -n $(docker ps -aq -f name="<%= name %>") ]; then
  docker rm -f <%= name %>
fi
docker run -d \
  --name <%= name %> \<% for(var port in config.ports) { %>
  -p <%- (config.ports[port] && config.ports[port].host ? config.ports[port].host + ":" : "") %><%- (config.ports[port] && config.ports[port].port ? config.ports[port].port + ":": "") %>:<%= port %> \
  <% } %><% for(var key in config.env) { %>
  -e <%- key %>=<%- ("" + config.env[key]).replace(/./ig, '\\$&') %> \
  <% } %><%= config.image %>
