// dependencies
const apiai = require('apiai')
const faceFunctions = require('../helpers/facebook')
const request = require('request')
const helpers = require('../helpers/functions')

require('dotenv').config();

module.exports = {
    sendToApiAi: async function (sender, text) {
        var request = await apiapp.textRequest(text, {
            sessionId: sender
        });

        request.on('response', async function (response) {
            // see whole response in console - only for production mode
            //console.log(response);

            //send the response from api.ai
            //get data first
            let responseText = response.result.fulfillment.speech;
            let recipient = sender;
            let responseQuickReplay = response.result.fulfillment.messages;
            console.log(responseQuickReplay);


            // then send the message
            await faceFunctions.sendTextMessage(recipient, responseText);

        });

        request.on('error', function (error) {
            console.log(error);
        });

        request.end();
    }
}