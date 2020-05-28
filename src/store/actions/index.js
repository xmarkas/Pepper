import {
  FLIP_DISPLAY, DIALPAD_SHOW, ACCOUNT_SHOW, ADD_CONTACT,
  EDIT_CONTACT, TOGGLE_FAVORITE, POP_MESSAGE, SET_USER_ID,
  ADD_CALL, UPDATE_STACK, MAKE_DISPLAY_CALL, CALL_SWITCH,
  SET_CLAN_CALL
} from "../constants/action-types";


export function flipDisplay() {
  return { type: FLIP_DISPLAY }
};

export function dialPadShow(payload) {
  return { type: DIALPAD_SHOW, payload }
}

export function accountShow(payload) {
  return { type: ACCOUNT_SHOW, payload }
}

export function addContact(payload) {
  return { type: ADD_CONTACT, payload }
}

export function editContact(payload) {
  return { type: EDIT_CONTACT, payload }
}

export function toggleFavorite(payload) {
  return { type: TOGGLE_FAVORITE, payload }
}

export function popMessage(payload) {
  return { type: POP_MESSAGE, payload }
}


// Plivo
export function setUserId(payload) {
  return { type: SET_USER_ID, payload }
}

// Calls
export function addCall(payload) {
  return { type: ADD_CALL, payload}
}

export function updateStack(payload) {
  return {type: UPDATE_STACK, payload}
}

export function makeDisplayCall(payload) {
  return { type: MAKE_DISPLAY_CALL, payload}
}

export function callSwitch(payload) {
  return {type: CALL_SWITCH, payload}
}

export function setClanCall(payload) {
  return { type: SET_CLAN_CALL, payload}
}
