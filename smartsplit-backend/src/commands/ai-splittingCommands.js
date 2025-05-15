const { processSplitRequest } = require('../services/aiSplittingService');
const currencyToApt = require('../services/currencyToApt');

const handleCreateSplit = async (msg, bot) => {
    try {
        const result = await processSplitRequest(msg);

        if (result.error) {
            bot.sendMessage(msg.chat.id, result.error);
            return;
        }

        // Convert the total amount to APT
        const totalAmountInApt = await currencyToApt(result.amount, result.currency);

        // Calculate the amount per participant in APT
        const amountPerParticipantInApt = totalAmountInApt / result.participantsWalletMapping.length;

        // Format the message with dApp URL and converted amounts
        const message = `Split created successfully!\n\n` +
            `Total Amount: ${result.amount} ${result.currency} (~${totalAmountInApt.toFixed(2)} APT)\n` +
            `Split between ${result.participantsWalletMapping.length} participants\n\n` +
            `To comple please visit:\n${result.dAppUrl}\n\n` +
            `Participants:\n` +
            result.participantsWalletMapping.map(p =>
                `@${p.telegramHandle}: ${amountPerParticipantInApt.toFixed(2)} APT`
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
