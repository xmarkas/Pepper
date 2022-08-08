
// PLIVO
var plivo = require('plivo');
let PhoneClient = new plivo.Client('MAOTE4ZDVMN2IWMMJKZJ', 'NGI5YjY0Y2EyMDY5ZGVjMDA4Nzc2Yjk1YWNlZDI5');
let PhloClient = new plivo.PhloClient('MAOTE4ZDVMN2IWMMJKZJ', 'NGI5YjY0Y2EyMDY5ZGVjMDA4Nzc2Yjk1YWNlZDI5');

// Methods for export
let methods = {};

methods.createPlivoDemoAccount = (user) => {}

methods.createSubAccount = () => {
    PhoneClient.subAccounts.create(
        `Demo-${user.fName}.${user.lName}`,
        true
    ).then(async result => {
        console.log(result)
        let endpoint = await createEndpoint(user);
        console.log("ENDPOINT", endpoint)
    }).catch(err => {
        return false;
    })
}

function createEndpoint(user) {
    PhoneClient.endpoints.create(
        `Demo-${user.fName}${user.lName}`,
        user.password,
        `${user.fName} ${user.lName}`,
        '21322742914162427'
    ).then(endpoint => {
        return endpoint;
    })
}


/**
 * Get Endpoints
 * 
 */
methods.getEndpoints = (req, res) => {
    PhoneClient.endpoints.list()
        .then(endpoints => {
            res.status(200);
            res.send(endpoints);
        })
        .catch(err => {
            console.log(err);
            res.status(500);
            res.send({ msg: "ERROR could not retrieve endpoints" });
        })
}
/**
 * Get call info
 * 
 */
methods.getCallInfo = (req, res) => {
    console.log(req)

    methods.getLiveCall(req.query.uuid)
        .then(call => {
            res.status(200);
            res.send(call);
        })
        .catch(err => {
            console.log(err)
            res.status(500);
            res.send({ err: "Server Error" });
        })
}

methods.getLiveCall = (uuid) => {
    return PhoneClient.calls.getLiveCall(uuid);
}



methods.switchRooms = (req, res) => {
    let room = req.query.room;
    let uuid = req.query.uuid;

    PhoneClient.calls.transfer(
        uuid,
        {
            legs: "aleg",
            alegUrl: `https://qumoc.com/beta/plivo/sendToRoomXML?room=${room}`
        }
    ).then(function (response) {
        res.status(200);
        res.send("validated");
    }).catch(function (err) {
        console.log(err);
        res.status(500);
        res.send("error");
    });
}
/**
 * Send a transferred call
 * 
 */
methods.sendTransfer = function (req, res) {
    let uuid = req.query.uuid;
    let dest = req.query.dest;
    console.log("$$$$$$$$$$$$$$$", uuid, dest)
    PhoneClient.calls.transfer(
        uuid,
        {
            legs: "aleg",
            alegUrl: `https://qumoc.com/beta/plivo/transferAway?dest=${dest}`
        }
    ).then(result => {
        console.log(result);
        res.status(200);
        res.send(result);
    }).catch(err => {
        console.log(err);
    })
}

/**
 * Request transferring a call
 * 
 */
methods.transferAway = function (req, res) {
    let dest = req.query.dest;
    console.log("DESTINATION ===>", dest);
    let response = plivo.Response();
    response.addSpeak('Your call is being transferred');
    response.addDial().addNumber(dest);
    let callXML = response.toXML();
    console.log(callXML);
    res.status(200);
    res.send(callXML);

}

/**
 * Request to transfer to new XML
 * 
 */
methods.transfer = async function (req, res) {
    console.log('(2) Request transfer', req.query);

    if (req.query.direction == 'incoming') {
        setTimeout(function () {
            PhoneClient.calls.transfer(
                req.query.uuid,
                {
                    legs: req.query.legs,
                    blegUrl: req.query.blegurl,
                    alegUrl: req.query.alegurl
                }
            ).then(function (response) {
                res.status(200)
                res.send(response.callUuids);
            }).catch(function (err) {
                console.log(err);
                res.status(200);
                res.send("SERVER ERROR: could not complete transfer via Plivo");
            });
        }, 1000)
    } else {
        // Transfer call to endpoint which will return new XML instructions
        PhoneClient.calls.transfer(
            req.query.uuid,
            {
                legs: req.query.legs,
                blegUrl: req.query.blegurl,
                alegUrl: req.query.alegurl
            }
        ).then(function (response) {
            res.status(200)
            res.send(response.callUuids);
        }).catch(function (err) {
            console.log(err);
            res.status(200);
            res.send("SERVER ERROR: could not complete transfer via Plivo");
        });
    }
}

/**
 * Put a call in room
 * 
 */
methods.sendToRoomXML = function (req, res) {
    let room = req.query.room;
    console.log('(4) Request for Conference XML being proccessed');
    let response = plivo.Response();

    let confOptions = {
        callbackUrl: 'https://qumoc.com/beta/plivo/conferenceCallback',
        callbackMethod: 'POST'
    }

    response.addConference(room, confOptions);

    let answerXML = response.toXML();
    // console.log(answerXML);
    res.status(200);
    res.send(answerXML);

}

/**
 * Method router for conference members
 */
methods.conferenceMethods = async function (req, res) {
    let uuid = req.query.uuid; // Requestor
    console.log('----> Request Methods', uuid, req.query.room);
    let conference = await getConference(req.query.room).catch(error => console.log(error));
    console.log('---> Conference retrieved', conference);

    if (conference == undefined) {
        res.status(500);
        res.send('Server: ERROR in retrieving Plivo conference');
    } else {
        // The query string value 'commands' can be a string of commands such as "mute>deaf>playAudio"
        let commands = req.query.commands.split(">");

        let members = conference.members;
        if (conference.conferenceMemberCount <= 2) {
            members.forEach(m => {
                if (m.callUuid !== uuid) {
                    let memberId = m.memberId;
                    commands.forEach(async cmd => {
                        await CONFERENCE_METHODS[cmd](req.query.room, memberId);
                    })
                }
            })
        }
        res.status(200);
        res.send();
    }
}

/**
 * Get users conferences. Reconnect to calls if SIP user has been disconnected
 * 
 */
methods.myConferences = (req, res) => {
    let sipID = req.query.sipid;
    let confList = [];
    PhoneClient.conferences.list()
        .then(async list => {
            console.log(list);
            console.log(sipID);

            list.forEach(c => {
                let conf = c.name.slice(0, c.name.indexOf("."));
                console.log("##### Conf name", conf)
                if (conf == sipID) {
                    let promise = new Promise(async function (resolve, reject) {
                        console.log("!!CONFIRMED!!")
                        let room = await getConference(c.name);
                        let member = room.members[0];
                        let confObj = {
                            name: c.name,
                            runTime: room.conferenceRuntTime,
                            memberUUID: member.callUuid,
                            phoneNumber: member.direction == "outbound" ? member.to : member.from,
                            direction: member.direction
                        }
                        resolve(confObj);
                    })
                    confList.push(promise);
                }
            })

            // Wait for list to be resolved
            let List = await Promise.all(confList);
            console.log(List)
            res.status(200);
            res.send(List);
        })
        .catch(err => {
            console.log(err);
            res.status(200);
            send([]);
        })

}


/******************************************************************************
 * CONFERENCE METHODS
 * 
 *****************************************************************************/
let CONFERENCE_METHODS = {
    /**
     * Mute 
     */
    mute: function (roomName, memeberID) {
        return PhoneClient.conferences.muteMember(roomName, memeberID);
    },
    /**
     * Unmute 
     */
    unmute: function (roomName, memeberID) {
        return PhoneClient.conferences.unmuteMember(roomName, memeberID);
    },
    /**
     * Deaf
     */
    deaf: function (roomName, memeberID) {
        return PhoneClient.conferences.deafMember(roomName, memeberID);
    },
    /**
     * Undeaf
     */
    undeaf: function (roomName, memeberID) {
        return PhoneClient.conferences.undeafMember(roomName, memeberID);
    },
    /**
     * Play audio
     */
    playAudio: function (roomName, memeberID) {
        return PhoneClient.conferences.playAudioToMember(roomName, memeberID, "https://s3.amazonaws.com/plivocloud/music.mp3");
    },
    /**
     * Stop audio
     */
    stopAudio: function (roomName, memeberID) {
        return PhoneClient.conferences.stopPlayingAudioToMember(roomName, memeberID);
    },
    /**
     * Hang Up
     */
    hangup: function (roomName, memberID) {
        return PhoneClient.conferences.hangupMember(roomName, memberID);
    }
}

/**
 * Get Conference - Returns the conference object
 * 
 */
function getConference(room) {
    return PhoneClient.conferences.get(room);
}

/**
 * Conference Callback
 * 
 */
methods.conferenceCallback = async function (req, res) {
    console.log('Conference Callback.....');
    console.log(req.body);

    let confObj = req.body;

    // Exit and Last Member
    if (confObj.ConferenceAction == 'exit' && confObj.ConferenceLastMember == 'true') {
        PhoneClient.conferences.hangup(confObj.ConferenceName)
            .then(function (response) {
                console.log(response);
            })
            .catch(function (err) {
                console.log(err);
            })
        // Exit not Last Member
    } else if (confObj.ConferenceAction == 'exit' && confObj.ConferenceLastMember == 'false') {
        let roomName = confObj.ConferenceName;
        let room = await getConference(roomName);
        console.log("LEAVE ROOM", room);
        room.members.forEach(async m => {
            if (m.muted !== true) {
                await CONFERENCE_METHODS.playAudio(roomName, m.memberId);
                await CONFERENCE_METHODS.deaf(roomName, m.memberId);
                await CONFERENCE_METHODS.mute(roomName, m.memberId);
            }
        });
    } else if (confObj.ConferenceAction == "enter") {
        let roomName = confObj.ConferenceName;
        let room = await getConference(roomName);
        console.log(room);
        room.members.forEach(async m => {
            console.log("MEMBER", m)
            await CONFERENCE_METHODS.stopAudio(roomName, m.memberId);
            await CONFERENCE_METHODS.undeaf(roomName, m.memberId);
            await CONFERENCE_METHODS.unmute(roomName, m.memberId);
        });
    }
    res.status(200);
    res.send("ok");
}

/**
 * Incoming call events callback
 *
 */
methods.incomingCallback = function (req, res) {
    let callbackEvent = req.body;

    // Listener for 'in-progress'
    if (callbackEvent.DialAction == 'connected' && callbackEvent.DialBLegStatus == 'connected') {
        let transferEvent = REQUEST_QUEUE.find(function (obj) { return obj.uuid == callbackEvent.DialBLegUUID });
        console.log('MARKER 1');

        if (transferEvent) {
            console.log('MARKER 2');
            transferEvent.request.emit('send');

            // Remove from queue
            REQUEST_QUEUE.splice(REQUEST_QUEUE.indexOf(transferEvent), 1);
        }
    }

    res.status(200);
    res.send('ok');
};

methods.reviveClient = (req, res) => {
    let sipID = req.query.sipid;
    let sipURI = req.query.sipuri;

    PhoneClient.calls.create(
        sipID,
        sipURI,
        "https://qumoc.com/beta/plivo/reviveCallBack",
        {
            answerMethod: "GET"
        }
    ).then(res => {
        console.log(res);
    }).catch(err => {
        console.log(err);
    })
}

methods.reviveCallBack = (req, res) => {
    let response = plivo.Response();
    response.addSpeak('Please choose a call');

    let callXML = response.toXML();

    res.status(200);
    res.send(callXML);
}

methods.ConfData = (name) => {
    return getConference(name);

}
/**
 * EXPORT METHODS
 */
module.exports = methods;
