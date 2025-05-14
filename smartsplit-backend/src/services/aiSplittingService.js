const OpenAI = require('openai');
const dotenv = require('dotenv');
const userService = require('../services/userService');

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const openAiPrompt = (sentence) => `
    Extract the total amount and currency mentioned in this sentence. Return in this format:
    { "amount": 100, "currency": "USD" }

    Input:
    '${sentence}'
    
    If no amount is mentioned, return {"error": "No amount mentioned"}
    `

//based on a message, like "Me and @bob went to the store, the pill was 100$, we need to split it"
//get the openAI response to return an appropriate JSON object to feed into the smart contract
const getSplitFromOpenAI = async (msg, bot) => {
    //sample message: "I want to split this $100 bill 3 ways with @mark and @bob"  
    //the first thing needed is the creator wallet address
    const telegramId = msg.from.id;
    const creatorWalletAddress = await userService.getUserWallet(telegramId);
    let participantsWalletMapping = [];
    //create the mapping of telegram handles to wallet addresses
    if (msg.entities) {
        for (const entity of msg.entities) {
            if (entity.type === 'mention') {
                const handle = msg.text.substring(entity.offset, entity.offset + entity.length).replace("@", "");
                //now get the wallet address by handle
                const walletAddress = await userService.getUserWalletByHandle(handle);
                participantsWalletMapping.push({
                    telegramHandle: handle,
                    walletAddress: walletAddress
                });
            }
        }
    }
    //remove the command from the message
    const sentence = msg.text.replace("/create_split", "").trim();
    const prompt = openAiPrompt(sentence);
    console.log(prompt);

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
    });

    const currency = JSON.parse(response.choices[0].message.content);
    if (currency.error) {
        bot.sendMessage(msg.chat.id, currency.error);
        return;
    }
    //update the participantsWalletMapping with the amount for each participant
    //assume it's split evenly
    for (const participant of participantsWalletMapping) {
        participant.amount = (currency.amount / participantsWalletMapping.length);
    }

    const transaction = {
        creatorWalletAddress: creatorWalletAddress,
        participantsWalletMapping: participantsWalletMapping,
        amount: currency.amount,
        currency: currency.currency
    }

    console.log(transaction);

    bot.sendMessage(msg.chat.id, "done testing...");

}

module.exports = {
    getSplitFromOpenAI
}
