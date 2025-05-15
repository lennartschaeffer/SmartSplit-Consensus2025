const userService = require('./userService');
const bot = require('./telegramBot');

async function notifyParticipants(expenseId, expense) {
    try {
        // Get the creator's chat ID from the expense
        const creatorChatId = expense.creatorChatId;
        if (!creatorChatId) {
            console.error('No creator chat ID found in expense');
            return false;
        }

        // Get all users to find their Telegram IDs
        const users = await userService.getUsers();

        // Find participants' Telegram IDs
        const participants = [];
        for (const [telegramId, user] of Object.entries(users.users)) {
            if (expense.memberAddresses.includes(user.walletAddress)) {
                participants.push({
                    chatId: telegramId, // In Telegram, the user's ID is the same as their chat ID for direct messages
                    handle: user.telegramHandle,
                    walletAddress: user.walletAddress
                });
            }
        }
        console.log('Sending notifications to participants:', participants);

        // Send notification to each participant
        for (const participant of participants) {
            const message = `🔔 New expense to pay!\n\n` +
                `Description: ${expense.description}\n` +
                `Amount: ${expense.amountsOwed[expense.memberAddresses.indexOf(participant.walletAddress)]} APT\n\n` +
                `To pay your share, please visit:\n${process.env.DAPP_URL}/${expenseId}`;

            try {
                await bot.sendMessage(participant.chatId, message);
                console.log(`Notification sent to @${participant.handle}`);
            } catch (error) {
                console.error(`Failed to send notification to @${participant.handle}:`, error.message);
            }
        }

        return true;
    } catch (error) {
        console.error('Error sending notifications:', error);
        return false;
    }
}

module.exports = {
    notifyParticipants
}; 