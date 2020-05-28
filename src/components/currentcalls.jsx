import React, { Component } from "react";
import { connect } from "react-redux";
import callUtil from "../util/callUtil";

const mapStateToProps = state => {
  return { UI: state.UI, calls: state.calls };
};

class CurrentCalls extends Component {
  render() {
    function callClass(thisObj, c) {
      let displayClass = "calls-item row";
      if (thisObj.props.calls.displayCall !== null) {
        if (thisObj.props.calls.displayCall.duration.start === c.duration.start)
          displayClass = "calls-item row active-call";
        if (c.status === "INCOMING") displayClass = "calls-item row incoming";
      }
      return displayClass;
    }

    return (
      <div
        id="calls"
        className="row"
        style={{ display: this.props.UI.dialPadShow ? "none" : "flex" }}
      >
        <div id="live-call-list" className="col">
          {/* Live call list */}
          {this.props.calls.callStack.map((c, index) => {
            return (
              <div
                key={c.duration.start}
                index={index}
                className={callClass(this, c)}
                onClick={ev => callUtil.callSwitch(index)}
                style={{ cursor: "pointer" }}
              >
                <div className="col">{c.name}</div>
                <div className="col">{c.status}</div>
                <div className="col">{c.duration.timeOut}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps)(CurrentCalls);
