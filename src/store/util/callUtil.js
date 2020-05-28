/**
 * File:        callUtil.js
 * 
 * Description: Handles placing calls in room and actions taken on calls.
 * 
 */
import store from "../store/js/index";
import { updateStack, popMessage, addContact, dialPadShow, makeDisplayCall } from "../store/actions/index";
import { ANSWERED, ATTENDED_TRANSFER, TERMINATED, HOLDING } from "../call-status-types";
import { plivo } from "./plivo";
import { getSocket } from "./socket";

let conferenceMethodsURL = "https://qumoc.com/beta/plivo/conferenceMethods";
let transferURL = "https://qumoc.com/beta/plivo/transfer";
let sendToRoomURL = "https://qumoc.com/beta/plivo/sendToRoomXML?room=";
let switchRoomURL = "https://qumoc.com/beta/plivo/switchRooms?room=";
let sendTransfer = "https://qumoc.com/beta/plivo/sendTransfer";

// Call utility methods
let methods = {};

// Room number generater
let rooms = [];
function genRoomNumber(room) {
  let userId = store.getState().user.id
  if (room) {
    let num = Number(room.slice(room.indexOf(".") + 1));
    if (!rooms.includes(num)) {
      console.log("section a")
      rooms.push(num);
      rooms.sort();
      return `${userId}.${num}`;
    }
  } else {
    if (rooms.length === 0) {
      console.log("section b")
      rooms.push(1);
      return `${userId}.${1}`;
    }
    for (let index = 0; index < rooms.length; index++) {
      if ((rooms[index] + 1) !== rooms[index + 1]) {
        console.log("section d", rooms)
        rooms.push(rooms[index] + 1);
        rooms.sort();
        return `${userId}.${rooms[index] + 1}`;
      }
    }
  }
}

// Place call in room
methods.placeCallInRoom = (uuid, direction, callIndex) => {
  let state = store.getState();
  let roomId = genRoomNumber(state.calls.callStack[callIndex].room);
  console.log("ROOM ID", roomId);
  fetch(
    `${transferURL}?uuid=${uuid}&direction=${direction}&legs=both&alegurl=${sendToRoomURL +
    roomId}&blegurl=${sendToRoomURL + roomId}`,
    { method: "POST" }
  )
    .then(res => res.json())
    .then(res => {
      console.log(res);
      let referenceUUID = res[0] === uuid ? res[1] : res[0];
      if (referenceUUID !== undefined) {
        let stack = [...state.calls.callStack];
        let call = { ...stack[callIndex], uuid: referenceUUID, room: roomId };
        stack[callIndex] = call;
        store.dispatch(updateStack(stack));
        store.dispatch(makeDisplayCall(call));
      }
    });
};

methods.switchRooms = (room, uuid) => {
  fetch(`${switchRoomURL}${room}&uuid=${uuid}`, { method: "POST" })
    // .then(res => res.json())
    .then(res => {
      console.log(res);
    });
};

/**
   * Conference member commands
   *
   * @param {String} commands mute, unmute, deaf, undeaf, playAudio, stopAudio, hangup
   * @param {String} memberUUID The UUID of the conference member
   * @param {String} room Conference room name
   *
   * Commands Example - "mute>deaf>playAudio>hangup"
   */
methods.conferenceCommands = (commands, myUUID, room) => {
  let URL =
    conferenceMethodsURL +
    `?room=${room}&uuid=${myUUID}&commands=${commands}`;
  fetch(URL, { method: "POST" })
    .then(result => {
      console.log(result);
    })
    .catch(err => {
      console.log(err);
    });
};

// End Call Clean Up
methods.endCallCleanUp = callIndex => {
  let state = store.getState();

  // If call has already been terminated by Arnold Schwartenager
  if (state.calls.callStack[callIndex].status === TERMINATED) return;

  // Stop Attended Transfer
  console.log(state.calls.displayCall);
  if (
    state.calls.displayCall &&
    state.calls.displayCall === ATTENDED_TRANSFER
  ) {

    methods.switchRooms(
      state.user.id + ".LIMBO",
      plivo.client.getCallUUID()
    );
    return;
  }

  // clearInterval(state.calls.callStack[callIndex].duration.timer);

  let stack = [...state.calls.callStack];
  let call = { ...stack[callIndex], status: TERMINATED };
  stack[callIndex] = call;
  methods.stackUpdater(stack);

  setTimeout(() => {
    let state = store.getState();
    let removed = stack.splice(callIndex, 1); // Remove from callStack
    if (removed[0]) {
      methods.stackUpdater(stack);
      store.dispatch(addContact(removed[0])); // Add to contact list
    }

    console.log("STATE", state);
    if (state.calls.callStack.length === 0) {
      plivo.client.hangup();
      store.dispatch(dialPadShow(true));
      store.dispatch(makeDisplayCall(null));
    } else {
      if (state.calls.displayCall && state.calls.displayCall.status !== ANSWERED) {
        methods.switchRooms(
          state.user.id + ".LIMBO",
          plivo.client.getCallUUID()
        );
        store.dispatch(makeDisplayCall(null));
      }
    }
  }, 2000);
};

methods.callSwitch = (index) => {
  let state = store.getState();
  let displayCall = state.calls.displayCall;
  if (displayCall && displayCall.room !== null) {
    let stack = [...state.calls.callStack];
    let call = stack.find(obj => {
      return obj.room === displayCall.room;
    });
    call.status = HOLDING;

    let callObj = stack[index];
    if (callObj.room !== null) {
      methods.switchRooms(
        callObj.room,
        plivo.client.getCallUUID()
      );
      callObj.status = ANSWERED;
    }
    methods.stackUpdater(stack);
    store.dispatch(makeDisplayCall(callObj));
  } else {
    let callObj = state.calls.callStack[index];

    if (callObj.room !== null) {
      methods.switchRooms(
        callObj.room,
        plivo.client.getCallUUID()
      );
    }
    let stack = [...state.calls.callStack];
    let call = stack[index];
    call.status = ANSWERED;
    methods.stackUpdater(stack);
    store.dispatch(makeDisplayCall(call));
  }

}

methods.startTransfer = (toggle) => {
  let state = store.getState();
  let uuid = state.calls.displayCall.uuid;

  let callIndex = state.calls.callStack.findIndex(obj => {
    return obj.uuid === uuid;
  });

  let stack = [...state.calls.callStack];
  let call = stack[callIndex];
  call.status = toggle ? "TRANSFER" : "ANSWERED";
  methods.stackUpdater(stack);
}

methods.attendedTransfer = () => {
  let state = store.getState();
  let uuid = plivo.client.getCallUUID();
  let sendCallUUID = state.calls.displayCall.uuid;

  let stack = [...state.calls.callStack];
  let call = stack.find(obj => {
    return obj.uuid === sendCallUUID;
  });
  call.status = "TRANSFERED";
  methods.stackUpdater(stack);

  fetch(`https://qumoc.com/beta/plivo/getCallInfo?uuid=${uuid}`, {
    methods: "GET"
  })
    .then(res => res.json())
    .then(result => {
      console.log(result);
      let dest = result.to;
      if (dest.includes("@phone.plivo")) {
        getSocket().send(
          JSON.stringify({
            method: "pushTransfer",
            data: { transferUUID: sendCallUUID, currentCallUUID: uuid }
          })
        );
      } else {
        fetch(
          `https://qumoc.com/beta/plivo/sendTransfer?uuid=${sendCallUUID}&dest=${dest}`,
          { method: "POST" }
        ).then(result => {
          console.log(result);
        });
      }
    });
}


methods.stackUpdater = (stack) => {
  store.dispatch(updateStack(stack));

  // Update displayCall
  let calls = store.getState().calls;
  if (calls.displayCall) {
    let displayUUID = calls.displayCall.uuid;
    let target = stack.find(obj => { return obj.uuid === displayUUID });
    if (target) {
      console.log("UPDATE DISPLAY CALL ---->")
      store.dispatch(makeDisplayCall(target));
    }
  }
}

methods.popUtil = (msg) => {
  store.dispatch(popMessage(msg));
  setTimeout(() => {
    store.dispatch(popMessage(null));
  }, 3200)
}

methods.numberLookUp = (num) => {
  let state = store.getState();

  // Search contact data for known contact

  for (let c = 0; c < state.contactData.length; c++) {
    if (num.includes("plivo.com")) {
      if (num === state.contactData[c].phone) {
        return state.contactData[c].name;
      }
    } else {
      let A = state.contactData[c].phone.replace(/\W/g, "");
      let B = state.contactData[c].altPhone.replace(/\W/g, "");
      if (
        A.includes(num) ||
  
        B.includes(num)
      ) {
        return state.contactData[c].name;
      }
    }
  }
}
/**
 * EXPORT METHODS
 */
export default methods;

