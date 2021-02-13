
# Prediction Bot
## Installation

```bash
git@github.com:lexadan/Prediction-bot.git
cd Prediction-bot
cp config.json.example config.json #and replace with you token
npm install
```
After installing all the module and create your config, start the bot with `node bot.js`
Note that this bot will only run with a working [Redis](https://redis.io/) server

## Config File

```json
{
	"token": "<your token here>"
	"prefix": "!",
	"bet": {
		"default_balance": 500,
		"name": "🥓",
		"tts": false
	},
	"redis": {
		"host": "127.0.0.1",
		"port": 6379
	}
}
```

**Token**
Get you token on [Discord Developer Portal](https://discord.com/developers/docs/intro), and replace the placeholder with it.
**Prefix**
Bot Prefix, if a message doesn't start with prefix he will not be treated.
**Bet:Default Balance**
Number of currency given for the first time of any user
**Bet:Name**
Name of the currency (can be Emoji)
**Bet:TTS**
I true the Text to Speech will be enable and all reply or message will be enunciate by discord.
**Redis:Host** 
Host address of the Redis server
**Redis:Port**
Port of the Redis server

## Commands

#### wallet | Display current wallet of user
`!wallet`
**No Argument**
#### predict | Create a prediction in the server
`!predict <Question> <Choice1> <Choice2> ...`\n
 `!predict "Git Gud ?" "Yes" "No"`\n
 `!predict -delete`\n
 **Argument**:
`Question`: Question of the prediction
`..Choice`: From 1 to 9 argument, one for each choice available
`-delete` : Replace question with -delete to delete current prediction
#### bet | Place a bet for the current prediction
`!bet <Choice> <bet>`
 `!bet 1 500`
 **Arguments**:
 `Choice`: Choice selected by user
`bet`: Amount of currency bet by user
#### win | Declare winner of the current prediction (author only)
`!win <choice>`
`!win 1`
**Arguments**:
`winner` : Choice selected to be winner

