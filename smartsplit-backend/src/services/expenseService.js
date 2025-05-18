const fs = require('fs').promises;
const path = require('path');

const EXPENSE_DATA_FILE = path.resolve(__dirname, '../../data/expenses.json');


const ensureDataDirectory = async () => {
    const dataDir = path.dirname(EXPENSE_DATA_FILE);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

const initializeExpensesFile = async () => {
    try {
        await fs.access(EXPENSE_DATA_FILE);
    } catch {
        await fs.writeFile(EXPENSE_DATA_FILE, JSON.stringify({ expenses: {} }, null, 2));
    }
}

const getExpenses = async () => {
    await ensureDataDirectory();
    await initializeExpensesFile();
    const data = await fs.readFile(EXPENSE_DATA_FILE, 'utf8');
    return JSON.parse(data);
}

const saveExpenses = async (expenses) => {
    await ensureDataDirectory();
    await fs.writeFile(EXPENSE_DATA_FILE, JSON.stringify(expenses, null, 2));
}

const storeExpense = async (expense) => {
    const expenses = await getExpenses();
    expenses.expenses[expense.expenseId] = {
        ...expense,
        createdAt: new Date().toISOString()
    };
    await saveExpenses(expenses);
    return expenses.expenses[expense.expenseId];
}

const getExpenseById = async (expenseId) => {
    const expenses = await getExpenses();
    return expenses.expenses[expenseId];
}

const updateExpenseStatus = async (expenseId, status, transactionHash) => {
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