const fs = require('fs').promises;
const path = require('path');

const USER_DATA_FILE = path.resolve(__dirname, '../../data/users.json');

// Ensure the data directory exists
async function ensureDataDirectory() {
    const dataDir = path.dirname(USER_DATA_FILE);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// Initialize users file if it doesn't exist
async function initializeUsersFile() {
    try {
        await fs.access(USER_DATA_FILE);
    } catch {
        await fs.writeFile(USER_DATA_FILE, JSON.stringify({ users: {} }, null, 2));
    }
}

// Get all users
async function getUsers() {
    await ensureDataDirectory();
    await initializeUsersFile();
    const data = await fs.readFile(USER_DATA_FILE, 'utf8');
    return JSON.parse(data);
}

// Save users
async function saveUsers(users) {
    await ensureDataDirectory();
    await fs.writeFile(USER_DATA_FILE, JSON.stringify(users, null, 2));
}

// Connect wallet to user
async function connectWallet(telegramId, walletAddress) {
    const users = await getUsers();
    users.users[telegramId] = {
        walletAddress,
        connectedAt: new Date().toISOString()
    };
    await saveUsers(users);
    return users.users[telegramId];
}

// Get user's wallet
async function getUserWallet(telegramId) {
    const users = await getUsers();
    return users.users[telegramId]?.walletAddress;
}

// Disconnect wallet from user
async function disconnectWallet(telegramId) {
    const users = await getUsers();
    if (users.users[telegramId]) {
        delete users.users[telegramId];
        await saveUsers(users);
        return true;
    }
    return false;
}

module.exports = {
    connectWallet,
    getUserWallet,
    disconnectWallet,
    getUsers
}; 