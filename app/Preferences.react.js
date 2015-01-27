var React = require('react/addons');
var assign = require('object-assign');
var ipc = require('ipc');

// TODO: move this somewhere else
if (localStorage.getItem('options')) {
  ipc.send('vm', JSON.parse(localStorage.getItem('options')).save_vm_on_quit);
}

var Preferences = React.createClass({
  getInitialState: function () {
    var data = JSON.parse(localStorage.getItem('options'));
    return assign({
      save_vm_on_quit: true,
      report_analytics: true
    }, data || {});
  },
  handleChange: function (key, e) {
    var change = {};
    change[key] = !this.state[key];
    console.log(change);
    this.setState(change);
  },
  saveState: function () {
    ipc.send('vm', this.state.save_vm_on_quit);
    localStorage.setItem('options', JSON.stringify(this.state));
  },
  componentDidMount: function () {
    this.saveState();
  },
  componentDidUpdate: function () {
    this.saveState();
  },
  render: function () {
    console.log('render');
    return (
      <div className="preferences">
        <div className="preferences-content">
          <div className="title">VM Settings</div>
          <div className="option">
            <div className="option-name">
              Save Linux VM state on closing Kitematic
            </div>
            <div className="option-value">
              <input type="checkbox" checked={this.state.save_vm_on_quit} onChange={this.handleChange.bind(this, 'save_vm_on_quit')}/>
            </div>
          </div>
          <div className="title">App Settings</div>
          <div className="option">
            <div className="option-name">
              Report anonymous usage analytics
            </div>
            <div className="option-value">
              <input type="checkbox" checked={this.state.report_analytics} onChange={this.handleChange.bind(this, 'report_analytics')}/>
            </div>
          </div>

        </div>
      </div>
    );
  }
});

module.exports = Preferences;
