const patFacts = require('./patFacts');
var Alexa = require('alexa-sdk');
var http = require('http');
var welcomeRepromt = "You can ask me about a guest speaker at the iron yard. What will it be?";
var HelpMessage = "Here are some things you  can say: Who is speaking this week. Who is speaking today. Who spoke last week. Tell me about the speaker this week. What would you like to do?";
var moreInformation = "See your Alexa app for  more  information."
var tryAgainMessage = "please try again."
var noSpeakerErrorMessage = "There was an error finding this speaker, " + tryAgainMessage;
var goodbyeMessage = "Goodbye"
var states = {
    SEARCHMODE: '_SEARCHMODE',
};
var output = "";
var newSessionHandlers = {
    'LaunchRequest': function () {
        this.handler.state = states.SEARCHMODE;
        this.emit(':ask', HelpMessage, welcomeRepromt);
    },
    'getSpeakerIntent': function () {
        this.handler.state = states.SEARCHMODE;
        this.emitWithState('getSpeakerIntent');
    },
    'getMeetupIntent': function () {
        this.handler.state = states.SEARCHMODE;
        this.emitWithState('getMeetupIntent');
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.CancelIntent': function () {
        // Use this function to clear up and save any data needed between sessions
        this.emit(":tell", goodbyeMessage);
    },
    'SessionEndedRequest': function () {
        // Use this function to clear up and save any data needed between sessions
        this.emit('AMAZON.StopIntent');
    },
    'Unhandled': function () {
        output = HelpMessage;
        this.emit(':ask', output, welcomeRepromt);
    },
};
var handlers = Alexa.CreateStateHandler(states.SEARCHMODE, {
    'getSpeakerIntent': function () {
      var noDate = "Sorry, I did not hear the dates you wanted to check."
      var patFact = patFacts[Math.floor(patFacts.length * Math.random())];
      var alexa = this;
      var date = this.event.request.intent.slots.date.value;
      if (date != ""){
        httpGet(date, function (response) {
            // Parse the response into a JSON object ready to be formatted.
            var responseData = JSON.parse(response);
            var cardContent = "Data provided by DorkTron\n\n";
            var numberOfResults = responseData.length;
            var oneSpeakerMessage = "There is " + numberOfResults + " speaker. ";
            var multipleSpeakerMessage = "There are " + numberOfResults + " speakers. ";
            var error = "There was a problem with getting data please try again "
            // Check if we have correct data, If not create an error speech out to try again.
            if (responseData.status == 500) {
                output = alexa.emit(':ask', error, HelpMessage);
            }
            else {
              if (responseData.length == 1){
                output = oneSpeakerMessage;
              }
              else {
                output = multipleSpeakerMessage;
              }
              responseData.forEach( function(talk, index){
                var speaker = talk.speaker;
                output += " Speaker " + (index+1) + ": " + speaker.name + ";";
                cardContent += " Speaker " + (index+1) + ".\n";
                cardContent += speaker.name + ".\n\n";
              })
              output += patFact;
            }
            var cardTitle = "The Iron Yard Guest Speakers";
            alexa.emit(':tellWithCard', output, cardTitle, cardContent);
        });
      }
      else {
        alexa.emit(':ask', noDate, HelpMessage);
      }
    },
    'getMeetupIntent': function () {

      var alexa = this;

        var date = this.event.request.intent.slots.date.value;


        httpGet(date, function (response) {

            // Parse the response into a JSON object ready to be formatted.
            var responseData = JSON.parse(response);
            var cardContent = "Data provided by DorkTron\n\n";
            var numberOfResults = responseData.length;
            var oneSpeakerMessage = "There is " + numberOfResults + " speaker. ";
            var multipleSpeakerMessage = "There are " + numberOfResults + " speakers. ";

            // Check if we have correct data, If not create an error speech out to try again.
            if (responseData == null) {
                output = "There was a problem with getting data please try again";
            }
            else {
              if (responseData.length == 1){
                output = oneSpeakerMessage;
              }
              else {
                output = multipleSpeakerMessage;
              }

              responseData.forEach( function(talk, index){
                var speaker = talk.speaker;

                output += " Speaker " + (index+1) + ": " + speaker.name + ";";

                cardContent += " Speaker " + (index+1) + ".\n";
                cardContent += speaker.name + ".\n\n";

              })
              output += patFact;
            }

            var cardTitle = "The Iron Yard Guest Speakers";

            alexa.emit(':tellWithCard', output, cardTitle, cardContent);
        });
    },
    'AMAZON.HelpIntent': function () {
        output = HelpMessage;
        this.emit(':ask', output, HelpMessage);
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.CancelIntent': function () {
        // Use this function to clear up and save any data needed between sessions
        this.emit(":tell", goodbyeMessage);
    },
    'Unhandled': function () {
        output = HelpMessage;
        this.emit(':ask', output, welcomeRepromt);
    },
});
exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(newSessionHandlers, handlers);
    alexa.execute();
};
// Create a web request and handle the response.
function httpGet(date, callback) {

    var options = {
        host: 'tiyspeakers.herokuapp.com',
        path: '/api/talks/q/'+date,
        method: 'GET'
    };

    var req = http.request(options, (res) => {

        var body = '';

        res.on('data', (d) => {
            body += d;
        });

        res.on('end', function () {
            callback(body);
        });

    });
    req.end();

    req.on('error', (e) => {
        console.error(e);
    });
}
