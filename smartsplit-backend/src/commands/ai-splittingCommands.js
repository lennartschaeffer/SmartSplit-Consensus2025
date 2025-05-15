const { processSplitRequest } = require('../services/aiSplittingService');

const handleCreateSplit = async (msg, bot) => {
    try {
        const result = await processSplitRequest(msg);

        if (result.error) {
            bot.sendMessage(msg.chat.id, result.error);
            return;
        }

        // Format the message with dApp URL
        const message = `Split created successfully!\n\n` +
            `Amount: ${result.amount} ${result.currency}\n` +
            `Split between ${result.participantsWalletMapping.length} participants\n\n` +
            `To complete the split, please visit:\n${result.dAppUrl}\n\n` +
            `Participants:\n` +
            result.participantsWalletMapping.map(p =>
                `@${p.telegramHandle}: ${result.amount / result.participantsWalletMapping.length} ${result.currency}`
            ).join('\n');

        bot.sendMessage(msg.chat.id, message);
    } catch (error) {
        console.error('Error in handleCreateSplit:', error);
        bot.sendMessage(msg.chat.id, 'Sorry, there was an error processing your split request.');
    }
};

module.exports = {
    handleCreateSplit
};
