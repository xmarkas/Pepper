import React, { Component } from "react";
import InputList from "./InputList";
import { connect } from "react-redux";

let count = 0;
let cIndex = 0;

const mapStateToProps = state => {
  return { contactData: state.contactData };
};

class ContactData extends Component {
  state = {};

  componentDidUpdate() {
    if (cIndex + 1 === this.props.contactData.length) {
      if (
        count > 0 &&
        this.props.showContacts === "none" &&
        this.props.inputValue !== "" &&
        this.props.contactsDisplay !== undefined
      ) {
        this.props.contactsDisplay();
      } else if (count === 0 &&
        this.props.showContacts !== "none" &&
        this.props.inputValue !== "" &&
        this.props.contactsDisplay !== undefined) {
        this.props.contactsOff();
      }
    }
  }

  render() {
    count = 0;
    return (
      <table
        style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: "6px"
        }}
      >
        {/* Array of InputList components */}
        <tbody id="input-list">
          {this.props.contactData.map(
            (item, index) => {
              if (!item) return;
              let name = item.name.toUpperCase();

              cIndex = index;

              if (
                name.indexOf(this.props.inputValue) > -1 &&
                this.props.sortSelectors.indexOf(item.type) > -1
              ) {
                count++;

                return (
                  <InputList
                    data={item}
                    key={index}
                    index={index}
                    name={item.name}
                    type={item.type}
                    direction={item.direction}
                    contact={item.contact}
                    selectedContact={this.props.selectedContact}
                    edit={this.props.edit}
                    editContact={() => this.props.editContact(this.props.contactData[index], index)}
                  />
                );
              } else {
                return false;
              }
            }
          )}
        </tbody>
      </table>
    );
  }
}

export default connect(mapStateToProps)(ContactData);
