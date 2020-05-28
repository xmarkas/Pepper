import React, { Component } from "react";
import { connect } from "react-redux";
import { accountShow } from "../store/actions/index";
import { plivoLogin } from "../util/plivo"

const mapStateToProps = state => {
  return { UI: state.UI, user: state.user };
};

function mapDispatchToProps(dispatch) {
  return {
    accountShow: toggle => dispatch(accountShow(toggle))
  };
}

class AccountOptions extends Component {
  state = {
    username: "", // no save state for demo
    password: "", // no save state for demo
    displayName: ""
  };

  login = () => {
    plivoLogin(this.state.username, this.state.password);
  }

  render() {
    return (
      <div id="account-options" style={{ display: this.props.UI.accountShow ? "initial" : "none" }}>
        <div style={{ textAlign: "center" }}>Account Settings</div>
        <div>
          <div className="user-details">
            <div className="input-wrap">
              <span>Plivo: USERNAME</span>
              <input
                type="text"
                defaultValue="Mark121951654970693"
                onChange={ev => {
                  this.setState({ username: ev.target.value });
                }}
              />
            </div>
            <div className="input-wrap">
              <span>Plivo: Password</span>
              <input
                type="password"
                defaultValue="mark@"
                onChange={ev => {
                  this.setState({ password: ev.target.value });
                }}
              />
            </div>
            <div className="input-wrap">
              <span>Domain</span>
              <input type="text" />
            </div>
            <div className="input-wrap mb-2">
              <span>Display Name</span>
              <input
                type="text"
                onChange={ev => {
                  this.setState({ displayName: ev.target.value });
                }}
              />
            </div>
          </div>
          <div className="user-details" style={{ fontSize: "medium" }}>
            <div>Account status: </div>
            <div id="account-status">
              {this.props.user.PlivoUser
                ? "Phone Registered!"
                : "This phone is not registered"}
              {(!this.props.user.socket && this.props.user.PlivoUser) && (<div>COMM Socket Failed!</div>)}
            </div>
          </div>
        </div>
        <div
          style={{
            textAlign: "center",
            justifyContent: "space-evenly",
            display: "flex"
          }}
        >
          {true && (
            <button
              id="account-submit"
              className="btn btn-sm btn-success"
              onClick={this.login}
            >
              Login
            </button>
          )}
          {true && (
            <button
              id="account-submit"
              className="btn btn-sm btn-success"
              onClick={() =>
                this.props.login({
                  username: this.state.username,
                  password: this.state.password,
                  displayName: this.state.displayName
                })
              }
            >
              Logout
            </button>
          )}
          <button
            id="account-close"
            className="btn btn-sm btn-danger"
            onClick={() => this.props.accountShow(false)}
          >
            Close
          </button>
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountOptions);
