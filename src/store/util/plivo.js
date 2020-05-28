/**
 * File:        plivo.js
 * 
 * Description: Plivo utility file for instantiating the Plivo SDK
 *              and Plivo call events and methods.
 * 
 */
import store from "../store/js/index";
import { addContact, setUserId, addCall, updateStack, makeDisplayCall, dialPadShow } from "../store/actions/index";
import { socketInit } from "./socket";
import { ANSWERED, HOLDING, DIALING, ATTENDED_TRANSFER, TRANSFER } from "../call-status-types";
import callUtil from "./callUtil";

// Initialize Plivo
var options = {
    debug: "INFO",
    permOnClick: true,
    audioConstraints: {
        optional: [
            { googAutoGainControl: true },
            { googEchoCancellation: true }
        ]
    },
    enableTracking: true,
    codecs: ["OPUS", "PCMU"],
    allowMultipleIncomingCalls: true
};

export const plivo = new window.Plivo(options);

// Utility methods
export const plivoLogin = (username, password) => {
    store.dispatch(setUserId({ method: "id", data: username }));
    setTimeout(() => {
        plivo.client.login(username, password);
    }, 500);
}

export const plivoCall = (callObj) => {
    let state = store.getState();
    /**
    * Any calls with status of ANSWERED will be set to HOLDING.
    * The conference callback executes the holding methods by room
    * state and number of calls in the room.
    *
    * */
    if (plivo.client.getCallUUID()) {
        let stack = [...state.calls.callStack];
        stack.forEach((c, index) => {
            if (c.status === ANSWERED) {
                stack[index].status = HOLDING;
            }
        });

        store.dispatch(updateStack(stack));
        plivo.client.hangup();
    }

    let { dial, displayNumber } = phoneNumberCheckFormat(callObj.phone);
    if (callObj.contact === false) callObj.name = displayNumber;


    sendCall(callObj, dial, displayNumber);
}

function sendCall(callObj, dial, display) {
    // Setup call timer
    let call = callTimer(callObj);

    // Initiate call
    if (!dial.includes("plivo.com")) {
        plivo.client.call(dial, {
            "X-PH-callerId": "12062592279"
        });
    } else {
        
    }


    plivo.client.setConnectTone(false);

    // Add call to stack
    if (callObj.status !== ATTENDED_TRANSFER) {
        store.dispatch(addCall(call));
        store.dispatch(makeDisplayCall(call));
    }

}

export const endCall = () => {
    let state = store.getState();
    // Hangup Attended Transfer
    if (state.calls.displayCall.status === ATTENDED_TRANSFER) {
        plivo.hangup();
        let display = { ...state.calls.displayCall, status: TRANSFER };
        store.dispatch(makeDisplayCall(display));
    }

    let uuid = state.calls.displayCall.uuid;
    let room = state.calls.displayCall.room;
    let myUUID = plivo.client.getCallUUID();
    let callIndex = state.calls.callStack.findIndex(obj => {
        return obj.uuid === uuid;
    });

    // Hang up the other leg in the conference room
    if (
        room !== null &&
        state.calls.displayCall.status !== ATTENDED_TRANSFER
    ) {
        callUtil.conferenceCommands("hangup", myUUID, room);
    }
    callUtil.endCallCleanUp(callIndex);
};



/**
 *      PLIVO EVENT LISTENERS
 * 
 */


/**
 * Method:      onLogin
 * 
 * Description: On a successful Plivo login the Plivo user ID is used
 *              to register a websocket, user endpoints from the user
 *              group are added as contacts, and then an API call is 
 *              made to see if the user has any ongoing calls in rooms
 * 
 */
plivo.client.on("onLogin", () => {
    socketInit();
    let userId = store.getState().user.id;
    // Get endpoints associated with this account
    fetch("https://qumoc.com/beta/plivo/getEndpoints")
        .then(res => res.json())
        .then(result => {
            console.log(result);
            result.forEach(e => {
                if (userId === e.username) {
                    store.dispatch(setUserId({ method: "PlivoUser", data: e }));
                    console.log(e);
                } else {
                    let data = {
                        "contact-name": e.alias,
                        "contact-phone": e.sipUri.slice(e.sipUri.indexOf(":") + 1),
                        "contact-phone-other": " ",
                        "contact-email": " ",
                        sipID: e.id,
                        contact: true
                    };
                    store.dispatch(addContact(data));
                }
            });
            getOpenConferences();
        })
        .catch(err => {
            console.log(err);
        });

    // Get any open calls in open conference room
    let getOpenConferences = () => {
        let state = store.getState();
        fetch(
            `https://qumoc.com/beta/plivo/myConferences?sipid=${state.user.id}`
        )
            .then(res => res.json())
            .then(result => {
                console.log(result);
                // If calls reconnect user to LIMBO
                if (result.length > 0) {
                    fetch(
                        `https://qumoc.com/beta/plivo/reviveClient?sipid=${state.user.id}&sipuri=${state.user.PlivoUser.sipUri}`
                    )
                        .then(result => {
                            console.log("Success");
                        })
                        .catch(err => {
                            console.log("Failed", err);
                        });
                }

                result.forEach(conf => {
                    let callObj = {
                        name: conf.phoneNumber,
                        phone: conf.phoneNumber,
                        altPhone: "",
                        email: "",
                        type: "call",
                        contact: false,
                        direction:
                            conf.direction === "inbound" ? "Inbound" : "Outbound",
                        status: "HOLDING",
                        uuid: conf.memberUUID,
                        room: conf.name
                    };

                    let start = new Date().getTime();
                    callObj.duration = {
                        start: start,
                        callTime: 0,
                        timeOut: "00:00:00"
                    };
                    store.dispatch(addCall(callObj));
                });
            });
    };
}
);


// LOGIN FAILED
plivo.client.on("onLoginFailed", () => {
    callUtil.popUtil("Login Failed");
});

// Remote Ringing
plivo.client.on("onCallRemoteRinging", callInfo => {
    let state = store.getState();
    let index = state.calls.callStack.findIndex(obj => {
        return obj.status === DIALING;
    });

    if (index > -1) {
        let stack = [...state.calls.callStack];
        let call = { ...stack[index], status: callInfo.state.toUpperCase(), uuid: callInfo.callUUID };
        stack[index] = call;
        store.dispatch(makeDisplayCall(call));
        callUtil.stackUpdater(stack);
    }
});

// Call Answered
plivo.client.on("onCallAnswered", callInfo => {
    let state = store.getState();
    /**
     * Special Situation where the call is handled differently
     * and placed into a different room or no room.
     *
     */
    // Handles reviveClient
    if (callInfo.src.includes(state.user.id) && callInfo.dest === callInfo.src) {
        console.log(">>>>>> USER placed in LIMBO", callInfo);
        callUtil.switchRooms(`${state.user.id}.LIMBO`, callInfo.callUUID);
        return;
    } else if (state.calls.displayCall.status === ATTENDED_TRANSFER) {
        // Client answers phone on attended transfer
        let display = { ...state.calls.displayCall };
        display.status = "TRANSFER-READY";
        store.dispatch(makeDisplayCall(display));
        return;
    }

    let index = state.calls.callStack.findIndex(obj => {
        return obj.uuid === callInfo.callUUID;
    });

    if (index > -1) {
        let stack = [...state.calls.callStack];
        let call = { ...stack[index], status: callInfo.state.toUpperCase(), uuid: callInfo.callUUID };
        stack[index] = call;

        callUtil.stackUpdater(stack);
    }

    // Check for ClanCall (internal)
    if (callInfo.src.includes("2062592279")) {
        // Do nothing wait for socket to handle operation
    } else if (state.calls.displayCall.status === ATTENDED_TRANSFER) {
        // Attended Transfer
    } else {
        callUtil.placeCallInRoom(callInfo.callUUID, callInfo.direction, index);
    }
});

// Call Terminated
plivo.client.on("onCallTerminated", (hangUpInfo, callInfo) => {
    console.log(callInfo, hangUpInfo);
});

// Call Failed
plivo.client.on("onCallFailed", (cause, callInfo) => {
    console.log(cause, callInfo);
});

// Incoming Call
plivo.client.on("onIncomingCall", async (callerID, extraHeaders, callInfo) => {
    let state = store.getState();
    // Handles reviveClient
    if (callerID.includes(state.user.id)) {
        plivo.client.answer();
        return;
    }
    if (state.calls.callStack.length > 0) store.dispatch(dialPadShow(true)); // Show call list if more than 1 call

    let clanCall = state.calls.clanCall;

    // Number lookup
    let { dial, displayNumber, contact } = phoneNumberCheckFormat(callInfo.src);

    // Clan Call
    // if ("12062592279".includes(callInfo.src)) {
    //     let id = state.calls.clanCall.id;
    //     let contact = state.contactData.find(obj => {
    //         return obj.phone.includes(id);
    //     });
    //     name = contact.name;
    //     formatNumber = contact.phone;
    //     contact = true;
    // }

    let callObj = {
        name: displayNumber,
        phone: dial,
        altPhone: "",
        email: "",
        type: "call",
        contact: contact,
        direction: "Inbound",
        status: "INCOMING",
        uuid: callInfo.callUUID,
        room: clanCall ? clanCall.room : null,
        transfer: clanCall ? clanCall.transfer : null
    };
    let start = new Date().getTime();
    callObj.duration = {
        start: start,
        callTime: 0,
        timeOut: "00:00:00"
    };

    if (clanCall) {
        this.setState({ clanCall: null });
    };

    if (state.calls.callStack.length > 1) {
        store.dispatch(addCall(callObj));
    } else {
        store.dispatch(addCall(callObj));
        store.dispatch(makeDisplayCall(callObj));
    }
});

// Incoming Call Cancelled
// plivo.client.on("onIncomingCallCanceled", callInfo => {
//     let index = this.state.callStack.findIndex(obj => {
//         return obj.uuid === callInfo.callUUID;
//     });
//     this.endCallCleanUp(index);
// });


function callTimer(callObj) {
    let start = new Date().getTime();
    let call = { ...callObj };

    call.duration = {
        start: start,
        callTime: 0,
        timeOut: "00:00:00"
    };

    return call;
}

function phoneNumberCheckFormat(number) {
    // Clean number of any characters
    let cleanNumber = number.includes("plivo.com") ? cleanNumber : number.replace(/\W/g, "");
    cleanNumber = cleanNumber[0] === "1" || number.includes("plivo.com") ? cleanNumber : "1" + cleanNumber;

    // Check for known number in contacts
    let lookup = callUtil.numberLookUp(cleanNumber);

    if (lookup) {
        return { dial: cleanNumber, displayNumber: lookup, contact: true };
    } else {
        // Format number for display
        let displayNumber = `(${cleanNumber.slice(1, 4)}) ${cleanNumber.slice(4, 7)}-${cleanNumber.slice(7)}`;
        return { dial: cleanNumber, displayNumber: displayNumber, contact: false };
    }
}


