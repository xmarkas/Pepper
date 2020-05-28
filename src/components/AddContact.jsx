import React, { Component } from "react";

class AddContact extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formData: this.props.formData
    };
  }

  render() {
    return (
      <div
        id="add-contact-wrap"
        style={{
          opacity: this.props.showAddNewContact ? 1 : 0,
          height: this.props.showAddNewContact ? "46vh" : "0vh"
        }}
      >
        <i
          className="fas fa-times-circle"
          onClick={() => this.props.showAddNew(false)}
          style={{
            color: "red",
            position: "absolute",
            top: "4px",
            right: "4px"
          }}
        ></i>
        <div id="add-contact">
          <div>
            <span>Contact Name</span>
            <input
              id="contact-name"
              type="text"
              className="form-control"
              onChange={ev => this.props.updateFormData(ev)}
              value={
                this.props.formData ? this.props.formData["contact-name"] : ""
              }
            />
          </div>
          <div>
            <span>Primary Phone</span>
            <input
              id="contact-phone"
              type="text"
              className="form-control"
              onChange={ev => this.props.updateFormData(ev)}
              value={
                this.props.formData["contact-phone"] === ""
                  ? this.props.contactPhone
                  : this.props.formData["contact-phone"]
              }
            />
          </div>
          <div>
            <span>Other Phone</span>
            <input
              id="contact-phone-other"
              type="text"
              className="form-control"
              onChange={ev => this.props.updateFormData(ev)}
              value={
                this.props.formData
                  ? this.props.formData["contact-phone-other"]
                  : ""
              }
            />
          </div>
          <div>
            <span>Email</span>
            <input
              id="contact-email"
              type="text"
              className="form-control"
              onChange={ev => this.props.updateFormData(ev)}
              value={
                this.props.formData ? this.props.formData["contact-email"] : ""
              }
            />
          </div>
        </div>
      </div>
    );
  }
}

export default AddContact;
