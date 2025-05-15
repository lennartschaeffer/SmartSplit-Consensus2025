const app = require('./app');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import the bot to ensure it's initialized
require('./telegram-bot');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Express server is running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
}); 