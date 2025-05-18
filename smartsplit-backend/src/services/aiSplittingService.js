const OpenAI = require('openai');
const dotenv = require('dotenv');
const userService = require('../services/userService');
const expenseService = require('../services/expenseService');
const currencyToApt = require('../services/currencyToApt');

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const openAiPrompt = (sentence) => `
    Extract the total amount and currency mentioned in this sentence, as well as the description of the expense. Return in this format:
    { "amount": 100, "currency": "USD", "description": "Dinner Last Night" }

    Input:
    '${sentence}'
    
    If no amount, description or currency is mentioned, return {"error": "No amount, description or currency mentioned"}
    `

const processSplitRequest = async (msg) => {
    const telegramId = msg.from.id;
    const chatId = msg.chat.id;
    const creatorWalletAddress = await userService.getUserWallet(telegramId);

    if (!creatorWalletAddress) {
        return { error: "Please connect your wallet first using /connect command" };
    }

    let participantsWalletMapping = [];
    if (msg.entities) {
        for (const entity of msg.entities) {
            if (entity.type === 'mention') {
                const handle = msg.text.substring(entity.offset, entity.offset + entity.length).replace("@", "");
                const walletAddress = await userService.getUserWalletByHandle(handle);

                if (!walletAddress) {
                    return { error: `User @${handle} has not connected their wallet yet` };
                }

                participantsWalletMapping.push({
                    telegramHandle: handle,
                    walletAddress: walletAddress
                });
            }
        }
    }

    if (participantsWalletMapping.length === 0) {
        return { error: "Please mention at least one participant using @username" };
    }

    const sentence = msg.text.replace("/create_split", "").trim();
    const prompt = openAiPrompt(sentence);

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
    });

    const openAIResponse = JSON.parse(response.choices[0].message.content);
    if (openAIResponse.error) {
        return { error: openAIResponse.error };
    }


    const amountPerParticipant = openAIResponse.amount / participantsWalletMapping.length;
    const memberAddresses = participantsWalletMapping.map(p => p.walletAddress);
    const amountsOwed = await Promise.all(participantsWalletMapping.map(async () => await currencyToApt(amountPerParticipant, "CAD")));


    // Generate a unique expense ID
    const expenseId = Math.floor(Date.now() / 1000);
    // const expenseId = 123;

    const expense = {
        expenseId: expenseId,
        creatorWalletAddress: creatorWalletAddress,
        memberAddresses: memberAddresses,
        amountsOwed: amountsOwed,
        description: openAIResponse.description,
        status: 'PENDING_SIGNATURE',
        dateCreated: Date.now(),
        creatorChatId: chatId, // Store the chat ID of the creator
        currency: openAIResponse.currency
    }
    // Store the expense details in the database
    await expenseService.storeExpense(expense);

    console.log("Expense stored in the database");
    console.log(expense);

    // Generate the dApp URL for the creator to sign the transaction
    const dAppUrl = `${process.env.DAPP_URL}/${expenseId}`;

    const payUrl = `${process.env.DAPP_URL}/pay/${expenseId}`;
    let message = `To pay your share, <a href="${payUrl}">click here</a>`;

    // await bot.sendMessage(creatorChatId, message, { parse_mode: "HTML" });

    return {
        creatorWalletAddress,
        participantsWalletMapping,
        amount: openAIResponse.amount,
        currency: openAIResponse.currency,
        expenseId,
        dAppUrl
    };
};

module.exports = {
    processSplitRequest
};
