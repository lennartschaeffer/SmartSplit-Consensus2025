const userService = require('../services/userService');

async function handleConnectWallet(msg, bot) {
    const telegramId = msg.from.id;
    const args = msg.text.split(' ');
    
    if (args.length !== 2) {
        return bot.sendMessage(msg.chat.id, 'Please provide your wallet address in the format: /connect <wallet_address>');
    }

    const walletAddress = args[1];
    
    try {
        await userService.connectWallet(telegramId, walletAddress);
        bot.sendMessage(msg.chat.id, `Successfully connected wallet: ${walletAddress}`);
    } catch (error) {
        bot.sendMessage(msg.chat.id, 'Failed to connect wallet. Please try again.');
    }
}

async function handleDisconnectWallet(msg, bot) {
    const telegramId = msg.from.id;
    
    try {
        const success = await userService.disconnectWallet(telegramId);
        if (success) {
            bot.sendMessage(msg.chat.id, 'Wallet disconnected successfully.');
        } else {
            bot.sendMessage(msg.chat.id, 'No wallet was connected to your account.');
        }
    } catch (error) {
        bot.sendMessage(msg.chat.id, 'Failed to disconnect wallet. Please try again.');
    }
}

async function handleShowWallet(msg, bot) {
    const telegramId = msg.from.id;
    
    try {
        const walletAddress = await userService.getUserWallet(telegramId);
        if (walletAddress) {
            bot.sendMessage(msg.chat.id, `Your connected wallet: ${walletAddress}`);
        } else {
            bot.sendMessage(msg.chat.id, 'No wallet connected. Use /connect <wallet_address> to connect one.');
        }
    } catch (error) {
        bot.sendMessage(msg.chat.id, 'Failed to retrieve wallet information. Please try again.');
    }
}

module.exports = {
    handleConnectWallet,
    handleDisconnectWallet,
    handleShowWallet
}; 