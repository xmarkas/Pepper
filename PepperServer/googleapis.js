let { getTemplate } = require('./email-template')
const { google } = require('googleapis');
const CREDS = require('./PepperServiceCreds.json');
let base64Encode = require('js-base64');

exports.sendActivationEmail = (activationCode, toAddress) => {
    // scope
    const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

    let jwtClient = new google.auth.JWT(
        CREDS.client_email, null, CREDS.private_key, SCOPES, "Pepper-Accounts@qumoc.com"
    )

    jwtClient.authorize((err, tokens) => {
        if (err) {
            console.log(err);
        } else {
            console.log(tokens)
        }
    })


    let to = toAddress;
    let from = "Pepper-Accounts@qumoc.com";
    let subject = "Account Activation";
    let message = getTemplate(activationCode);

    var emailBody = ["Content-Type: text/html; charset=\"UTF-8\"\n",
        "MIME-Version: 1.0\n",
        "Content-Transfer-Encoding: 7bit\n",
        "to: ", to, "\n",
        "from: ", from, "\n",
        "subject: ", subject, "\n\n",
        message
    ].join('');

    let gmail = google.gmail({ version: 'v1' })

    gmail.users.messages.send({
        auth: jwtClient,
        userId: 'Pepper-Accounts@qumoc.com',
        resource: {
            raw: base64Encode.Base64.encodeURI(emailBody)
        }

    }, (err, res) => {
        if (err) console.log(err);
        console.log("GMAIL", res.data);
    })
}


