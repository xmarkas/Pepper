import React, { Component } from "react";

class NewCall extends Component {
  state = {};
  render() {
    return (
      <div className="calls-item row" onClick={ev => this.selectCall(ev)}>
        <div className="col">15092403606</div>
        <div className="col">Active</div>
        <div className="col">00:06:34</div>
      </div>
    );
  }
}

export default NewCall;
