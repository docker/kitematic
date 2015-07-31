#!/bin/bash
<%
var w = function(x) {return typeof x == 'string' && /^[a-z]/i.test(x)}
var d = function(x) {return typeof x == 'string' && /^\d+$/.test(x)}
%>
if [ $(docker ps -aq -f name="<%= name %>") ]; then
  docker rm -f <%= name %>
fi
docker run -d --name <%= name %><% for(var port in config.ports) {
  %> -p <%- (config.ports[port] && config.ports[port].host ? config.ports[port].host + ":" : "") %><%- ("" + (d(config.ports[port]) ? config.ports[port] : port)) %><%
  } for(var key in config.environment) {
  %> -e <%= (w(key) ? key + "=" : "")  %>"<%- ("" + config.environment[key]) %>"<%
} for(var volume in config.volumes) {
  %> -v <%- ("" + (w(config.volumes[volume]) ? config.volumes[volume] : volume)) %><%
  } for(var link in config.links) {
  %> --link <%- ("" + (w(config.links[link]) ? config.links[link] : link)) %><%
} %> <%= config.image %><%- (config.command ? " " + config.command : "") %>
