// dependencies
const express = require('express')
const apiai = require('apiai')
const router = express.Router()
const userController = require('../controllers/userController');
const helpers = require('../helpers/functions')
const apiFunctions = require('../helpers/apiai')
require('dotenv').config();

module.exports = {
    sendQuickReply: function (recipientId, text, quickReplay) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                text: text,
                quick_replies: quickReplay
            }
        }
        callSendAPI(messageData);
    },
    sendTextMessage: (recipientId, messageText) => {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                text: messageText,
                metadata: "DEVELOPER_DEFINED_METADATA"
            }
        };
        helpers.callSendAPI(messageData);
    },
    sendTypingOff: function (recipientId) {


        var messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "typing_off"
        };

        helpers.callSendAPI(messageData);
    },
    sendTypingOn: function (recipientId) {


        var messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "typing_on"
        };

        helpers.callSendAPI(messageData);
    },
    sendQuickReply: function (recipientId, text, replies, metadata) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                text: text,
                metadata: helpers.isDefined(metadata) ? metadata : '',
                quick_replies: replies
            }
        };

        helpers.callSendAPI(messageData);
    },
    sendImageMessage: (recipientId, imageUrl) => {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "image",
                    payload: {
                        url: imageUrl
                    }
                }
            }
        };
        helpers.callSendAPI(messageData);
    }
}

