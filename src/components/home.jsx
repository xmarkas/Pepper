import React, { Component } from "react";
// import Pepper from "./pepper";

class home extends Component {
  state = {
    childPhone: null
  };

  

  launchPhone = thisObj => {
    // let windowOptions =
    //   "width=350,height=600,scrollbars=0,location=no,menubar=0,titlebar=0," +
    //   "navigation=0,centerscreen=1,chrome=on, resizable=0, top=50,left=100";
    // let childPhone = window.open(`phone.html`, "CP", windowOptions);
    // childPhone.focus();
    // this.setState({ childPhone: childPhone });
    // childPhone.onload = function() {
    //   ReactDOM.render(
    //     <Pepper CP={thisObj.state.childPhone} />,
    //     childPhone.document.getElementById("root2")
    //   );
    // };
    // return childPhone;
  };

  render() {
    return (
      <div id="page-wrap" className="container-fluid">
        <div id="head-top" className="row justify-content-center">
          <div
            className="col-6 d-flex justify-content-center align-items-center"
            style={{ height: 20 + "vh" }}
          >
            <button
              className="btn btn-success h-25"
              onClick={() => this.launchPhone(this)}
            >
              Launch
            </button>
          </div>
        </div>
        
      </div>
    );
  }
}

export default home;
