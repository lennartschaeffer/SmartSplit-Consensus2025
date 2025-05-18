const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { handleConnectWallet, handleDisconnectWallet, handleShowWallet } = require('../commands/walletCommands');
const { handleCreateSplit } = require('../commands/ai-splittingCommands');
const bot = require('../services/telegramBot');

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  if (messageText === '/start') {
    console.log(chatId);
    bot.sendMessage(chatId, 'Welcome to the bot! Use the following commands:\n' +
      '/connect <wallet_address> - Connect your wallet\n' +
      '/disconnect - Disconnect your wallet\n' +
      '/wallet - Show your connected wallet\n' +
      '/create_split - Create a new split (e.g., "/create_split Split $100 with @user1 and @user2")');
  } else if (messageText.startsWith('/connect')) {
    handleConnectWallet(msg, bot);
  } else if (messageText.startsWith('/create_split')) {
    handleCreateSplit(msg, bot);
  } else if (messageText === '/disconnect') {
    handleDisconnectWallet(msg, bot);
  } else if (messageText === '/wallet') {
    handleShowWallet(msg, bot);
  }
});