/**
 * file:        contact.js
 * 
 * Description: Logic for creating and editing contacts
 * 
 */

let methods = {};

methods.addContact = (data) => {
    let {name,phone,altPhone, email, type, direction, contact } = data;
    let newContact = {
        name: name || data["contact-name"] || "",
        phone: phone || data["contact-phone"] || "",
        altPhone: altPhone || data["contact-phone-other"] || "",
        email: email || data["contact-email"] || "",
        type: type || "contact",
        contact: contact ? true : false,
        direction: direction || "",
        visible: "table-row"
    };
    return newContact;
}

methods.contactsWithSameNumber = (data, contactData) => {

    let phones = [data["contact-phone"], data["contact-phone-other"]];
    let list = [...contactData];

    for (let i = 0; i < list.length; i++) {
        if (list[i].type === "call") {
            if (
                phones.includes(list[i].phone) ||
                phones.includes(list[i].altPhone)
            ) {
                list[i].name = data["contact-name"];
                list[i].contact = true;
            }
        }
    }

    return list;

}

/**
 * EXPORT METHODS
 */
export default methods;
