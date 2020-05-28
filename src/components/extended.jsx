import React, { Component } from "react";
import ContactData from "./ContactData";
import AddContact from "./AddContact";
import { connect } from "react-redux";
import { addContact, editContact } from "../store/actions";

const mapDispatchToProps = dispatch => {
  return {
    addContact: payload => dispatch(addContact(payload)),
    editContact: payload => dispatch(editContact(payload))
  };
};

class Extended extends Component {
  state = {
    inputValue: "",
    formData: {
      "contact-name": "",
      "contact-phone": "",
      "contact-phone-other": "",
      "contact-email": "",
      contact: true
    },
    edit: true,
    editing: false,
    editIndex: null,
    showAddNewContact: false
  };

  filter = ev => {
    let target = ev.target.value.toUpperCase();
    // update inputVale
    this.setState({ inputValue: target });
  };

  updateFormData = ev => {
    ev.persist();
    console.log(ev);
    this.setState((prevState, props) => {
      let data = { ...prevState.formData };
      data[ev.target.id] = ev.target.value;
      return { formData: data };
    });
  };

  formReset = () => {
    this.setState((prevState, props) => {
      return {
        formData: {
          "contact-name": "",
          "contact-phone": "",
          "contact-phone-other": "",
          "contact-email": ""
        }
      };
    });
  };

  submitForm = update => {
    if (update) {
      this.setState(
        (prevState, props) => {
          let data = { ...prevState.formData };
          console.log(data);
          if (data["contact-phone"] === "") {
            data["contact-phone"] = this.props.contactPhone;
          }
          return { formData: data };
        },
        () => {
          this.props.addContact(this.state.formData);
          this.showAddNew(false);
          this.formReset();
        }
      );
    } else {
      this.formReset();
    }
  };

  editContact = (data, index) => {
    console.log(data);
    this.setState(
      (prevState, props) => {
        return {
          formData: {
            "contact-name": data.name,
            "contact-phone": data.phone,
            "contact-phone-other": data.altPhone,
            "contact-email": data.email
          },
          editIndex: index
        };
      },
      () => {
        this.showAddNew(true);
      }
    );
  };

  sendEdit = () => {
    this.showAddNew(false);
    this.props.editContact(
      {
        data: {
          name: this.state.formData["contact-name"],
          phone: this.state.formData["contact-phone"],
          altPhone: this.state.formData["contact-phone-other"],
          email: this.state.formData["contact-email"]
        },
        editIndex: this.state.editIndex
      });
  };

  showAddNew = toggle => {
    if (toggle !== undefined) {
      this.setState({ showAddNewContact: toggle });
      if (!toggle) {
        this.formReset();
        this.setState({ editIndex: null });
      }
    } else {
      let toggleVal = this.state.showAddNewContact ? false : true;
      this.setState({ showAddNewContact: toggleVal });
      if (!toggleVal) {
        this.formReset();
        this.setState({ editIndex: null });
      }
    }
  };

  render() {
    return (
      <React.Fragment>
        <div id="extended-menu" style={{ textAlign: "center" }}>
          <button
            className="btn btn-sm btn-primary"
            style={{ borderRadius: ".8rem 0 0 .8rem" }}
          >
            Contacts
          </button>
          <button
            className="btn btn-sm btn-success"
            style={{ borderRadius: "0" }}
          >
            Messages
          </button>
          <button
            className="btn btn-sm btn-warning"
            style={{ borderRadius: "0 .8rem .8rem 0" }}
          >
            Extended
          </button>
        </div>

        <div id="extended-containter">
          <div id="contacts-home">
            <div
              className="mt-2"
              style={{ color: "dimgray", textAlign: "center" }}
            >
              Contacts
            </div>
            {/* Add New */}
            <AddContact
              showAddNew={this.showAddNew}
              showAddNewContact={this.state.showAddNewContact}
              show={this.props.toggleAddContact}
              contactPhone={this.props.contactPhone}
              updateFormData={this.updateFormData}
              formData={this.state.formData}
            />
            <hr></hr>
            <div className="contacts-search container-fluid">
              <div className="row">
                <div className="col-9">
                  <input
                    id="entry-input"
                    type="text"
                    className="form-control"
                    placeholder="Number or contact..."
                    onChange={ev => this.filter(ev)}
                    // onBlur={this.contactsOff}
                  ></input>
                </div>
                <div
                  className="col-3"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  {!this.state.showAddNewContact && (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => this.showAddNew(true)}
                    >
                      New
                    </button>
                  )}
                  {this.state.showAddNewContact &&
                    this.state.editIndex === null && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => this.submitForm(true)}
                      >
                        Add
                      </button>
                    )}
                  {this.state.editIndex !== null && (
                    <button
                      className="btn btn-sm btn-warning"
                      onClick={() => this.sendEdit()}
                    >
                      Update
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="contact-add">
              {/* contacts table */}
              <ContactData
                sortSelectors={["contact", "favorite"]}
                inputValue={this.state.inputValue}
                edit={this.state.edit}
                editContact={this.editContact}
              />
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default connect(null, mapDispatchToProps)(Extended);
