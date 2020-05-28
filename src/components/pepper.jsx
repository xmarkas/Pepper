import React, { Component } from "react";
import Dialpad from "./dialpad";
import CallInfo from "./callinfo";
import CurrentCalls from "./currentcalls";
import AccountOptions from "./accountoptions";
import Extended from "./extended";
import BottomMenu from "./BottomMenu";
import { connect } from "react-redux";
import { dialPadShow } from "../store/actions";


let sendTransfer = "https://qumoc.com/beta/plivo/sendTransfer";

const mapStateToProps = state => {
  return { UI: state.UI, calls: state.calls };
};

function mapDispatchToProps(dispatch) {
  return {
    dialPadShow: toggle => dispatch(dialPadShow(toggle))
  };
}

class Pepper extends Component {
  state = {
   
    showMetrics: false,
   
    clanCall: null
  };

  answer = () => {
    if (this.state.Plivo.PLIVO.client.getCallUUID) {
      // this.state.callStack.forEach(c => {
      //   if (c.status === "ANSWERED") {
      //     this.holdToggle(c.uuid);
      //   }
      // });
      this.state.Plivo.PLIVO.client.hangup();
    }
    this.state.Plivo.PLIVO.client.answer();
  };

  setPepperState = setters => {
    this.setState((prevState, props) => {
      let keys = Object.keys(setters);
      let newData = {};

      keys.forEach(k => {
        newData[k] = setters[k];
      });

      return newData;
    });
  };

  updateStack = (setters, index, callback) => {
    if (this.state.callStack[index]) {
      console.log(this.state.callStack[index]);
    }

    let uuid = this.state.callStack[index].uuid;

    let contact;
    this.setState(
      (prevState, props) => {
        let keys = Object.keys(setters);
        let newData = [...prevState.callStack];
        contact = newData[index];

        keys.forEach(k => {
          contact[k] = setters[k];
        });

        return { callStack: newData };
      },
      () => {
        if (this.state.displayCall && uuid === this.state.displayCall.uuid) {
          this.setState({ displayCall: contact });
        }
        if (callback) callback(setters.uuid, this);
      }
    );
  };

  msg = msg => {
    this.setState({ msg: msg });
  };


  sendTransfer = phoneNumber => {
    if (phoneNumber[0] !== "1" && !phoneNumber.includes("phone.plivo")) {
      phoneNumber = "1" + phoneNumber;
    }
    fetch(
      `${sendTransfer}?dest=${phoneNumber}&uuid=${this.state.displayCall.uuid}`,
      { method: "POST" }
    );
    this.setState({ displayCall: null });
  };

  callTransfer = toggle => {
    let uuid = this.state.displayCall.uuid;

    let callIndex = this.state.callStack.findIndex(obj => {
      return obj.uuid === uuid;
    });

    this.setState((prevState, props) => {
      let stack = [...prevState.callStack];
      let call = stack[callIndex];
      call.status = toggle ? "TRANSFER" : "ANSWERED";
      return { callStack: stack };
    });
  };

  

  holdToggle = uuid => {
    let callUUID = this.state.displayCall.uuid;
    let roomID = this.state.displayCall.room;
    let myUUID = this.state.Plivo.PLIVO.client.getCallUUID();
    let callIndex = this.state.callStack.findIndex(obj => {
      return obj.uuid === callUUID;
    });
    console.log(callIndex, this.state.callStack[callIndex]);

    let status =
      this.state.displayCall.status !== "HOLDING" ? "HOLDING" : "ANSWERED";

    if (status === "HOLDING") {
      this.callerHold(myUUID, roomID);
    } else if (status === "ANSWERED") {
      this.callerResume(myUUID, roomID);
    }
    this.updateStack({ status: status }, callIndex);
  };

  holdResumeCall = () => {
    this.holdToggle();
  };

  callerHold = (myUUID, roomID) => {
    this.conferenceCommands("mute>deaf>playAudio", myUUID, roomID);
  };

  callerResume = (myUUID, roomID) => {
    this.conferenceCommands("unmute>undeaf>stopAudio", myUUID, roomID);
  };

  startTimer = (uuid, thisObj) => {
    console.log(uuid);
    let timer = setInterval(function() {
      thisObj.setState((prevState, props) => {
        let stack = [...prevState.callStack];
        let index = prevState.callStack.findIndex(obj => {
          return obj.uuid === uuid;
        });
        let call = stack[index];
        call.duration.callTime++;
        let total = call.duration.callTime;

        let sec = total % 60 < 0 ? total : total % 60;
        let min = total % 3600 < 0 ? total % 3600 : Math.trunc(total / 60);
        let hour = Math.trunc(total / 3600);
        let output = `${hour < 10 ? "0" + hour : hour}:${
          min < 10 ? "0" + min : min
        }:${sec < 10 ? "0" + sec : sec}`;
        call.duration.timeOut = output;

        stack[index] = call;
        return { callStack: stack };
      });
    }, 1000);

    this.setState((prevState, props) => {
      let stack = [...prevState.callStack];
      let index = prevState.callStack.findIndex(obj => {
        return obj.uuid === uuid;
      });
      let call = stack[index];
      call.duration.timer = timer;
      return { callStack: stack };
    });
  };


  render() {
    console.log("PROPS", this.props);
    return (
      <React.Fragment>
        {/* S-Popover */}
        <div className={this.props.UI.popMessage ? "s-pop show-s-pop" : "s-pop"}>
          {/* <div className="triangle-left"></div> */}
          <div className="s-pop-header">Help</div>
          <div className="s-pop-body">{this.props.UI.popMessage}</div>
        </div>

        <div
          id="coin"
          style={{ transform: `rotateY(${this.props.UI.flip}deg)` }}
        >
          <div id="heads" style={{ background: "white" }}>
            <Extended
              contactPhone={this.state.contactPhone}
              setPepperState={this.setPepperState}
            />
          </div>
          <div
            id="tails"
            style={{ background: "#3e3e3e", transform: `rotateY(180deg)` }}
          >
            <AccountOptions />
            <div id="opener">
              <div>PEPPER</div>
              <div id="wheel">
                <div id="b1" className="segment"></div>
                <div id="b2" className="segment"></div>
                <div id="b3" className="segment"></div>
                <div id="b4" className="segment"></div>
              </div>
            </div>

            <div id="main">
              {/* Call Info */}

              <CallInfo
                updateContact={this.updateContact}
                holdResumeCall={this.holdResumeCall}
                endCall={this.endCall}
                answer={this.answer}
                callTransfer={this.callTransfer}
                attendedTransfer={this.attendedTransfer}
                sendTransfer={this.sendTransfer}
                showMetrics={this.state.showMetrics}
                setPepperState={this.setPepperState}
              />

              {/* dial/calllist toggle */}
              <button
                className="btn btn-secondary btn-sm dropdown mb-2"
                type="button"
                id="calls-button"
                onClick={() => this.props.dialPadShow("toggle")}
              >
                <div id="calls-select">
                  {this.props.UI.dialPadShow ? "Live Calls" : "Show Keypad"}
                </div>
                <span className="badge badge-warning">
                  {this.props.calls.callStack.length}
                </span>
              </button>
              {/* Dial Pad */}
              <Dialpad />
              {/* Current Calls */}
              <CurrentCalls
                callSwitch={this.callSwitch}
              />
            </div>
          </div>
        </div>

        {/* Bottom nav/menu */}
        <BottomMenu />

        <script
          type="text/javascript"
          src="https://cdn.socket.io/socket.io-1.0.0.js"
        ></script>
      </React.Fragment>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Pepper);
