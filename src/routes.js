import React from 'react/addons';
import Setup from './components/Setup.react';
import Account from './components/Account.react';
import AccountSignup from './components/AccountSignup.react';
import AccountLogin from './components/AccountLogin.react';
import Containers from './components/Containers.react';
import ContainerDetails from './components/ContainerDetails.react';
import ContainerHome from './components/ContainerHome.react';
import ContainerLogs from './components/ContainerLogs.react';
import ContainerSettings from './components/ContainerSettings.react';
import ContainerSettingsGeneral from './components/ContainerSettingsGeneral.react';
import ContainerSettingsPorts from './components/ContainerSettingsPorts.react';
import ContainerSettingsVolumes from './components/ContainerSettingsVolumes.react';
import ContainerSettingsAdvanced from './components/ContainerSettingsAdvanced.react';
import Preferences from './components/Preferences.react';
import About from './components/About.react';
import NewContainerSearch from './components/NewContainerSearch.react';
import NewContainerPull from './components/NewContainerPull.react';
import {Router, IndexRoute, Route, Link} from 'react-router'

var App = React.createClass({
  render: function () {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
});

var routes = (
  <Route path="/" component={App}>
    <IndexRoute component={Setup}/>
    <Route path="account" component={Account}>
      <Route path="signup" component={AccountSignup}/>
      <Route path="login" component={AccountLogin}/>
    </Route>
    <Route path="containers" component={Containers}>
      <Route path="details/:name" component={ContainerDetails}>
        <IndexRoute component={ContainerHome} />
        <Route path="logs" component={ContainerLogs}/>
        <Route path="settings" component={ContainerSettings}>
          <Route path="general" component={ContainerSettingsGeneral}/>
          <Route path="ports" component={ContainerSettingsPorts}/>
          <Route path="volumes" component={ContainerSettingsVolumes}/>
          <Route path="advanced" component={ContainerSettingsAdvanced}/>
        </Route>
      </Route>
      <Route name="new" path="new">
        <IndexRoute component={NewContainerSearch}/>
      </Route>
      <Route path="preferences" component={Preferences}/>
      <Route path="about" component={About}/>
    </Route>
  </Route>
);

module.exports = routes;
