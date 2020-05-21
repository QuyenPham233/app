/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 */

'use strict';

// Messenger API integration example
// We assume you have:
// * a Wit.ai bot setup (https://wit.ai/docs/quickstart)
// * a Messenger Platform setup (https://developers.facebook.com/docs/messenger-platform/quickstart)
//
// 4. WIT_TOKEN=your_access_token FB_APP_SECRET=your_app_secret FB_PAGE_TOKEN=your_page_token node examples/messenger.js
// 5. Subscribe your page to the Webhooks using verify_token and `https://<your_ngrok_io>/webhook` as callback URL.
// 6. Talk to your bot on Messenger!

const bodyParser = require('body-parser');
const crypto = require('crypto');
const express = require('express');
const fetch = require('node-fetch');

let Wit = null;
let log = null;
try {
  // if running from repo
  Wit = require('../').Wit;
  log = require('../').log;
} catch (e) {
  Wit = require('node-wit').Wit;
  log = require('node-wit').log;
}

// Webserver parameter
const PORT = process.env.PORT || 8445;

// Wit.ai parameters
const WIT_TOKEN = process.env.WIT_TOKEN;

// Messenger API parameters
const FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN;
if (!FB_PAGE_TOKEN) { throw new Error('missing FB_PAGE_TOKEN') }
const FB_APP_SECRET = process.env.FB_APP_SECRET;
if (!FB_APP_SECRET) { throw new Error('missing FB_APP_SECRET') }

// let FB_VERIFY_TOKEN = null;
// crypto.randomBytes(8, (err, buff) => {
//   if (err) throw err;
//   FB_VERIFY_TOKEN = buff.toString('hex');
//   console.log(`/webhook will accept the Verify Token "${FB_VERIFY_TOKEN}"`);
// });


// ----------------------------------------------------------------------------
// Messenger API specific code

// See the Send API reference
// https://developers.facebook.com/docs/messenger-platform/send-api-reference

const fbMessage = (id, text) => {
  const body = JSON.stringify({
    recipient: { id },
    message: { text },
  });
  const qs = 'access_token=' + encodeURIComponent(FB_PAGE_TOKEN);
  return fetch('https://graph.facebook.com/me/messages?' + qs, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body,
  })
  .then(rsp => rsp.json())
  .then(json => {
    if (json.error && json.error.message) {
      throw new Error(json.error.message);
    }
    return json;
  });
};

// ----------------------------------------------------------------------------
// Wit.ai bot specific code

// This will contain all user sessions.
// Each session has an entry:
// sessionId -> {fbid: facebookUserId, context: sessionState}
const sessions = {};

const findOrCreateSession = (fbid) => {
  let sessionId;
  // Let's see if we already have a session for the user fbid
  Object.keys(sessions).forEach(k => {
    if (sessions[k].fbid === fbid) {
      // Yep, got it!
      sessionId = k;
    }
  });
  if (!sessionId) {
    // No session found for user fbid, let's create a new one
    sessionId = new Date().toISOString();
    sessions[sessionId] = {fbid: fbid, context: {}};
  }
  return sessionId;
};

// Setting up our bot
const wit = new Wit({
  accessToken: WIT_TOKEN,
  logger: new log.Logger(log.INFO)
});

// Starting our webserver and putting it all together
const app = express();
app.use(({method, url}, rsp, next) => {
  rsp.on('finish', () => {
    console.log(`${rsp.statusCode} ${method} ${url}`);
  });
  next();
});
app.use(bodyParser.json({ verify: verifyRequestSignature }));

// Webhook setup
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === process.env.FB_VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(400);
  }
});

// Message handler
app.post('/webhook', (req, res) => {
  // Parse the Messenger payload
  // See the Webhook reference
  // https://developers.facebook.com/docs/messenger-platform/webhook-reference
  const data = req.body;

  if (data.object === 'page') {
    data.entry.forEach(entry => {
      entry.messaging.forEach(event => {
        if (event.message && !event.message.is_echo) {
          // Yay! We got a new message!
          // We retrieve the Facebook user ID of the sender
          const sender = event.sender.id;

          // We could retrieve the user's current session, or create one if it doesn't exist
          // This is useful if we want our bot to figure out the conversation history
          // const sessionId = findOrCreateSession(sender);

          // We retrieve the message content
          const {text, attachments} = event.message;

          if (attachments) {
            // We received an attachment
            // Let's reply with an automatic message
            fbMessage(sender, 'Sorry I can only process text messages for now.')
            .catch(console.error);
          } else if (text) {
            // We received a text message
            // Let's run /message on the text to extract some entities, intents and traits
            wit.message(text)
              .then((res) => responseFromWit(res))
              .then((msg) => {
              fbMessage(sender, msg);
            })
            .catch((err) => {
              console.error('Oops! Got an error from Wit: ', err.stack || err);
            })
          }
        } else {
          console.log('received event', JSON.stringify(event));
        }
      });
    });
  }
  res.sendStatus(200);
});

function responseFromWit(data) {
  console.log("- - - ");
  console.log(data.entities);
  console.log("- - - ");
  
  
  if (data.entities.location == null){
    return Promise.resolve("ask me something like 'what time is it in New York?'");
  }
  var loc = mostConfident(data.entities.location);
  if (loc == null){
    return Promise.resolve("ask me something like 'what time is it in New York?'");
  }

  console.log("loc:");
  console.log(loc);
  
  var tz = loc.resolved.values[0].timezone;
  
  return dateFromLocation(tz);
}


function dateFromLocation(loc){
  var url = "http://worldtimeapi.org/api/timezone/"+ loc;

  console.log("try fetch:  " + url);
  
  return fetch(url, {})
    .then( res => res.json() )
    .then( data => {
    console.log(data);
    var unix = parseInt(data.unixtime);
    var offset = parseInt(data.raw_offset);
    var foo = unix + offset;
    console.log(unix);
    console.log(foo);
    var d = new Date(foo);
    
    var now = new Date();
    now.
    
    console.log(d.toTimeString("en-US"));
    console.log(d.toUTCString("en-US"));
    return d.toTimeString("en-US");
  });
}

function mostConfident(items){
  console.log("items:");
  console.log(items);
  if (items == null){
    return null;
  }
  if (items.length == null || items.length == 0){
    return null;
  }
  if (items.length == 1){
    return items[0];
  }
  var confidence = 0;
  var itm = null;
  
  items.forEach(function(item){
    if (item.confidence > confidence){
      confidence = item.confidence;
      itm = item;
    }
  });
  return itm;  
}

function personFromEntities(entities){
  if (entities == null){
    return null;
  }
  if (entities.notable_person == null){
    return null;
  }
  
  var bestPerson = null;
  var confidence = 0;
  entities.notable_person.forEach(function(person){
    if (person.confidence > confidence){
      confidence = person.confidence;
      bestPerson = person.value;
    }
  });
  
  return bestPerson;
}

function confidentIntent(intents) {
  if (intents == null){
    console.log("intents null...");
    return null;
  } else {
    console.log(JSON.stringify(intents));
  }
  let bestValue;
  var confidence = 0;
  intents.forEach(function(intent){
    if (intent.confidence > confidence){
      confidence = intent.confidence;
      bestValue = intent.value;
    }
  });
  return bestValue;
}


/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];
  console.log(signature);

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', FB_APP_SECRET)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

app.listen(PORT);
console.log('Listening on :' + PORT + '...');