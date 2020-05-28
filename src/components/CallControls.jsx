import React, { Component } from "react";
import { connect } from "react-redux";
import { endCall } from "../util/plivo";
import callUtil from "../util/callUtil";

const mapStateToProps = state => {
  return { UI: state.UI, calls: state.calls};
};

class CallControls extends Component {
  state = {
    callState: {
      ENTERING: ["call"],
      DIALING: ["hangup"],
      RINGING: ["hangup"],
      ANSWERED: ["hangup", "hold", "transfer"],
      HOLDING: ["hangup", "hold", "transfer"],
      INCOMING: ["answer", "reject"],
      TRANSFER: ["send-transfer", "attended-transfer", "transfer-close"],
      "TRANSFER-SELECTED": [
        "attended-transfer",
        "send-transfer",
        "transfer-close"
      ],
      "ATTENDED-TRANSFER": ["attended-calling", "hangup"],
      "TRANSFER-READY": ["push-transfer", "hangup"]
    },
    actions: [
      {
        action: "call",
        icon: [{ i: "fas fa-phone", style: { color: "#59f559" } }],
        event: () => this.props.makeCall()
      },
      {
        action: "answer",
        icon: [{ i: "fas fa-phone", style: { color: "#59f559" } }],
        event: () => this.props.answer()
      },
      {
        action: "hold",
        icon: [{ i: "far fa-pause-circle", style: { color: "white" } }],
        event: () => this.props.holdResumeCall()
      },
      {
        action: "attended-transfer",
        icon: [
          { i: "fas fa-user trans4" },
          { i: "fas fa-long-arrow-alt-right trans5" }
        ],
        event: () => this.props.makeCall("ATTENDED-TRANSFER")
      },
      {
        action: "attended-calling",
        icon: [{i:"", text: "Dialing", style: {color: "#f8f9fa", fontSize: "initial", fontStyle: "normal"}}],
      },
      {
        action: "push-transfer",
        icon: [{i:"", text: <span>Send Transfer</span>, style: {color: "#f8f9fa", fontSize: "initial", fontStyle: "normal"}}],
        event: () => callUtil.attendedTransfer()
      },
      {
        action: "send-transfer",
        icon: [
          { i: "fas fa-phone-alt trans1" },
          { i: "fas fa-long-arrow-alt-right trans2" }
        ],
        event: () => this.props.sendTransfer()
      },
      {
        action: "transfer",
        icon: [
          { i: "fas fa-phone-alt trans1" },
          { i: "fas fa-long-arrow-alt-right trans2" },
          { i: "fas fa-phone trans3" }
        ],
        event: () => this.props.callTransfer()
      },
      {
        action: "transfer-close",
        icon: [{ i: "fas fa-plus-circle warning trans6" }],
        event: () => this.props.transferCancel()
      },
      {
        action: "reject",
        icon: [{ i: "fas fa-phone-slash", style: { color: "dodgerblue" } }],
        event: () => this.props.makeCall()
      },
      {
        action: "hangup",
        icon: [
          {
            i: "fas fa-phone-alt",
            style: { color: "red", transform: "rotate(135deg)" }
          }
        ],
        event: () => endCall()
      }
    ]
  };
  render() {
    return (
      <div id="call-controls" className="row">
        {this.state.actions.map(a => {
          let status = this.props.calls.displayCall
            ? this.props.calls.displayCall.status
            : this.props.entryInput !== ""
            ? "ENTERING"
            : null;
          let state = this.state.callState[status];
          state = state ? state : [];
          if (state.includes(a.action)) {
            return (
              <div
                key={this.state.actions.indexOf(a)}
                className={"col icon-wrap"}
                style={{ cursor: "pointer" }}
              >
                <div
                  style={
                    a.action === "transfer-close"
                      ? { backgroundColor: "#dc3545" }
                      : {}
                  }
                  className={
                    "icon-call-flow" +
                    (status === "HOLDING" && a.action === "hold"
                      ? " holding"
                      : "") +
                    ((status === "TRANSFER-SELECTED" ||
                    status === "TRANSFER-READY") &&
                    (a.action === "attended-transfer" ||
                      a.action === "send-transfer" ||
                      a.action === "push-transfer")
                      ? " transferring"
                      : "")
                  }
                  onClick={a.event}
                >
                  {a.icon.map(i => {
                    return (
                      <i
                        key={a.icon.indexOf(i)}
                        className={i.i}
                        style={i.style}
                      >{i.text ? i.text : ""}</i>
                    );
                  })}
                </div>
              </div>
            );
          } else {
            return;
          }
        })}
      </div>
    );
  }
}

export default connect(mapStateToProps)(CallControls);
