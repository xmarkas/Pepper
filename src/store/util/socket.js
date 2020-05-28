/**
 * File:        socket.js
 * 
 * Description: Socket event listeners and methods for handling socket
 *              messages. Outgoing and incoming messages use the payload
 *              format of {methods: "someMethod", data: {}}.
 * 
 */
import store from "../store/js/index";
import { setUserId, setClanCall } from "../store/actions/index";
import callUtil from "./callUtil";
import { plivo } from "./plivo";

// Main socket object
let SOCKET = {};

export const getSocket = () => {
    return SOCKET;
}

// Initialize Socket
export const socketInit = () => {

    var socket = new WebSocket("wss://qumoc.com/phone");
    SOCKET = socket;

    socket.onerror = err => {
        console.log(err);
        socket.close();
    };

    // on socket connection
    socket.onopen = event => {
        console.log("Socket connection opened");
    };

    socket.onclose = event => {
        console.log("Socket is closed...Reconnecting");
        setTimeout(() => {
            socketInit();
        }, 1000);
    };

    socket.onmessage = ev => {
        console.log(ev.data);
        socketRouter(JSON.parse(ev.data), socket);
    };

}


/**
 * Socket methods and router
 *
 */
let socketMethods = {};

function socketRouter(data, socket) {
    let method = data.method;
    if (Object.keys(socketMethods).includes(method)) {
        socketMethods[method](data.data, socket);
    }
}

socketMethods.error = (data, socket) => {
    if (data.type === "socket-register") {
        store.dispatch(setUserId({ methods: "SocketSuccess", data: false }));
    }
}

socketMethods.registerID = (data, socket) => {
    let userId = store.getState().user.id;
    console.log("Socket: registering...");
    socket.send(
        JSON.stringify({
            method: "register",
            data: { id: userId, wsID: data.wsID }
        })
    );
    store.dispatch(setUserId({ method: "SocketSuccess", data: true }));
};

socketMethods.callFiring = (data, socket) => {
    if (data.res) {
        this.
            sendCall(data.callObj, data.dest, this.state.user.id);
        console.log("Sending...CLAN CALL");
    } else {
        console.log("CLAN MEMBER UNAVAILABLE");
        this.msg(`${data.callObj.name} is unavailable`);
    }
};

socketMethods.clanCall = (data, socket) => {
    console.log("INCOMING ClanCall....", data);
    store.dispatch(setClanCall(data));
};

socketMethods.hangup = (data, socket) => {
    let state = store.getState();
    let callIndex = state.calls.callStack.findIndex(obj => {
        return obj.room === data.room;
    });
  
    console.log("hangup index", callIndex)
    if (callIndex > -1) {
        if (data.uuid === state.calls.callStack[callIndex].uuid) {
            callUtil.endCallCleanUp(callIndex);
        }
    }
};

socketMethods.receiveTransfer = (data, socket) => {
    let thisCallUUID = plivo.client.getCallUUID();
    let callT = this.state.callStack.find(obj => {
        return obj.uuid === thisCallUUID;
    });
    console.log(data, callT.transfer);
    let transferUUID;
    let roomId = `${this.state.userName}.${this.state.roomIdGen}`;
    if (callT && callT.transfer) {
        transferUUID = callT.transfer.transferUUID;
        console.log("Call terminated with transfer");
        this.setState(
            prevState => {
                let stack = [...prevState.callStack];
                let call = stack.find(obj => {
                    return obj.uuid === callT.uuid;
                });
                call.name = call.transfer.transferName;
                call.phone = call.transfer.transferNumber;
                call.uuid = transferUUID;
                call.altPhone = "";
                call.email = "";
                call.contact = false;
                call.room = roomId;

                return { callStack: stack };
            },
            () => {
                this.setState((prevState, props) => {
                    return { roomIdGen: prevState.roomIdGen + 1 };
                });

                // Send client to new room
                this.switchRooms(roomId, transferUUID);
                this.switchRooms(roomId, thisCallUUID);
            }
        );
    }
}

// 23280720682204

