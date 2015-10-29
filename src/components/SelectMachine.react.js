import _ from 'underscore';
import utils from '../utils/Util';
import React from 'react/addons';
import Router from 'react-router';
import RetinaImage from 'react-retina-image';
import metrics from '../utils/MetricsUtil';
import {DropdownButton, MenuItem} from 'react-bootstrap';
import machine from '../utils/DockerMachineUtil';
import setupActions from '../actions/SetupActions';

var Setup = React.createClass({
  mixins: [Router.Navigation],

  getInitialState: function () {
    return {
      currentEngine: localStorage.getItem('settings.vm.name') || 'VM Available',
      machines: {}
    };
  },

  componentDidMount: function () {
    machine.list().then( machines => {
      let setupDefault = false;
      if (Object.keys(machines).length === 0 ) {
        setupDefault = true;
      }
      if (typeof machines.default === 'undefined') {
        machines.default = {'driver': 'virtualbox', 'name': 'default', 'create': true};
      }
      this.setState({
        machines: machines
      }, () => {
        if (setupDefault) {
          this.handleChangeDockerEngine('default');
        }
      });
    });
  },

  handleChangeDockerEngine: function (machineIndex) {
    localStorage.setItem('settings.vm', JSON.stringify(this.state.machines[machineIndex]));
    metrics.track('Select new VM: ' + this.state.machines[machineIndex].name + ' - driver: ' + this.state.machines[machineIndex].driver);
    if (this.state.currentEngine !== machineIndex) {
      this.setState({
        currentEngine: machineIndex
      });
    }
    setupActions.retry(false);
  },
  render: function () {
    let currentDriver = '';
    let machineDropdown = (<div className="spinner la-ball-clip-rotate la-dark la-lg" style={{marginLeft: 30 + '%'}}><div></div></div>);
    if (!_.isEmpty(this.state.machines)) {
      machineDropdown = React.addons.createFragment(_.mapObject(this.state.machines, (machineItem, index) => {
        let menu = [];
        let machineDriver = utils.camelCase(machineItem.driver);
        let machineName = utils.camelCase(machineItem.name);
        if (machineItem.create) {
          machineName = 'Create ' + machineName;
        }
        if (currentDriver !== machineItem.driver) {
          menu.push(<MenuItem header>{machineDriver}</MenuItem>);
          currentDriver = machine.driver;
        }
        menu.push(<MenuItem onSelect={this.handleChangeDockerEngine.bind(this, index)} key={index}>{machineName}</MenuItem>);
        return menu;
      }));
    }
    return (
      <div className="setup">
        <div className="setup-content">
          <div className="image">
            <div className="contents">
              <RetinaImage src="boot2docker.png" checkIfRetinaImgExists={false}/>
              <div className="detail">
              </div>
            </div>
          </div>
          <div className="desc">
            <div className="content">
              <h1>Select Docker VM</h1>
              <p>To run Docker containers on your computer, Kitematic needs Linux virtual machine.</p>
              <DropdownButton bsStyle="primary" title={this.state.currentEngine}>
                {machineDropdown}
              </DropdownButton>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Setup;
