/**
 *  PEPPER REDUX STORE - REDUCER
 * 
 */
import ContactUtil from "../../util/contacts.js";

const initialState = {
    calls: {
        callStack: [],
        displayCall: null,
        clanCall: null
    },
    contactData: [],
    UI: {
        flip: 180,
        dialPadShow: true,
        accountShow: false,
        popMessage: null
    },
    user: {
        id: null,
        PlivoUser: null,
        socket: false
    }
};

function rootReducer(state = initialState, action) {
    if (Object.keys(reducers).includes(action.type)) {
        return reducers[action.type](state, action.payload);
    } else {
        return state;
    }
};

let reducers = {};

reducers.FLIP_DISPLAY = (state) => {
    let deg = state.UI.flip === 180 ? 0 : 180;
    let UI = { ...state.UI, flip: deg };
    return { ...state, UI: UI };
}

reducers.DIALPAD_SHOW = (state, payload) => {
    let toggle = state.UI.dialPadShow ? false : true;
    let dialPadShow = payload === "toggle" ? toggle : payload;
    let UI = { ...state.UI, dialPadShow: dialPadShow };
    return { ...state, UI }
}

reducers.ACCOUNT_SHOW = (state, payload) => {
    let toggle = state.UI.accountShow ? false : true;
    let accountShow = payload === "toggle" ? toggle : payload;
    let UI = { ...state.UI, accountShow: accountShow };
    return { ...state, UI }
}

reducers.ADD_CONTACT = (state, payload) => {
    let data = ContactUtil.contactsWithSameNumber(payload, state.contactData);
    data.push(ContactUtil.addContact(payload));
    return { ...state, contactData: data }
}

reducers.EDIT_CONTACT = (state, payload) => {
    let contacts = [...state.contactData];
    let { name, phone, altPhone, email } = payload.data;
    contacts[payload.editIndex] = {
        ...contacts[payload.editIndex],
        name: name,
        phone: phone,
        altPhone: altPhone,
        email: email
    }
    return { ...state, contactData: contacts };
}

reducers.TOGGLE_FAVORITE = (state, payload) => {
    let contacts = [...state.contactData];
    contacts[payload.index].type = payload.type;
    return { ...state, contactData: contacts };
}

reducers.POP_MESSAGE = (state, payload) => {
    let UI = { ...state.UI, popMessage: payload };
    return { ...state, UI };
}

reducers.SET_USER_ID = (state, payload) => {
    if (payload.method === "id") {
        return { ...state, user: {...state.user, id: payload.data } };
    } else if (payload.method === "PlivoUser") {
        return { ...state, user: {...state.user, PlivoUser: payload.data } };
    } else if (payload.method === "SocketSuccess") {
        if (payload.data === true) {
            return { ...state, user: { ...state.user, socket: true } };
        } else {
            return { ...state, user: { ...state.user, socket: false } };
        }
    }
}

reducers.ADD_CALL = (state, payload) => {
    let stack = [...state.calls.callStack];
    stack.unshift(payload);
    let calls = { ...state.calls, callStack: stack };
    return { ...state, calls: calls };
}

reducers.UPDATE_STACK = (state, payload) => {
    let calls = { ...state.calls, callStack: payload };
    return { ...state, calls: calls };
}

reducers.MAKE_DISPLAY_CALL = (state, payload) => {
    let calls = { ...state.calls, displayCall: payload };
    return { ...state, calls: calls };
}

reducers.SET_CLAN_CALL = (state, payload) => { 
    return { ...state, calls: { ...state.calls, clanCall: payload } };
}

export default rootReducer;