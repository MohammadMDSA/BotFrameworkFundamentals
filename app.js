const restify = require('restify');
const builder = require('botbuilder');

let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
	console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
let connector = new builder.ChatConnector({
	appId: '22c1ba29-61c8-4be1-ab68-1fdd1ab627cf',
	appPassword: 'iFD1HuaBL6xbgj0GqCnzwDd'
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
let bot = new builder.UniversalBot(connector, (session) => {
	session.replaceDialog('proactiveDialog');
});

// Simple waterfall
bot.dialog('greetings', [
	(session) => {
		builder.Prompts.text(session, 'hi! What is your name?');
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
bot.dialog('help', (session, args, next) => {
	session.endDialog("Global help dialog. <br/>Please say 'next' to continue");
})
	.triggerAction({
		matches: /^help1$/i,
	});

// Global help dialog with action
bot.dialog('helpWhitAction', (session, args, next) => {
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
bot.dialog('partySizeHelp', (session, args, next) => {
	let msg = "Party size help: Our restaurant can support party sizes up to 150 members.";
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
	(session, results) => {
		if (results.response) {
			session.dialogData.room = results.response;
			let msg = `Thank you. Your order will be delivered to room #${session.dialogData.room}`;
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
	(session, args) => {
		if (args && args.reprompt) {
			builder.Prompts.text(session, "Enter the number using a format of either: '(555) 123-4567' or '555-123-4567' or '5551234567'")
		} else {
			builder.Prompts.text(session, "What's your phone number?");
		}
	},
	(session, results) => {
		let matched = results.response.match(/\d+/g);
		let number = matched ? matched.join('') : '';
		if (number.length == 10 || number.length == 11) {
			session.userData.phoneNumber = number; // Save the number.
			session.endDialogWithResult({ response: number });
		} else {
			// Repeat the dialog
			session.replaceDialog('phonePrompt', { reprompt: true });
		}
	}
]);

// CancelAction
bot.dialog('First', [
	(session) => {
		session.send('starting...');
		session.beginDialog('FirstWithCancel');
	},
	(session, results, next) => {
		session.send('Still here');
	}
]);
bot.dialog('FirstWithCancel', [
	(session) => {
		session.send('sdf');
		builder.Prompts.text(session, 'Sample input');
	},
	(session, results, next) => {
		session.send('done');
	}
])
.cancelAction('FristCancelAction', 'Canceled', {
	matches: /^cancel$/i
});

bot.dialog('echoAttachment', (session) => {
	let msg = session.message;
    if (msg.attachments && msg.attachments.length > 0) {
     // Echo back attachment
     let attachment = msg.attachments[0];
        session.send({
            text: "You sent:",
            attachments: [
                {
                    contentType: attachment.contentType,
                    contentUrl: attachment.contentUrl,
                    name: attachment.name
                }
            ]
        });
    } else {
        // Echo back users text
        session.send("You said: %s", session.message.text);
    }
});

// Sending a rich card
bot.dialog('showShirts', (session) => {
	let msg = new builder.Message(session);
	// msg.attachmentLayout(builder.AttachmentLayout.list);
	msg.attachmentLayout(builder.AttachmentLayout.carousel);
	msg.attachments([
		new builder.HeroCard(session)
			.title('Classic White T-Shirt')
			.subtitle('100% Soft and luxurious Cotton')
			.text('Price is $25 and carried in sizes (S, M, L and XL)')
			.images([builder.CardImage.create(session, 'http://i1-news.softpedia-static.com/images/fitted/340x180/Google-s-New-Year-Doodle-2000-2009-PIcs.jpg'), builder.CardImage.create(session, 'http://i1-news.softpedia-static.com/images/fitted/340x180/Google-s-New-Year-Doodle-2000-2009-PIcs.jpg')])
			.buttons([
				builder.CardAction.imBack(session, 'buy classic white t-shirt', 'Buy'),
				builder.CardAction.imBack(session, 'buy classic white t-shirt', 'SS')
			]),
		new builder.HeroCard(session)
			.title('Classic Gray T-Shirt')
			.subtitle('100% Soft and Luxurious Cotton')
			.text('Price is $25 and carried in sizes (S, M, L and XL)')
			.images([builder.CardImage.create(session, 'http://i1-news.softpedia-static.com/images/fitted/340x180/Google-s-New-Year-Doodle-2000-2009-PIcs.jpg')])
			.buttons([
				builder.CardAction.postBack(session, 'list', 'Buy')
			])
	]);
	session.send(msg).endDialog();
})
.triggerAction({
	matches: /^(show|list)/i
});
	
// Sending a proactive message
let startProactiveDialog = (address) => {
	// bot.send(`Inside func with address ${address}`);
	bot.beginDialog(address, "*:survey");
}
bot.dialog('proactiveDialog', [
	(session, args) => {
		builder.Prompts.text(session, 'Give me your address');
	},
	(session, results) => {
		let message = 'Hey there, I\'m going to interrupt our conversation and start a survey in five seconds...';
		session.send(message);
	
		message = `You can also make me send a message by accessing: http://localhost:${server.address().port}/api/CustomWebApi`;
		session.send(message);
	
		let temp = results.response;
		setTimeout((temp) => {
			session.send('Invoking function');
			startProactiveDialog(temp);
		}, 5000);
		
		message = 'Something after the timer';
		session.endDialog(message);
	}
]);
bot.dialog('survey', [
	(session, args) => {
		session.send('Inside test');
		session.send(args);
	}
]);