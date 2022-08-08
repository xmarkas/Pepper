let express = require('express');
let app = express();
let bodyParser = require("body-parser");
var WebSocket = require('ws');
var logger = require('morgan');
let plivoUtil = require('./plivo.js');
let session = require('express-session');
let cookieParser = require('cookie-parser')
let MongoStore = require('connect-mongo')(session);
const { KEY } = require('./pepper-server-jwt-key');
const accountsRouter = require('./accounts-router');



// Middleware
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
    secret: [KEY],
    name: "pepperWP",
    cookie: {
        // httpOnly: true,
        // secure: true,
        // sameSite: true,
        maxAge: 60000 * 60 //* 60 * 24 * 30 // Time is in miliseconds (30days)
    },
    store: new MongoStore({
        url: 'mongodb://localhost:27017/fridge',

    })
}))

// Socket Server
let socketArray = [];
var socketServer = new WebSocket.Server({ port: 5555 });
let socketMethods = {};

// File server for ://qumoc.com/pepper-demo
app.listen(3000, "127.0.0.1", function (err) {
    if (err) console.log(err);
    console.log('Qumoc - Beta Server: RUNNING.....');
});


app.get("/media/:resource", (req, res) => {
    res.sendFile(__dirname + `/media/${req.params.resource}`)
})

app.use((req, res, next) => {
    if (req.session.id && req.session.user_is_signed_in) {
       
    }
    next()
})

app.use('/pepper-demo', express.static(__dirname + "/../pepper/build")); // Production /Pepper

app.use('/pepper-demo/accounts', accountsRouter);
  
/**********************************************************
 * 
 *                  PEPPER and PLIVO routes
 * 
 **********************************************************/

app.get('/getDemoCreds', (req, res) => {
    res.status(200);
    res.send({ u: "DemoUser1533722711245116084838", p: "@demo2020" });
})
 
app.get('/contacts', (req, res) => {
    res.status(200);

    let data = {
        data: "JSON",
        time: new Date().toISOString(),
        data_length: 3,
        entity: [
            // {
            //     // key: 0,
            //     name: "(509) 240-3606",
            //     phone: "(509) 240-3606",
            //     altPhone: "",
            //     email: "",
            //     type: "call",
            //     contact: false,
            //     direction: "Outbound",
            //     // visible: "table-row"
            // },
            // {
            //     // key: 1,
            //     name: "Jackie Wells",
            //     phone: "(509) 240-3606",
            //     altPhone: "",
            //     email: "",
            //     type: "contact",
            //     contact: true,
            //     direction: "Inbound",
            //     // visible: "table-row"
            // },
            // {
            //     // key: 2,
            //     name: "Russell Wilson",
            //     phone: "(509) 240-3606",
            //     altPhone: "",
            //     email: "",
            //     type: "favorite",
            //     contact: true,
            //     direction: "Outbound",
            //     // visible: "table-row"
            // }
        ]
    };
    res.send(data);
})

/**
 * Call Transfer - Request
 */
app.post('/plivo/transfer', function (req, res) {
    plivoUtil.transfer(req, res);

});


/**
 * Get recent calls
 * 
 */
app.get('/plivo/getrecentcalls', function (req, res) {
    plivoUtil.getRecentCalls(req, res);

});

/**
 * Send to room XML
 */
app.post('/plivo/sendToRoomXML', function (req, res) {
    console.log('outer');
    plivoUtil.sendToRoomXML(req, res);
    console.log(req.body);
    console.log(req.query);
})

app.post('/plivo/IncomingCallback', function (req, res) {
    console.log('Incoming Callback');
    plivoUtil.incomingCallback(req, res);
});

/**
 * Conference Methods
 * 
 */

app.post('/plivo/conferenceMethods', function (req, res) {
    console.log('Conference Methods.....')
    plivoUtil.conferenceMethods(req, res);
});

/**
 * Get Conference object
 * 
 */
// app.post('/plivo/getConference', function(req, res) {
//     plivoUtil.getConference(req, res);
// });

/**
 * Conference Callback
 * 
 */
app.post('/plivo/conferenceCallback', function (req, res) {
    plivoUtil.conferenceCallback(req, res);
    socketCallScreen(req);
    stats(req);
});

/**
 * Send DTMF digits
 * 
 */
app.post('/plivo/sendDTMF', function (req, res) {
    plivoUtil.sendDTMF(req, res);

    res.status(200);
    res.send();
});

app.post('/plivo/transferAway', (req, res) => {
    plivoUtil.transferAway(req, res);

})

app.post('/plivo/sendTransfer', (req, res) => {
    plivoUtil.sendTransfer(req, res);
})

app.post('/plivo/switchRooms', (req, res) => {
    plivoUtil.switchRooms(req, res);

})

app.get('/plivo/getCallInfo', (req, res) => {
    plivoUtil.getCallInfo(req, res);
})

app.get('/plivo/getEndpoints', (req, res) => {
    plivoUtil.getEndpoints(req, res);
})

// Phone stats
app.get('/phoneStats/sockets', (req, res) => {
    res.status(200);
    res.send();
    socketArray.forEach((s, index) => {
        console.log("SOCKET", s.id, s.wsID, index);
    })
})

app.get('/plivo/myConferences', (req, res) => {
    plivoUtil.myConferences(req, res);
})

app.get('/plivo/reviveClient', (req, res) => {
    plivoUtil.reviveClient(req, res);
})

app.get('/plivo/reviveCallBack', (req, res) => {
    plivoUtil.reviveCallBack(req, res);
})

/******************************************************
 * 
 *          WEB SOCKET SERVER
 * 
 *****************************************************/


socketServer.on("listening", () => {
    console.log("SOCKET SERVER...listening on port 5555");
})

socketServer.on("connection", function (ws) {
    let wsID = new Date().getTime();
    ws.send(JSON.stringify({ method: "registerID", data: { msg: "Handshake", wsID: wsID } }));
    socketArray.push({ ws: ws, wsID: wsID, id: "", callsPending: 0 });
    console.log(`New connection...${socketArray.length} total connections`);

    ws.on('message', (data) => {
        data = JSON.parse(data);
        console.log("data", data);
        if (Object.keys(socketMethods).includes(data.method)) {
            socketRouter(data, ws);
        }
    })

    ws.on('close', function (err) {
        console.log('  ! Client Disconnected ! ');
        console.log('Server has ' + (socketArray.length) + ' client(s) connected');
        socketArray.forEach((s, index) => {
            if (s.ws.readyState >= 2) {
                console.log("SOCKET", s.id, s.wsID, index, "CLOSING.....");
                socketArray.splice(index, 1);
            } else {
                console.log("SOCKET", s.id, s.wsID, index);
            }
            
        })
    });
})

function socketRouter(data, ws) {
    let method = data.method;
    socketMethods[method](data.data, ws);
}

socketMethods.register = (data, ws) => {
    // Check for previously registered client
    let check = socketArray.findIndex(obj => { return obj.id == data.id });
    
    socketArray.forEach((s, index) => {
        console.log("SOCKET", s.id, s.wsID, index);
        if (s.ws.readyState >= 2) {
            socketArray.splice(index, 1);
        }
    })

    let socket = socketArray.find(obj => { return obj.wsID == data.wsID });
    if (socket) {
        socket.id = data.id;
        console.log("Socket registerd", data.id);
    } else {
        console.log("### ERROR: Could not register socket. Socket not found");
        ws.send(JSON.stringify({ method: "error", data: { type: "socket-register", msg: "Socket-Failed" } }));
    }

}

socketMethods.clanCall = (data, ws) => {
    console.log("DATA @@@@", data);
    let dest = data.dest.slice(0, data.dest.indexOf("@")); //Jake1713714614856811@phone.plivo.com)
    let targetMember = socketArray.find(obj => { return obj.id == dest });
    let requestMember = socketArray.find(obj => { return obj.ws == ws });
    if (targetMember) {
        targetMember.callsPending++;
        setTimeout(function () {
            targetMember.callsPending--;
            targetMember.ws.send(JSON.stringify(
                { method: "clanCall", data: { id: requestMember.id, room: data.callObj.room, transfer: data.callObj.transfer } }));
            setTimeout(function () {
                ws.send(JSON.stringify({ method: "callFiring", data: { res: true, dest: data.dest, callObj: data.callObj } }));
            }, 200)

        }, targetMember.callsPending * 500);
    } else {
        ws.send(JSON.stringify({
            method: "callFiring", data: {
                res: false, callObj: data.callObj
            }
        }));
    }
}

socketMethods.pushTransfer = (data, ws) => {
    plivoUtil.getLiveCall(data.currentCallUUID)
        .then(res => {
            let targetMember = socketArray.find(obj => { return res.to.includes(obj.id) });
            if (targetMember) {
                targetMember.ws.send(JSON.stringify({
                    method: "receiveTransfer",
                    data: { transferUUID: data.transferUUID, targetUUID: data.currentCallUUID }
                }));
            } else {
                ws.send(JSON.stringify({
                    method: "error", data: {
                        method: "receiveTransfer", msg: "Transfer Failed"}
                }));
            }
        }).catch(err => {
            console.log(err)
        })

}

function socketCallScreen(req) {
    let confObj = req.body;
    if (confObj.ConferenceAction == "exit") {
        let roomID = confObj.ConferenceName;
        let socketID = roomID.slice(0, roomID.indexOf("."));
        console.log("Searching for socket id", socketID);
        let targetMember = socketArray.find(obj => { return obj.id == socketID });
        console.log("Target Member")
        if (targetMember) {
            let socket = targetMember.ws;
            socket.send(JSON.stringify({
                method: "hangup", data: {
                    room: roomID, uuid: confObj.CallUUID
                }
            }));
        } else {
            console.log("#### COULD NOT FIND SOCKET ####");
        }

    }
}

function stats(req) {
    let confObj = req.body;
    let room = confObj.ConferenceName;

    let statSocket = socketArray.find(obj => { return obj.id == "stats" });
    if (!statSocket) return; // If statSocket is not connected cancel operation and return
    plivoUtil.ConfData(room)
    .then(result => {
        statSocket.ws.send(JSON.stringify({ method: "newRoom", data: { room: result, action: confObj.ConferenceAction } }));
    })
    .catch(err => {
        console.log(err);

    })

    if (confObj.ConferenceLastMember == "true") {
        statSocket.ws.send(JSON.stringify({ method: "closeRoom", data: { room: room } }));
    }
    
}