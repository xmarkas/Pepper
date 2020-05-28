import React, { Component } from "react";
import { connect } from "react-redux";
import { toggleFavorite } from "../store/actions/index";

function mapDispatchToProps(dispatch) {
  return {
    toggleFavorite: payload => dispatch(toggleFavorite(payload))
  };
}


let contactColor = [
  "#2196F3",
  "#8bc34a",
  "#ffc107",
  "#00bcd4",
  "#607d8b",
  "#9c27b0",
  "#009688"
];

function getColor() {
  let c = contactColor.pop();
  contactColor.unshift(c);
  return c;
}

class InputList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      color: getColor(),
      showInfo: false
    };
  }

  showInfo = () => {
    this.setState((prevState, props) => {
      return { showInfo: prevState.showInfo ? false : true };
    });
  };

  getType = type => {
    switch (type) {
      case "call":
        return this.props.contact
          ? "fas fa-circle contact"
          : "fas fa-user-circle call";
        break;
      case "contact":
        return "fas fa-circle contact";
        break;
      case "favorite":
        return "fas fa-circle favorite";
        break;
      default:
        return;
    }
  };

  render() {
    return (
      <React.Fragment>
        <tr
          className={"contact-item " + this.props.type}
          // style={{ display: this.props.visible }}
        >
          <td style={{ width: "10%", position: "relative", cursor: "pointer" }}>
            <i
              style={{
                fontSize: "2rem",
                color: this.state.color,
                opacity: "0.9"
              }}
              className={"mx-1 " + this.getType(this.props.type)}
            ></i>
            {this.props.contact && (
              <span className="contact-alpha">{this.props.name[0]}</span>
            )}
          </td>
          <td
            style={{ width: "75%", cursor: "pointer" }}
            onClick={
              this.props.edit
                ? this.showInfo
                : () => this.props.selectedContact(this.props.data)
            }
          >
            <div>{this.props.name}</div>
            <div style={{ fontSize: "smaller" }}>
              {this.props.type === "call" && this.props.direction}
            </div>
          </td>
          <td
            className="text-center"
            style={{ position: "relative", width: "7.5%" }}
            onClick={this.showInfo}
          >
            {this.props.type !== "call" && (
              <i
                className="fas fa-ellipsis-v"
                style={{ cursor: "pointer" }}
              ></i>
            )}
          </td>
          <td
            style={{ position: "relative", width: "7.5%" }}
            className="text-center"
          >
            {this.props.type !== "call" && (
              <i
                style={{ cursor: "pointer" }}
                className={
                  "fas fa-star " +
                  (this.props.type === "favorite"
                    ? "is-favorite"
                    : "not-favorite")
                }
                onClick={() =>
                  this.props.toggleFavorite(
                    {
                      type:
                        this.props.type === "contact" ? "favorite" : "contact",
                        index: this.props.index
                    })
                }
              ></i>
            )}
            <div
              onClick={() => this.props.createContact(true, this.props.name)}
              style={{ cursor: "pointer" }}
            >
              {!this.props.contact && (
                <i className="fas fa-address-card contact-card"></i>
              )}
            </div>
          </td>
        </tr>
        <tr
          className="contact-info-wrap"
          style={{ display: this.state.showInfo ? "table-row" : "none" }}
        >
          <td rowSpan="5" className="contact-info-box">
            <div className="container">
              {/* Edit */}
              {this.props.edit && (
                <div
                  className="contact-edit"
                  onClick={this.props.editContact}
                  style={{
                    position: "absolute",
                    right: "10px",
                    color: "#dedede",
                    zIndex: 900
                  }}
                >
                  <i className="fas fa-pencil-alt"></i>
                </div>
              )}

              <div className="row">
                <div className="col">
                  <div>
                    <span>Phone: </span>
                    <span
                      className="c-info-phone"
                      onClick={() =>
                        this.props.selectedContact(
                          this.props.data,
                          this.props.data.phone
                        )
                      }
                    >
                      {this.props.data.phone.includes("@phone") ? "Internal Number" : this.props.data.phone}
                      {this.props.data.phone.length > 0 && (
                        <i
                          className="fa fa-phone c-after"
                          style={{ color: "#59f559", display: "none" }}
                        ></i>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col">
                  <div>
                    <span>Other: </span>
                    <span
                      className="c-info-phone"
                      onClick={() =>
                        this.props.selectedContact(
                          this.props.data,
                          this.props.data.altPhone
                        )
                      }
                    >
                      {this.props.data.altPhone}
                      {this.props.data.altPhone.length > 0 && (
                        <i
                          className="fa fa-phone c-after"
                          style={{ color: "#59f559", display: "none" }}
                        ></i>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col">
                  <div>
                    <span>Email: </span>
                    <span>{this.props.data.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      </React.Fragment>
    );
  }
}

export default connect(null, mapDispatchToProps)(InputList);
