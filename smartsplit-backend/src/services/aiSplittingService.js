//const OpenAI = require('openai');
const dotenv = require('dotenv');
const userService = require('../services/userService');
const expenseService = require('../services/expenseService');

dotenv.config();

// const openai = new OpenAI({
//     //apiKey: process.env.OPENAI_API_KEY,
// });

const openAiPrompt = (sentence) => `
    Extract the total amount and currency mentioned in this sentence. Return in this format:
    { "amount": 100, "currency": "USD" }

    Input:
    '${sentence}'
    
    If no amount is mentioned or no currency is mentioned, return {"error": "No amount or currency mentioned"}
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

    // const response = await openai.chat.completions.create({
    //     model: "gpt-3.5-turbo",
    //     messages: [{ role: "user", content: prompt }],
    // });

    // const currency = JSON.parse(response.choices[0].message.content);
    // if (currency.error) {
    //     return { error: currency.error };
    // }

    // Calculate amount per participant
    // const amountPerParticipant = currency.amount / participantsWalletMapping.length;
    const memberAddresses = participantsWalletMapping.map(p => p.walletAddress);
    // const amountsOwed = participantsWalletMapping.map(() => amountPerParticipant);

    // Generate a unique expense ID
    const expenseId = Math.floor(Date.now() / 1000);
    // const expenseId = 123;
    //create a mock expense to use for testing
    const mockExpense = {
        expenseId: expenseId,
        creatorWalletAddress: creatorWalletAddress,
        memberAddresses: memberAddresses,
        amountsOwed: [50, 50],
        description: "test expense",
        status: 'PENDING_SIGNATURE',
        dateCreated: Date.now(),
        creatorChatId: chatId, // Store the chat ID of the creator
        currency: "CAD"
    }
    // Store the expense details in the database
    await expenseService.storeExpense(mockExpense);

    // Generate the dApp URL for the creator to sign the transaction
    const dAppUrl = `${process.env.DAPP_URL}/${expenseId}`;

    return {
        creatorWalletAddress,
        participantsWalletMapping,
        amount: 100,
        currency: "USD",
        expenseId,
        dAppUrl
    };
};

module.exports = {
    processSplitRequest
};
