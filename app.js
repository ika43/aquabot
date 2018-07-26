const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const server = require('http').Server(app) 

require('dotenv').config();

// BODY-PARSER MIDDLEWARE
// =============================================================================
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ROUTES FOR OUR API
// =============================================================================
const user = require('./routes/userRoutes');
const webhook = require('./routes/webhookRoutes');


// CONNECTING TO MONGOOSE
// =============================================================================
mongoose.connect(process.env.DB_PATH, { useNewUrlParser: true },
    err => {
        if (err) throw err;
        console.log(`Successfully connected to database.`);
    });


// REGISTER OUR ROUTES
// =============================================================================
app.get('/', (req, res) => {
    res.send('Welcome to aquabot!')
})
app.use('/user', user);
app.use('/webhook', webhook);
/* 
new CronJob('* * * * * *', function() {
    console.log('You will see this message every second');
  }, null, true, 'America/Los_Angeles'); */

  server.listen(process.env.PORT || 3000, function () {
    console.log("App is running on port " + port);
});