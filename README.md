﻿﻿﻿

# Prediction Bot

This bot aim to create a whole gambling and prediction system on your server. As well as a basic economy.
**Note that this bot is only available on HIY (host it yourself) yet, but give you a lot of customization options**
**It should be soon available on Self host**
## Installation

```bash
git clone git@github.com:lexadan/Prediction-bot.git
cd Prediction-bot
cp config.json.example config.json #and replace with your token
npm install
```

After installing all the module and create your config, start the bot with `node bot.js`
Note that this bot will only run with a working [Redis](https://redis.io/) server

## Config File

```json
{
	
	// Get you token on https://discord.com/developers/docs/intro, and replace the placeholder with it.
	"token": "<your token here>",
	// Command's prefix of the server
	"prefix": "!",
	// Predictions's configuration
	"bet": {
		// Color used on Discord's Embeds
		"embed_color": "#2791dd",
		// Default balance value gave at profile creation
		"default_balance": 500,
		// Name of the currency (emoji availables)
		"name": "🥓",
		// Is Text to Speach enable on predictions messages
		"tts": false,
		// Number of bettables values
		"bettable_lenght": 4,
		// List of all bettable values
		"bettable": [
			{
				// Emoji that will be available as reaction
				"emoji": "💵",
				// Equivalent value for 'emoji'
				"value": 50
			},
			{
				"emoji": "💰",
				"value": 100
			},
			{
				"emoji": "💎",
				"value": 500
			},
			{
				"emoji": "🔱",
				"value": 1000
			}
		]
	},
	// Redis Configuration
	"redis": {
		// Your redis server's host
		"host": "127.0.0.1",
		// Your redis server' port
		"port": 6379
	},
	// Profile Configuration
	"profile": {
		// Color used on Discord's Embeds
		"color": "#2791dd",
		// Default description applied to every new user
		"default_desc": "Some random dude"
	}
}
```

## Usage

### Profile
Each user that is willing to use the bot in your server has to create a profile with the command : `!profile`
To edit the profile one command is available:
```bash
!set [desc, avatar, name] <Value Here>
example: !set desc "G2 Absolute fan"
```
![](https://i.imgur.com/wsIV8e2.png)
### Prediction
To enable a prediction only one command is needed: `!bet <Question> <Option1>...<Option5>`
```bash
example: !bet "G2 will win world" "No" "Yes" "FPXed"
```	
![enter image description here](https://i.imgur.com/1QDE3FZ.png)

All user that want to place a bet just need to use discord's reactions.
They will get a dm with a new embed that will let them choose a value to bet (configs's bettable)

![enter image description here](https://i.imgur.com/FnQIRd0.png)
The message will be edited in realtime anytime you place a bet (the only limit is your wallet :) )

Author of the prediction will also receive a special panel where he can perform 3 actions:
![enter image description here](https://i.imgur.com/4lfPxNN.png)
1) Choose the winning option 1️⃣2️⃣3️⃣
2) Delete prediction ❌
3) Lock prediction bets 🔒

## Replies

All replies can be modified but they have fixed arguments.
To change one reply modify it's value in `replies.js`  **But care to not change both name and arguments !!**\

```js
exports.WalletDisplay = (balance, name) => 'You have ${balance} ${name} in your balance';
```

For example here you can change

```js
`You have ${balance} ${name} in your balance`;
```

to

```js
`${balance} is your new wealth`;
```
