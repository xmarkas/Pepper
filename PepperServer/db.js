let mongo = require('mongodb').MongoClient;
let ObjectId = require('mongodb').ObjectId;
let base64Encode = require('js-base64');
let { sendActivationEmail } = require('./googleapis')
let { createPlivoDemoAccount } = require('./plivo')
/**
 * Creates MongoClient and closes the connection to the database
 * after 2 minutes of idle time.
 */
let idleTimer = null;
let client = null;

/**
 * function:    CreateMongoConnection
 * 
 * description: Establishes connection to mongodb and calls startTimer.
 * date:        7/12/20
 * 
 */
function createMongoConnection() {
    return new Promise(function (resolve, reject) {
        mongo.connect('mongodb://localhost:27017', { useUnifiedTopology: true }, (err, client) => {
            if (err) {
                console.log(err);
                reject(err);
            } else if (client) {
                console.log('Connection to MongoDB is good....')
                resolve(client);
                idleTimer = startTimer();
            }

        })
    })
}

/**
 * function:    startTimer
 * 
 * description: Returns a timer for 2 minutes. When the timer expires it
 *              close any existing client connections to the db, and set
 *              the client variable to null.
 * date:        7/12/20
 */
function startTimer() {
    return setTimeout(function () {
        if (client) client.close();
        console.log('Closing MongoClient');
        client = null;
    }, 60000 * 2)
}

/**
 * function:    getCollection
 * 
 * description: Returns a client with the collection set to the collection
 *              parameter. If there is no existing mongodb client then
 *              createMongoConnection is called. If there is an existing idle
 *              client the idleTimer is cleared and restarted for 2 minutes
 *              and the client is returned.
 * date:        7/12/20
 * 
 * @param {String} collection the name of the collection
 */
function getCollection(collection) {
    if (client === null) {
        return createMongoConnection()
            .then(resolved => {
                client = resolved;
                return client.db('fridge').collection(collection);
            })
            .catch(rejected => {
                console.log(rejected);
            })
    } else {
        clearTimeout(idleTimer);
        idleTimer = startTimer();
        return client.db('fridge').collection(collection);
    }
}


/*****************************************************************
 * db methods
 *****************************************************************/
exports.getUserInfo = async (req, res) => {
    let collection = await getCollection('User');

    collection.findOne({ userId: req.session.user_id }, (err, user) => {
        if (!err && user) {
            let payload = {
                userId: user.userId,
                fName: user.fName,
                lName: user.lName,
                notifications: user.notifications,
                active: user.active === true ? true : false
            }
            res.send({ success: true, data: payload });
        } else {
            res.send({ success: false, msg: "No user" })
        }
    })
}

exports.signin = async (req, res) => {
    let collection = await getCollection('User');

    collection.findOne({ email: req.body.username }, (err, user) => {
        if (user) {
            if (user.password === req.body.password) {
                let payload = {
                    userId: user.userId,
                    fName: user.fName,
                    lName: user.lName,
                    notifications: user.notifications,
                    active: user.active === true ? true : false
                }
                // Update session
                req.session.user_is_signed_in = true;
                req.session.user_id = user.userId;
                
                res.send({ success: true, data: payload });
                
            } else {
                res.send({ success: false, msg: "Passwords do not match" });
            }
        } else {
            res.send({ success: false, msg: "Can not find account matching this email" })
        }
    })
}

exports.createAccount = async (req, res) => {
    let collection = await getCollection('User');

    // Set activation code
    let randN = () => { return Math.floor(Math.random() * 10) };
    let activationCode = `${randN()}${randN()}${randN()}${randN()}${randN()}`;

    let data = {
        fName: req.body.fName,
        lName: req.body.lName,
        email: req.body.email,
        password: req.body.pass1,
        terms: req.body.terms,
        created: new Date().getTime(),
        active: activationCode,
        userId: base64Encode.toBase64(
            req.body.pass1 + new Date().getTime() + req.body.email)
            .slice(4, 23),
        notifications: []

    }

    collection.insertOne(data, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            req.session.user_is_signed_in = true;
            req.session.user_id = data.userId;
            sendActivationEmail(activationCode, req.body.email);

            // add notification
            createNotification(data.userId, "verifyAccount", "Valid your account")
        }


        res.status(200);
        res.send({
            success: err ? false : true,
            msg: err ? "Failed to create account" : "Account created",
            userId: data.userId
        });
    })
}

exports.validateAccount = async (req, res) => {
    let collection = await getCollection('User');

    collection.findOne({ userId: req.body.userId }, (err, user) => {
        if (err) {
            console.log(err);
        } else if (user) {
            if (user.active === req.body.validationCode) {
                createPlivoDemoAccount(user);
                res.send({ success: true, data: { test: "test" } })
            } else {
                res.send({ success: false, msg: "Invalid code" });
            }
        }
    })
}


async function createNotification(userId, type, title) {
    let collection = await getCollection('User');

    // notification object
    let n = {
        type: type,
        title: title
    }

    collection.updateOne({ userId: userId }, { $push: { notifications: n } }, (err, result) => {
        if (!err && result) {
            console.log(result)
        }
    })
}