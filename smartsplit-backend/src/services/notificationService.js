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

        const totalAmountInApt = await currencyToApt(expense.amount, expense.currency);

        let message = `🔔 New expense to pay!\n\n`
        // Send notification to each participant
        for (const participant of participants) {
            message += `@${participant.handle}: ${totalAmountInApt} APT\n`
        }

        message += `\n\nTo pay your share, please visit:\n${process.env.DAPP_URL}/pay/${expenseId}`;

        try {
            await bot.sendMessage(creatorChatId, message);
            console.log('Notification sent to creator');
        } catch (error) {
            console.error('Failed to send notification to creator:', error.message);
            return false;
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