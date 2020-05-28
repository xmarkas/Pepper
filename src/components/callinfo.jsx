import React, { Component } from "react";
import ContactData from "./ContactData";
import CallControls from "./CallControls";
import { connect } from "react-redux";
import { popMessage, makeDisplayCall } from "../store/actions/index";
import { plivoCall } from "../util/plivo";
import callUtil from "../util/callUtil";

const mapStateToProps = state => {
  return { UI: state.UI, calls: state.calls, user: state.user };
};

function mapDispatchToProps(dispatch) {
  return {
    popMessage: (msg) => {
      dispatch(popMessage(msg));
      setTimeout(() => {
        dispatch(popMessage(null));
      }, 3200);
    },
    makeDisplayCall: (payload) => dispatch(makeDisplayCall(payload))
  };
}

class CallInfo extends Component {
  state = {
    volume: 25,
    userStatus: "Available",
    statusColor: "#00b700",
    showContacts: "none",
    inputValue: "",
    sortSelectors: ["call", "contact", "favorite"],
    entryInput: "",
    showMetrics: false,
    currentCall: {},
    transferInput: false
  };

  volumeDrag = ev => {
    ev.preventDefault();
    console.log("dragging", ev);

    let setVolume = level => {
      this.setState({ volume: level });
    };

    window.onmousemove = function(ev) {
      let low = 104;
      let high = 309;
      let range = high - low;
      let x = ev.clientX;
      x = x < low ? low : x;
      x = x > high ? high : x;
      let current = ((x - 104) / range) * 100;
      setVolume(current);
    };
  };

  volumeRelease = ev => {
    ev.preventDefault();
    console.log("Release");
    window.onmousemove = null;
  };

  filter = ev => {
    let target = ev.target.value.toUpperCase();

    let transfer =
      this.props.calls.displayCall && this.props.calls.displayCall.status === "TRANSFER";

    console.log("Transfer", transfer);

    // update inputVale
    this.setState({ inputValue: target, entryInput: ev.target.value });

    if (target === "" && ev.currentTarget) {
      this.contactsOff();
      this.setState({ currentCall: {} });
    } else {
      if (
        this.props.calls.displayCall &&
        (this.props.calls.displayCall.status !== "TRANSFER" ||
          this.props.calls.displayCall.status !== "TRANSFER-SELECTED")
      ) {
        this.props.makeDisplayCall(null);
      }
    }

    if (transfer) {
      let display = this.props.calls.displayCall;
      display.status = "TRANSFER-SELECTED";
      this.props.makeDisplayCall(display);
    }
  };

  contactsDisplay = () => {
    this.setState({ showContacts: "block" });
  };

  contactsOff = () => {
    this.setState({ showContacts: "none" });
  };

  changeStatus = ev => {
    let status = ev.target.innerHTML;
    let color = ev.target.style.color;
    this.setState({ userStatus: status, statusColor: color });
  };

  changeSound = ev => {
    let CP = this.state.CP;
    let sound = ev.target.innerHTML;
    let icon = CP.document.getElementById("sound-select").children;
    if (sound === "Speakers") {
      icon[0].style.display = "none";
      icon[1].style.display = "initial";
    } else {
      icon[1].style.display = "none";
      icon[0].style.display = "initial";
    }
  };

  contactSort = (ev, type) => {
    ev.preventDefault();
    let btnClass = ev.currentTarget;
    if (btnClass.className.indexOf(" option-selected") > -1) {
      btnClass.className = btnClass.className.replace(" option-selected", "");

      this.setState(
        (prevState, props) => {
          let copy = [...prevState.sortSelectors];
          copy.splice(copy.indexOf(type), 1);
          return { sortSelectors: copy };
        },
        () => {
          this.filter({
            target: {
              value: this.state.inputValue,
              currentTarget: false
            }
          });
        }
      );
    } else {
      btnClass.className += " option-selected";

      this.setState(
        (prevState, props) => {
          let copy = [...prevState.sortSelectors];
          copy.push(type);
          return { sortSelectors: copy };
        },
        () => {
          this.filter({
            target: { value: this.state.inputValue, currentTarget: false }
          });
        }
      );
    }
  };

  selectContact = (selection, pNumber) => {
    let transfer =
      this.props.calls.displayCall && this.props.calls.displayCall.status === "TRANSFER";
    console.log(transfer);
    let data = {
      ...selection,
      phone: pNumber ? pNumber : selection.phone,
      direction: "Outbound",
      type: "call",
      status: "DIALING",
      room: null
    };

    this.setState({
      entryInput: selection.name,
      inputValue: "",
      showContacts: "none",
      showMetrics: transfer ? true : false,
      currentCall: data
    });

    if (!this.state.transferInput)
      this.props.makeDisplayCall(null);
    if (transfer) {
      let display = this.props.calls.displayCall;
      display.status = "TRANSFER-SELECTED";
      this.props.makeDisplayCall(display);
    }
  };

  clearInput = () => {
    this.setState({
      entryInput: "",
      inputValue: "",
      currentCall: {}
    });

    let currentCall = this.props.calls.callStack.find(obj => {
      return obj.status === "TRANSFER-SELECTED" || obj.status === "ANSWERED";
    });
    if (currentCall) {
      currentCall.status =
        currentCall.status === "TRANSFER-SELECTED"
          ? "TRANSFER"
          : currentCall.status;
      this.props.makeDisplayCall(currentCall);
    }
  };

  makeCall = type => {
    if (this.state.currentCall.phone === undefined) {
      let phone = this.state.entryInput;
      console.log(phone);
      let callObj = {
        name: phone,
        phone: phone,
        altPhone: "",
        email: "",
        type: "call",
        contact: false,
        direction: "Outbound",
        status: "DIALING",
        room: null
      };

      // Check for no number selected
      if (phone === undefined || phone === "") {
        this.props.popMessage("Select a destination number");
        return;
      }

      if (type) {
        callObj.status = type;
        let display = this.props.calls.displayCall;
        display.status = type;
        this.props.makeDisplayCall(display);
      }

      this.setState({ currentCall: callObj, transferInput: false });
      plivoCall(callObj);
    } else {
      if (type) {
        let display = this.props.calls.displayCall;
        display.status = type;
        this.props.makeDisplayCall(display);
      }
      this.setState({ transferInput: false });
      plivoCall(this.state.currentCall);
    }

    this.setState((prevState, props) => {
      return {
        showMetrics: true,
        entryInput: "",
        inputValue: "",
        currentCall: {}
      };
    });
  };

  startTransfer = () => {
    if (this.state.transferInput) {
      callUtil.startTransfer(false);
      this.setState({ transferInput: false });
    } else {
      callUtil.startTransfer(true);
      this.setState({ transferInput: true });
    }
  };

  sendTransfer = () => {
    console.log(this.state.entryInput, this.state.currentCall);
    console.log(isNaN(Number(this.state.entryInput)));
    if (isNaN(Number(this.state.entryInput))) {
      this.props.sendTransfer(this.state.currentCall.phone);
    } else {
      this.props.sendTransfer(this.state.entryInput);
    }
    this.setState({ transferInput: false, inputValue: "", entryInput: "" });
  };

  msgBoard = () => {
    if (this.props.msg !== "") {
      return this.props.msg;
    } else if (!this.props.Plivo.registered) {
      return <span>This phone is not signed in!</span>;
    } else {
      return this.state.entryInput !== "" ? "Make Call" : "Online";
    }
  };

  render() {
    console.log(this.props);
    return (
      <div id="call-info" className="container-fluid mb-2">
        <div className="row">
          <div className="col flex-sb">
            <div id="user-status">
              <div className="dropdown">
                <button
                  className="btn btn-secondary btn-sm dropdown-toggle"
                  type="button"
                  id="status-button"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                  data-offset="0,5"
                >
                  <div
                    id="status-out"
                    style={{ color: this.state.statusColor }}
                  >
                    {this.state.userStatus}
                  </div>
                </button>
                <div
                  id="status-menu"
                  className="dropdown-menu"
                  aria-labelledby="status-button"
                  onClick={ev => this.changeStatus(ev)}
                >
                  <div style={{ color: "#00e800" }}>Available</div>
                  <div style={{ color: "#ff6363" }}>Offline</div>
                  <div style={{ color: "yellow" }}>Busy</div>
                </div>
              </div>
            </div>

            <div id="sound"></div>

            <div className="sound-input">
              <div className="dropdown">
                <button
                  className="btn btn-secondary btn-sm dropdown-toggle"
                  type="button"
                  id="status-button"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                  data-offset="0,5"
                >
                  <div id="sound-select">
                    <i className="fas fa-headset"></i>
                    <i
                      className="fas fa-volume-up"
                      style={{ display: "none" }}
                    ></i>
                  </div>
                </button>
                <div
                  id="status-menu"
                  className="dropdown-menu dropdown-menu-right"
                  aria-labelledby="status-button"
                  onClick={ev => this.changeSound(ev)}
                >
                  <div>Headset</div>
                  <div>Speakers</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-2" onMouseLeave={ev => this.volumeRelease(ev)}>
          <div
            className="col flex-sb"
            style={{ justifyContent: "space-evenly" }}
          >
            <i className="fas fa-volume-up"></i>
            <div className="progress" style={{ width: "65%" }}>
              <div
                className="progress-bar"
                role="progressbar"
                style={{ width: this.state.volume + "%" }}
                aria-valuenow="25"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div
                  id="volume"
                  onMouseDown={ev => this.volumeDrag(ev)}
                  onMouseUp={ev => this.volumeRelease(ev)}
                  style={{ cursor: "pointer" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        <div className="row mt-2">
          <div
            id="entry-wrapper"
            style={
              this.state.transferInput
                ? { boxShadow: "0 0 0px 3px #007bff" }
                : {}
            }
          >
            <div id="entry">
              <input
                id="entry-input"
                list="contacts"
                type="text"
                className={"form-control entry-input"}
                placeholder={
                  this.state.transferInput
                    ? "Transfer destination.."
                    : "Number or contact..."
                }
                onChange={ev => this.filter(ev)}
                value={this.state.entryInput}
              ></input>
              <datalist id="contacts"></datalist>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              {this.state.entryInput !== "" && (
                <i
                  className="fas fa-plus-circle"
                  onClick={this.clearInput}
                  style={{
                    color: "gainsboro",
                    fontSize: "medium",
                    transform: "rotate(45deg)",
                    cursor: "pointer"
                  }}
                ></i>
              )}
            </div>
            <div className="dropdown">
              <button
                className="btn"
                type="button"
                onClick={
                  this.state.showContacts === "none"
                    ? this.contactsDisplay
                    : this.contactsOff
                }
              >
                <i
                  id="contacts-button"
                  className="fas fa-chevron-down"
                  style={
                    this.state.showContacts === "none"
                      ? { transform: "rotate(0deg)" }
                      : { transform: "rotate(180deg)" }
                  }
                ></i>
              </button>
              <div
                id="contact-list"
                className={"dropdown-menu dropdown-menu-right"}
                style={{ display: this.state.showContacts }}
              >
                <div id="contacts-select">
                  <button
                    className={"btn contacts-select-btn option-selected"}
                    onClick={ev => this.contactSort(ev, "call")}
                  >
                    Recent Calls
                  </button>

                  <button
                    className="btn contacts-select-btn option-selected"
                    onClick={ev => this.contactSort(ev, "contact")}
                  >
                    Contacts
                  </button>

                  <button
                    className="btn contacts-select-btn option-selected"
                    onClick={ev => this.contactSort(ev, "favorite")}
                  >
                    Favorites
                  </button>
                </div>
                <div className="contact-add">
                  {/* Contact items */}
                  <ContactData
                    contactsOff={this.contactsOff}
                    contactsDisplay={this.contactsDisplay}
                    showContacts={this.state.showContacts}
                    updateContact={this.props.updateContact}
                    inputValue={this.state.inputValue}
                    sortSelectors={this.state.sortSelectors}
                    selectedContact={this.selectContact}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Call controls */}
        <div className="row mt-2">
          <div className="col">
            <CallControls
              // renderActions={this.props.renderActions}
              makeCall={this.makeCall}
              answer={this.props.answer}
              callTransfer={this.startTransfer}
              transferCancel={this.startTransfer}
              attendedTransfer={this.props.attendedTransfer}
              sendTransfer={this.sendTransfer}
              entryInput={this.state.entryInput}
              holdResumeCall={this.props.holdResumeCall}
            />

            {/* Call metrics */}

            <div id="metrics" className="row pb-2">
              <div
                className="tran-opacity"
                style={{
                  opacity: this.props.calls.displayCall !== null ? 1 : 0,
                  width: "100%"
                }}
              >
                {this.props.calls.displayCall !== null && (
                  <React.Fragment key={1}>
                    <div className="flex-sb">
                      <div id="call-id">
                        {this.props.calls.displayCall
                          ? this.props.calls.displayCall.name
                          : ""}
                      </div>
                      <div id="call-direction">
                        {this.props.calls.displayCall.direction}
                      </div>
                    </div>
                    <div className="flex-sb">
                      <div id="call-duration">
                        Duration:{" "}
                        <span>{this.props.calls.displayCall.duration.timeOut}</span>
                      </div>
                      <div id="call-status">
                        Call status:{" "}
                        <span>{this.props.calls.displayCall.status}</span>
                      </div>
                    </div>
                  </React.Fragment>
                )}
              </div>

              <div
                id="metrics-alt"
                className="tran-opacity"
                style={{
                  opacity: this.props.displayCall !== null ? 0 : 1,
                  position: "absolute"
                }}
              >
                {this.msgBoard()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CallInfo);
