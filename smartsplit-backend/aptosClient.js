const { AptosClient } = require("aptos");

const NODE_URL = "https://fullnode.devnet.aptoslabs.com";
const client = new AptosClient(NODE_URL);

module.exports = client;

