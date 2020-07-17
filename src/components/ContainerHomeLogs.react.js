import $ from 'jquery';
import React from 'react/addons';
import Router from 'react-router';
import containerActions from '../actions/ContainerActions';
import Convert from 'ansi-to-html';
import * as fs from 'fs';
import { clipboard, remote, shell } from 'electron';
const dialog = remote.dialog;

let escape = function (html) {
  var text = document.createTextNode(html);
  var div = document.createElement('div');
  div.appendChild(text);
  return div.innerHTML;
};

var FontSelect = React.createClass({
  
  getFontSizes: function(start, end){
    let options = [];
    for(let i = start; i<=end; i++){
      options.push(<option key={i} value={i}>{i+' px'}</option>);
    }
    return options;
  },

  render: function(){
    return (
      <select className='logs-font-size__select' value={this.props.fontSize} onChange={this.props.onChange}>
        <option disabled="true" >Font size</option>
        {this.getFontSizes(10, 30)}
      </select>
    );
  }
});

let convert = new Convert();
let prevBottom = 0;

module.exports = React.createClass({
  getInitialState: function(){
    return {
      fontSize: 10,
      follow: true,
    };
  },
  onFontChange: function(event){
    let $target = event.target;
    this.setState((prevState)=>({
      fontSize: $target.value,
      follow: prevState.follow
    }));
  },
  componentDidUpdate: function () {
    var node = $('.logs').get()[0];
    if(this.state.follow){
      node.scrollTop = node.scrollHeight;
    }
  },

  componentWillReceiveProps: function (nextProps) {
    if (this.props.container && nextProps.container && this.props.container.Name !== nextProps.container.Name) {
      containerActions.active(nextProps.container.Name);
    }
  },

  componentDidMount: function () {
    containerActions.active(this.props.container.Name);
  },

  componentWillUnmount: function () {
    containerActions.active(null);
  },
  
  toggleFollow: function () {
    this.setState((prevState)=>({
      fontSize: prevState.fontsize,
      follow: !prevState.follow
    }));
  },

  render: function () {
    let _logs = '';
    let logs = this.props.container.Logs ? this.props.container.Logs.map((l, index) => {
        const key = `${this.props.container.Name}-${index}`;
        _logs = _logs.concat((l.substr(l.indexOf(' ')+1)).replace(/\[\d+m/g,'').concat('\n'));
        return <div key={key} dangerouslySetInnerHTML={{__html: convert.toHtml(escape(l.substr(l.indexOf(' ')+1)).replace(/ /g, '&nbsp;<wbr>'))}}></div>;
      }) : ['0 No logs for this container.'];

    let copyLogs = (event) => {
      clipboard.writeText(_logs);

      let btn = event.target;
      btn.innerHTML = 'Copied !';
      btn.style.color = '#FFF';
      setTimeout(()=>{
        btn.style.color = 'inherit'
        btn.innerHTML = 'Copy';
      }, 1000);
    };

    let saveLogs = (event) => {
      //create default filename with timestamp
      let path = `${this.props.container.Name} ${new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g,'-')}.txt`;
      dialog.showSaveDialog({
        defaultPath: path
      }).then(({filePath}) => {
        if (!filePath) return;
        fs.writeFile(filePath, _logs, (err) => {
          if(!err){
            shell.showItemInFolder(filePath);
          }else{
            dialog.showErrorBox('Oops! an error occured', err.message);
          }
        });
      });
    };

    return (
      <div className="mini-logs wrapper">
        <div className="widget">
          <div className="top-bar">
            <div className="text">Container Logs</div>
            <div>
              <label className="follow-logs__label">
                Follow&nbsp;
                <input type="checkbox" onChange={ this.toggleFollow } checked={ this.state.follow }></input>
              </label>
              <button className="save-logs__btn" onClick={saveLogs}>
                <i className="icon icon-download"></i>
              </button>
              <FontSelect fontSize={this.state.fontSize} onChange={this.onFontChange} />
              <button className="copy-logs__btn" onClick={copyLogs}>Copy</button>
            </div>
          </div>
          <div className="logs" style={{fontSize:this.state.fontSize+'px'}}>
            {logs}
          </div>
        </div>
      </div>
    );
  }
});
