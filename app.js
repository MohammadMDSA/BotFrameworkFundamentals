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
	 session.replaceDialog('pTypes');
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

// Prompt types
bot.dialog('pTypes', [
	// Text prompt
	(session) => {
		builder.Prompts.text(session, 'What is your name?');
	},
	// Confirmation prompt
	(session, results) => {
		session.send(`Your name is ${results.response}.`);
		builder.Prompts.confirm(session, 'Are you sure this is your name?');
	},
	// Number prompt
	(session, results) => {
		session.send(`You chose ${(results.response) ? ('yes') : ('no')}.`);
		builder.Prompts.number(session, 'How many would you like to order?');
	},
	// Time prompt
	(session, results) => {
		session.send(`You chose ${results.response}.`);
		builder.Prompts.time(session, "What time would you like to set an alarm for?");
	},
	// Choice prompt
	(session, results) => {
		session.send(`You chose ${results.response.entity}`);
			builder.Prompts.choice(session, 'Which color do you prefer?', {
				"west": {
					units: 200,
					total: "$6,000"
				},
				"central": {
					units: 100,
					total: "$3,000"
				},
				"east": {
					units: 300,
					total: "$9,000"
				}
			}
			, { listStyle: 3 }
		);
		
	}
])
.triggerAction({
	confirmPrompt: "This will cancel your current request. Are you sure?"	
});

// The dialog stack is cleared and this dialog is invoked when the user enters 'help'.
bot.dialog('help', function (session, args, next) {
    session.endDialog("Global help dialog. <br/>Please say 'next' to continue");
})
.triggerAction({
    matches: /^help1$/i,
});

// Global help dialog with action
bot.dialog('helpWhitAction', function (session, args, next) {
    session.endDialog("Global help dialog. <br/>Please say 'next' to continue");
})
.triggerAction({
    matches: /^help$/i,
    onSelectAction: (session, args, next) => {
        // Add the help dialog to the dialog stack 
        // (override the default behavior of replacing the stack)
        session.beginDialog(args.action, args);
    }
});

// Dialog to ask for number of people in the party
bot.dialog('askForPartySize', [
    function (session) {
        builder.Prompts.text(session, "How many people are in your party?");
    },
    function (session, results) {
       session.endDialogWithResult(results);
    }
])
.beginDialogAction('partySizeHelpAction', 'partySizeHelp', { matches: /^help$/i });

// Context Help dialog for party size
bot.dialog('partySizeHelp', function(session, args, next) {
    var msg = "Party size help: Our restaurant can support party sizes up to 150 members.";
    session.endDialog(msg);
});

// Replacing dialogs with confirmation
bot.dialog('pTTypes', [
	// Text prompt
	(session) => {
		builder.Prompts.text(session, 'What is your name?');
	},
	// Confirmation prompt
	(session, results) => {
		session.send(`Your name is ${results.response}.`);
		builder.Prompts.confirm(session, 'Are you sure this is your name?');
	},
	// Number prompt
	(session, results) => {
		session.send(`You chose ${(results.response) ? ('yes') : ('no')}.`);
		builder.Prompts.number(session, 'How many would you like to order?');
	},
	// Time prompt
	(session, results) => {
		session.send(`You chose ${results.response}.`);
		builder.Prompts.time(session, "What time would you like to set an alarm for?");
	},
	// Choice prompt
	(session, results) => {
		session.send(`You chose ${results.response.entity}`);
			builder.Prompts.choice(session, 'Which color do you prefer?', {
				"west": {
					units: 200,
					total: "$6,000"
				},
				"central": {
					units: 100,
					total: "$3,000"
				},
				"east": {
					units: 300,
					total: "$9,000"
				}
			}
			, { listStyle: 3 }
		);
		
	}
])
.triggerAction({
    matches: /^dinner reservation$/i,
    confirmPrompt: "This will cancel your current request. Are you sure?"
});