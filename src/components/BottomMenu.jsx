import React, { Component } from "react";
import { connect } from "react-redux";
import { flipDisplay, accountShow } from "../store/actions/index";

const mapStateToProps = state => {
  return { UI: state.UI, user: state.user };
};

function mapDispatchToProps(dispatch) {
  return {
    flipDisplay: () => dispatch(flipDisplay()),
    accountShow: toggle => dispatch(accountShow(toggle))
  };
}

class BottomMenu extends Component {
  state = {}
  render() {
    return (
      <div id="nav-menu">
        <div onClick={this.props.flipDisplay}>
          {/* this.flip */}
          {this.props.UI.flip === 180 ? (
            <i className="fas fa-bars" style={{ cursor: "pointer" }}></i>
          ) : (
            <i className="fas fa-phone" style={{ cursor: "pointer" }}></i>
          )}
        </div>
        <div onClick={ () => this.props.accountShow("toggle")}>
          {/* this.showAccount */}
          <i className="far fa-user" style={{ cursor: "pointer" }}></i>
          {!this.props.user.PlivoUser && !this.props.user.socket && (
            <i
              className="fas fa-exclamation"
              style={{
                position: "absolute",
                color: "#f44336",
                top: "11px",
                right: "98px"
              }}
            ></i>
          )}
        </div>

        {/* logo */}
        <div id="opener-post">
          <div>PEPPER</div>
          <div id="wheel-post">
            <div id="b1" className="segment"></div>
            <div id="b2" className="segment"></div>
            <div id="b3" className="segment"></div>
            <div id="b4" className="segment"></div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(BottomMenu);
