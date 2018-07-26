// dependencies
const express = require('express')
const request = require('request')
const apiai = require('apiai')
const router = express.Router()
const userController = require('../controllers/userController');
const helpers = require('../helpers/functions')
const apiFunctions = require('../helpers/apiai')
const faceFunctions = require('../helpers/facebook')
var cron = require('node-schedule');
const userModel = require('../models/userModel');
require('dotenv').config();


const apiapp = apiai(process.env.CLIENT_ACCESS_TOKEN);

// handling get route for verification
router.get('/', function (req, res) {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === process.env.VALIDATION_TOKEN) {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});

// all messages come from this route
router.post('/', function (req, res) {
    var data = req.body;

    // Make sure this is a page subscription
    if (data.object == 'page') {
        // Iterate over each entry
        // There may be multiple if batched
        data.entry.forEach(function (pageEntry) {
            var pageID = pageEntry.id;
            var timeOfEvent = pageEntry.time;

            // Iterate over each messaging event
            pageEntry.messaging.forEach(function (messagingEvent) {
                receivedMessage(messagingEvent);
                console.log(JSON.stringify(messagingEvent));
            });
        });

        // Assume all went well.
        //
        // You must send back a 200, within 20 seconds, to let us know you've 
        // successfully received the callback. Otherwise, the request will time out.
        res.sendStatus(200);
    }
});

// received message function
async function receivedMessage(event) {

    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;

    if (event.postback) {
        console.log(event.postback.payload);
        if (event.postback.payload === 'Get Started') {
            console.log(event.postback.payload);
            sendToApiAi(senderID, 'start')
            userController.show(senderID, (err, notExist) => {
                if (err) {
                    console.log(err);
                } else {
                    if (notExist) {
                        userController.create(senderID, (err, user) => {
                            if (err) {
                                console.log(err);
                                faceFunctions.sendTextMessage(senderID, 'Soory we have problem with our service, please try later')
                            } else {
                                console.log(user);
                            }
                        })
                    }
                }
            })
            /* */
        }
        return
    }

    console.log("Received message for user %d and page %d at %d with message:",
        senderID, recipientID, timeOfMessage);
    console.log(JSON.stringify(message));

    // You may get a text or attachment but not both
    var messageText = message.text;
    var quickReply = message.quick_reply;

    if (quickReply) {
        var quickReplyPayload = quickReply.payload;
        switch (quickReplyPayload) {
            case "Let\'s start":
                console.log('Ide na api ai');
                sendToApiAi(senderID, 'part_one')
                /* userController.create(senderID, quickReplyPayload, (err, user) => {
                    if (err) {
                        console.log(err);
                        faceFunctions.sendTextMessage(senderID, 'Soory we have problem with our service, please try later')
                    } else {
                        faceFunctions.sendTextMessage(senderID, 'If you want me to remind you type remind')
                    }
                }) */
                break;
            case '1-2':
                sendToApiAi(senderID, quickReplyPayload)
                break;
            case '3-5':
                sendToApiAi(senderID, quickReplyPayload)
                break;
            case '6 and more...':
                sendToApiAi(senderID, quickReplyPayload)
                break;
            case 'dont\'count':
                sendToApiAi(senderID, quickReplyPayload)
                break;
            case 'once a day':
                userController.update(senderID, 1, (err, user) => {
                    if (err) {
                        console.log(err);
                        faceFunctions.sendTextMessage(senderID, 'Soory we have problem with our service, please try later')
                    } else {
                        console.log(user);
                    }
                })
                helpers.finishUserText(senderID);
                break;
            case 'twice a day':
                userController.update(senderID, 2, (err, user) => {
                    if (err) {
                        console.log(err);
                        faceFunctions.sendTextMessage(senderID, 'Soory we have problem with our service, please try later')
                    } else {
                        console.log(user);
                    }
                })
                helpers.finishUserText(senderID);
                break;
            case '3 times a day':
                userController.update(senderID, 3, (err, user) => {
                    if (err) {
                        console.log(err);
                        faceFunctions.sendTextMessage(senderID, 'Soory we have problem with our service, please try later')
                    } else {
                        console.log(user);
                    }
                })
                helpers.finishUserText(senderID);
            case 'Reset Alerts':
                sendToApiAi(senderID, 'Reset Alerts');
                break;
            case 'Unsubscribe':
                userController.update(senderID, 0, (err, user) => {
                    if (err) {
                        console.log(err);
                        faceFunctions.sendTextMessage(senderID, 'Soory we have problem with our service, please try later')
                    } else {
                        faceFunctions.sendTextMessage(senderID, 'You succefully unsubscribed, If you want to start over just type start!')
                    }
                })

                break;
            default:
                break;
        }
        return;
    } else {
        sendToApiAi(senderID, messageText)
    }
}

// function for sending quick replay



// function for sending to api ai
function sendToApiAi(sender, text) {
    var request = apiapp.textRequest(text, {
        sessionId: sender
    });

    faceFunctions.sendTypingOn()

    request.on('response', async function (response) {

        handleApiAiResponse(sender, response);

    });

    request.on('error', function (error) {
        console.log(error);
    });

    request.end();
}


function handleApiAiResponse(sender, response) {
    let responseText = response.result.fulfillment.speech;
    let responseData = response.result.fulfillment.data;
    let messages = response.result.fulfillment.messages;
    let action = response.result.action;
    let contexts = response.result.contexts;
    let parameters = response.result.parameters;

    faceFunctions.sendTypingOff(sender);

    if (helpers.isDefined(messages) && (messages.length == 1 && messages[0].type != 0 || messages.length > 1)) {
        let timeoutInterval = 1100;
        let previousType;
        let cardTypes = [];
        let timeout = 0;
        for (var i = 0; i < messages.length; i++) {

            if (previousType == 1 && (messages[i].type != 1 || i == messages.length - 1)) {

                timeout = (i - 1) * timeoutInterval;
                setTimeout(handleCardMessages.bind(null, cardTypes, sender), timeout);
                cardTypes = [];
                timeout = i * timeoutInterval;
                setTimeout(handleMessage.bind(null, messages[i], sender), timeout);
            } else if (messages[i].type == 1 && i == messages.length - 1) {
                cardTypes.push(messages[i]);
                timeout = (i - 1) * timeoutInterval;
                setTimeout(handleCardMessages.bind(null, cardTypes, sender), timeout);
                cardTypes = [];
            } else if (messages[i].type == 1) {
                cardTypes.push(messages[i]);
            } else {
                timeout = i * timeoutInterval;
                setTimeout(handleMessage.bind(null, messages[i], sender), timeout);
            }

            previousType = messages[i].type;

        }
    } else if (responseText == '' && !helpers.isDefined(action)) {
        //api ai could not evaluate input.
        console.log('Unknown query' + response.result.resolvedQuery);
        faceFunctions.sendTextMessage(sender, "I'm not sure what you want. Can you be more specific?");
    } else if (helpers.isDefined(action)) {
        handleApiAiAction(sender, action, responseText, contexts, parameters);
    } else if (helpers.isDefined(responseData) && helpers.isDefined(responseData.facebook)) {
        try {
            console.log('Response as formatted message' + responseData.facebook);
            faceFunctions.sendTextMessage(sender, responseData.facebook);
        } catch (err) {
            faceFunctions.sendTextMessage(sender, err.message);
        }
    } else if (isDefined(responseText)) {

        faceFunctions.sendTextMessage(sender, responseText);
    }
}

function handleApiAiAction(sender, action, responseText, contexts, parameters) {
    switch (action) {
        default:
            //unhandled action, just send back the text
            faceFunctions.sendTextMessage(sender, responseText);
    }
}

async function handleMessage(message, sender) {
    switch (message.type) {
        case 0: //text
            await faceFunctions.sendTextMessage(sender, message.speech);
            break;
        case 2: //quick replies
            let replies = [];
            for (var b = 0; b < message.replies.length; b++) {
                let reply =
                {
                    "content_type": "text",
                    "title": message.replies[b],
                    "payload": message.replies[b]
                }
                replies.push(reply);
            }
            faceFunctions.sendQuickReply(sender, message.title, replies);
            break;
        case 3: //image
            await faceFunctions.sendImageMessage(sender, message.imageUrl);
            break;
        case 4:
            // custom payload
            var messageData = {
                recipient: {
                    id: sender
                },
                message: message.payload.facebook

            };

            await helpers.callSendAPI(messageData);

            break;
    }
}

/* This runs at 20:01 every Day. */
var rule2 = new cron.RecurrenceRule();
rule2.dayOfWeek = [5, 6, 0, 1, 2, 3, 4];
rule2.hour = 20;
rule2.minute = 1;
cron.scheduleJob(rule2, function () {
    userModel.find({ waterDaily: 3 }).exec(function (err, models) {
        if (err) {
            console.log(err);

        } else {
            models.map(item => {
                faceFunctions.sendImageMessage(item.senderId, 'https://s1.piq.land/2014/07/21/vQv6l4zX8P6Vwv9sAYQy4ehu_400x400.png')
                faceFunctions.sendTextMessage(item.senderId, 'Good Evening it\'s time for a glass of water!');

            })

        }
    });

});

/* This runs at 9:01 every Day. */
var rule2 = new cron.RecurrenceRule();
rule2.dayOfWeek = [5, 6, 0, 1, 2, 3, 4];
rule2.hour = 9;
rule2.minute = 1;
cron.scheduleJob(rule2, function () {
    userModel.find({ waterDaily: 1 }).exec(function (err, models) {
        if (err) {
            console.log(err);

        } else {
            models.map(item => {
                faceFunctions.sendImageMessage(item.senderId, 'https://s1.piq.land/2014/07/21/vQv6l4zX8P6Vwv9sAYQy4ehu_400x400.png')
                faceFunctions.sendTextMessage(item.senderId, 'Good Morning it\'s time for a glass of water!');

            })

        }
    });

});

/* This runs at 16:01 every Day. */
var rule2 = new cron.RecurrenceRule();
rule2.dayOfWeek = [5, 6, 0, 1, 2, 3, 4];
rule2.hour = 16;
rule2.minute = 1;
cron.scheduleJob(rule2, function () {
    userModel.find({ waterDaily: 2 }).exec(function (err, models) {
        if (err) {
            console.log(err);

        } else {
            models.map(item => {
                faceFunctions.sendImageMessage(item.senderId, 'https://s1.piq.land/2014/07/21/vQv6l4zX8P6Vwv9sAYQy4ehu_400x400.png')
                faceFunctions.sendTextMessage(item.senderId, 'Good Afternoon it\'s time for a glass of water!');

            })

        }
    });

});



// exporting the module
module.exports = router;