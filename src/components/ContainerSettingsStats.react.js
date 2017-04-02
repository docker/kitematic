import _ from 'underscore';
import React from 'react/addons';
import shell from 'shell';
import ContainerUtil from '../utils/ContainerUtil';
import containerActions from '../actions/ContainerActions';
import containerStore from '../stores/ContainerStore';
import metrics from '../utils/MetricsUtil';
import docker from '../utils/DockerUtil';
import {DropdownButton, MenuItem} from 'react-bootstrap';
import Chart from 'chart.js'

var ContainerSettingsStats = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  getInitialState: function () {

    this.charts = {
      cpu: null,
      memory: null,
      networkIn: null,
      networkOut: null
    }

    return {
      cpu: {
        used: 0,
        free: 0,
      },
      memory: {
        used: 0,
        total: 0,
        perc: 0
      },
      network: {
        in: 0,
        out: 0
      }
    };
  },
  componentDidMount: function() {
    var self = this;
    var pre_networks = {};

    docker.stats(this.props.container.Name, function(error, stream){
      if(error){
        console.log('Err: %o', error);
      }else{
        self.stream = stream;
        self.initCharts();

        stream.setEncoding('utf8');
        stream.on('data', json => {
          let data = JSON.parse(json);
          if (data.error) {
            error = data.error;
            return;
          }else{

            // CPU
            var previousCPU = data.precpu_stats.cpu_usage.total_usage;
				    var previousSystem = data.precpu_stats.system_cpu_usage;
            var cpuDelta = parseFloat(data.cpu_stats.cpu_usage.total_usage) - parseFloat(previousCPU)
		        var systemDelta = parseFloat(data.cpu_stats.system_cpu_usage) - parseFloat(previousSystem)
	          var cpuPercent = (cpuDelta / systemDelta) * parseFloat(data.cpu_stats.cpu_usage.percpu_usage.length) * 100.0;

            // Memory
            var memoryLimit = data.memory_stats.limit
            var memoryUsage = data.memory_stats.usage
            var memoryPercent = memoryUsage / memoryLimit * 100.0

            // Network
            var networkIn = 0;
            var networkOut = 0;
            Object.keys(data.networks).forEach(function(net_name){
              if(pre_networks[net_name]){
                var net_data = data.networks[net_name];
                var pre_net_data = pre_networks[net_name];
                networkIn += (net_data.rx_bytes - pre_net_data.rx_bytes);
                networkOut += (net_data.tx_bytes - pre_net_data.tx_bytes);
              }
            })
            pre_networks = data.networks;

            self.setState({
              cpu: {
                used: cpuPercent,
                free: 100 - cpuPercent
              },
              memory: {
                used: memoryUsage/1024/1024,
                total: memoryLimit/1024/1024,
                perc: memoryPercent
              },
              network: {
                in: networkIn/1024/1024,
                out: networkOut/1024/1024
              }
            });

            self.updateCharts();
          }
        })
        stream.on('end', function () {
          if(error){
            console.log('Err: %o', error);
          }
        });
      }
    });
  },
  componentWillUnmount: function() {
    if(this.stream){
      this.stream.destroy();
    }
  },
  initCharts: function(){

    // Global configurations
    Chart.defaults.global.legend.display = false;
    Chart.defaults.global.tooltips.enabled = false;
    Chart.defaults.global.title.display = false;

    var foregroundColor = "#42a5f5";
    var backgroundColor = "#F6F8FB";

    var canvas = null;
    var ctx = null;

    // CPU

    canvas = document.getElementById('cpuChart');
    ctx = canvas.getContext('2d');

    this.charts.cpu = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [
          "Used",
          "Free"
        ],
        datasets: [{
          data: [0, 100],
          backgroundColor: [
            foregroundColor,
            backgroundColor
          ],
          hoverBackgroundColor: [
            foregroundColor,
            backgroundColor
          ],
          hoverBorderWidth: [
            2,
            0
          ]
        }]
      },
      options: {
        animation:{
          animateRotate: false
        }
      }
    });

    // Memory

    canvas = document.getElementById('memoryChart');
    ctx = canvas.getContext('2d');

    this.charts.memory = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [
          "Used",
          "Free"
        ],
        datasets: [{
          data: [0, 100],
          backgroundColor: [
            foregroundColor,
            backgroundColor
          ],
          hoverBackgroundColor: [
            foregroundColor,
            backgroundColor
          ],
          hoverBorderWidth: [
            2,
            0
          ]
        }]
      },
      options: {
        animation:{
          animateRotate: false
        }
      }
    });

    // Network In

    var max_networkIn = 25;
    canvas = document.getElementById('networkInChart');
    ctx = canvas.getContext('2d');

    this.charts.networkIn = new Chart(ctx, {
      type: 'horizontalBar',
      data: {
        labels: [
          "RX"
        ],
        datasets: [{
          data: [0],
          backgroundColor: [
            foregroundColor
          ]
        }]
      },
      options: {
        scales: {
          xAxes: [{
            gridLines: {
              display: false
            },
            ticks: {
              max: max_networkIn,
              min: 0,
            }
          }],
          yAxes: [{
            gridLines: {
              display: false
            }
          }]
        }
      }
    });

    // Network Out

    var max_networkOut = 15;
    canvas = document.getElementById('networkOutChart');
    ctx = canvas.getContext('2d');

    this.charts.networkOut = new Chart(ctx, {
      type: 'horizontalBar',
      data: {
        labels: [
          "TX"
        ],
        datasets: [{
          data: [0],
          backgroundColor: [
            foregroundColor
          ]
        }]
      },
      options: {
        scales: {
          xAxes: [{
            gridLines: {
              display: false
            },
            ticks: {
              max: max_networkOut,
              min: 0,
            }
          }],
          yAxes: [{
            gridLines: {
              display: false
            }
          }]
        }
      }
    });

  },
  updateCharts : function () {
    if(this.charts.cpu){
      this.charts.cpu.data.datasets[0].data[0] = this.state.cpu.used;
      this.charts.cpu.data.datasets[0].data[1] = this.state.cpu.free;
      this.charts.cpu.update();
    }
    if(this.charts.memory){
      this.charts.memory.data.datasets[0].data[0] = this.state.memory.perc;
      this.charts.memory.data.datasets[0].data[1] = 100 - this.state.memory.perc;
      this.charts.memory.update();
    }
    if(this.charts.networkIn){
      this.charts.networkIn.data.datasets[0].data[0] = this.state.network.in;
      this.charts.networkIn.update();
    }
    if(this.charts.networkOut){
      this.charts.networkOut.data.datasets[0].data[0] = this.state.network.out;
      this.charts.networkOut.update();
    }
  },
  render: function () {
    if (!this.props.container) {
      return false;
    }

    return (
      <div className="settings-panel stats-panel">
        <div className="stats-charts-container stats-charts-container-horizontal">
          <div className="stats-chart">
            <div className="stats-chart-title">
              CPU Usage
            </div>
            <canvas className="stats-chart" id="cpuChart"></canvas>
            <div className="stats-chart-info">
              {this.state.cpu.used.toFixed(2)} %
            </div>
          </div>
          <div className="stats-chart">
            <div className="stats-chart-title">
              Memory Usage
            </div>
            <canvas className="stats-chart" id="memoryChart"></canvas>
            <div className="stats-chart-info">
              {(this.state.memory.used).toFixed(2)} MB
            </div>
          </div>
        </div>
        <div className="stats-charts-container stats-charts-container-vertical">
          <div className="stats-chart">
            <div className="stats-chart-title-composite">
              <span className="stats-chart-title">
                Network In
              </span>
              <span className="stats-chart-info">
                {(this.state.network.in).toFixed(2)} MB/s
              </span>
            </div>
            <canvas className="stats-chart" id="networkInChart"></canvas>
          </div>
          <div className="stats-chart">
            <div className="stats-chart-title-composite">
              <span className="stats-chart-title">
                Network Out
              </span>
              <span className="stats-chart-info">
                {(this.state.network.out).toFixed(2)} MB/s
              </span>
            </div>
            <canvas className="stats-chart" id="networkOutChart"></canvas>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = ContainerSettingsStats;
