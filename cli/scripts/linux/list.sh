#!/bin/bash

docker ps <% for(var name in config) { %>-f name=<%= name %> <% } %>
