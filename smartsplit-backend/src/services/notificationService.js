const userService = require('./userService');
const bot = require('./telegramBot');
const expenseService = require('./expenseService');

const notifyParticipants = async (expenseId, expense) => {
    try {

        const creatorChatId = expense.creatorChatId;
        if (!creatorChatId) {
            console.error('No creator chat ID found in expense');
            return false;
        }

        const users = await userService.getUsers();

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

        const sumOfExpenses = expense.amountsOwed.reduce((acc, curr) => acc + curr, 0);

        let message = `🔔 New expense to pay!\n\n`
        //send notification to each participant
        for (const participant of participants) {
            message += `@${participant.handle}: ${(sumOfExpenses / participants.length).toFixed(2)} APT\n`
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

const sendExpenseCompletionMessage = async (expenseId) => {
    const expense = await expenseService.getExpenseById(expenseId);
    const creatorChatId = expense.creatorChatId;
    let message = `All participants have paid their share! Thank you for using SmartSplit!`;
    await bot.sendMessage(creatorChatId, message);
}

module.exports = {
    notifyParticipants,
    sendExpenseCompletionMessage
}; 