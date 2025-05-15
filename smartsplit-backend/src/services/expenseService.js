const fs = require('fs').promises;
const path = require('path');

const EXPENSE_DATA_FILE = path.resolve(__dirname, '../../data/expenses.json');

// Ensure the data directory exists
async function ensureDataDirectory() {
    const dataDir = path.dirname(EXPENSE_DATA_FILE);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// Initialize expenses file if it doesn't exist
async function initializeExpensesFile() {
    try {
        await fs.access(EXPENSE_DATA_FILE);
    } catch {
        await fs.writeFile(EXPENSE_DATA_FILE, JSON.stringify({ expenses: {} }, null, 2));
    }
}

// Get all expenses
async function getExpenses() {
    await ensureDataDirectory();
    await initializeExpensesFile();
    const data = await fs.readFile(EXPENSE_DATA_FILE, 'utf8');
    return JSON.parse(data);
}

// Save expenses
async function saveExpenses(expenses) {
    await ensureDataDirectory();
    await fs.writeFile(EXPENSE_DATA_FILE, JSON.stringify(expenses, null, 2));
}

// Store a new expense
async function storeExpense(expense) {
    const expenses = await getExpenses();
    expenses.expenses[expense.expenseId] = {
        ...expense,
        createdAt: new Date().toISOString()
    };
    await saveExpenses(expenses);
    return expenses.expenses[expense.expenseId];
}

// Get expense by ID
async function getExpenseById(expenseId) {
    const expenses = await getExpenses();
    return expenses.expenses[expenseId];
}

// Update expense status
async function updateExpenseStatus(expenseId, status, transactionHash) {
    const expenses = await getExpenses();
    if (expenses.expenses[expenseId]) {
        expenses.expenses[expenseId].status = status;
        if (transactionHash) {
            expenses.expenses[expenseId].transactionHash = transactionHash;
        }
        await saveExpenses(expenses);
        return expenses.expenses[expenseId];
    }
    return null;
}

module.exports = {
    storeExpense,
    getExpenseById,
    updateExpenseStatus
}; 