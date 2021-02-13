/*Only Change String and not parameter ! Otherwise you will have to change them in the source code
For now you don't have the possibility to change messages'variables but only the sentence herself

Example:
	exports.WalletDefaultSetting = (default_balance, name) => `hello there ! You have been gifted of ${default_balance} ${name}`;

	Do not touch : exports.WalletDefaultSetting = (default_balance, name) => 

	But you can change the message to :  "${default_balance} ${name} is your new balance" OR "hello there !"
*/
exports.botActivity = "Ready to Gamble";
//Wallets Message
exports.WalletDefaultSetting = (default_balance, name) => `hello there ! You have been gifted of ${default_balance} ${name}`;
exports.WalletDisplay = (balance, name) => `You have ${balance} ${name} in your balance`;
//Predict Message
exports.PredictDeleteWrongAuthor = `You're not the author of the current predict`;
exports.PredictInvalidArguments = `⚙️ Invalid Parameters!\n //predict <Question> <Choice 1>...<Choice 9> ⚙️`;

//Bet
exports.BetInvalideArguments = `⚙️ Invalid Parameters!\n //bet <Choice Nbr> <Sum> ⚙️`;
exports.BetAlreadyVoted = `You have already submited your vote`;
exports.BetInsufisantBalance = (name) => `You don't have enought ${name} for this bet`;
//Win
exports.WinInvalidArguments = `⚙️ Invalid Parameters!\n //win <Choice Nbr>⚙️`;
exports.WinningChoice = (winningChoice, totalBet, name) => `And the winner is ${winningChoice} with a total of ${totalBet} ${name}`;
exports.Winner = (winnerName, gain, name) => `${winnerName} get ${gain} ${name}`;