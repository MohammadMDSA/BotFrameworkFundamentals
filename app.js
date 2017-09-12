const restify = require('restify');
const builder = require('botbuilder');

let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
	console.log('%s listening to %s', server.name, server.url); 
 });
 
 // Create chat connector for communicating with the Bot Framework Service
 let connector = new builder.ChatConnector({
	 appId: process.env.MICROSOFT_APP_ID,
	 appPassword: process.env.MICROSOFT_APP_PASSWORD
 });
 
 // Listen for messages from users 
 server.post('/api/messages', connector.listen());
 
 // Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
 let bot = new builder.UniversalBot(connector, (session) => {
	 session.replaceDialog('greetingsInner');
 });

// Simple waterfall
bot.dialog('greetings', [
	(session) => {
		builder.Prompts.text(session, 'hi! What i s your name?');
	},
	(session, results) => {
		session.endDialog(`Hello ${results.response}!`);
	}
]);

// More complicate waterfall
bot.dialog('greetingsInner', [
	(session) => {
		session.beginDialog('askName');
	},
	(session, results) => {
		session.endDialog(`Hello ${results.response}!`);
	}
]);
bot.dialog('askName', [
	(session) => {
		builder.Prompts.text(session, 'Hi! What is your name?');
	},
	(session, results) => {
		session.endDialogWithResult(results);
	}
]);