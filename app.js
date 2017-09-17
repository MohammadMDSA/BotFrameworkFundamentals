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
bot.dialog('partySizeHelp', function (session, args, next) {
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

// Ending Dialog with results(output)
bot.dialog('orderDinner', [
	//...waterfall steps...
	// Last step
	function (session, results) {
		if (results.response) {
			session.dialogData.room = results.response;
			var msg = `Thank you. Your order will be delivered to room #${session.dialogData.room}`;
			session.endConversation(msg);
		}
	}
]);

// End dialog trigger action
bot.dialog('dinnerOrder', [
	//...waterfall steps...
])
	.endConversationAction(
	"endOrderDinner", "Ok. Goodbye.",
	{
		matches: /^cancel$|^goodbye$/i,
		confirmPrompt: "This will cancel your order. Are you sure?"
	}
	);

// Validating input using replaceDialog
// This dialog prompts the user for a phone number. 
// It will re-prompt the user if the input does not match a pattern for phone number.
bot.dialog('phonePrompt', [
	function (session, args) {
		if (args && args.reprompt) {
			builder.Prompts.text(session, "Enter the number using a format of either: '(555) 123-4567' or '555-123-4567' or '5551234567'")
		} else {
			builder.Prompts.text(session, "What's your phone number?");
		}
	},
	function (session, results) {
		var matched = results.response.match(/\d+/g);
		var number = matched ? matched.join('') : '';
		if (number.length == 10 || number.length == 11) {
			session.userData.phoneNumber = number; // Save the number.
			session.endDialogWithResult({ response: number });
		} else {
			// Repeat the dialog
			session.replaceDialog('phonePrompt', { reprompt: true });
		}
	}
]);