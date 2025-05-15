const express = require('express');
const router = express.Router();
const expenseService = require('../services/expenseService');
const notificationService = require('../services/notificationService');

// Get expense by ID
router.get('/:expenseId', async (req, res) => {
    try {
        const expense = await expenseService.getExpenseById(req.params.expenseId);
        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        res.json(expense);
    } catch (error) {
        console.error('Error fetching expense:', error);
        res.status(500).json({ error: 'Failed to fetch expense' });
    }
});

// Confirm expense transaction
router.post('/:expenseId/confirm', async (req, res) => {
    try {
        const { transactionHash } = req.body;
        if (!transactionHash) {
            return res.status(400).json({ error: 'Transaction hash is required' });
        }

        const expense = await expenseService.updateExpenseStatus(
            req.params.expenseId,
            'CONFIRMED',
            transactionHash
        );

        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        // Send notifications to participants
        await notificationService.notifyParticipants(req.params.expenseId, expense);

        res.json(expense);
    } catch (error) {
        console.error('Error confirming expense:', error);
        res.status(500).json({ error: 'Failed to confirm expense' });
    }
});

module.exports = router; 