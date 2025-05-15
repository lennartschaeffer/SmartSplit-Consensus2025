import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const MODULE_ADDRESS = "070d8a633688cd6d29f688788110feffacedbf42c8ac68e1c14aca6bbfe880c8";

interface Expense {
    expenseId: number;
    creatorWalletAddress: string;
    memberAddresses: string[];
    amountsOwed: number[];
    description: string;
    dateCreated: number;
}

export function ExpenseSigner() {
    const { expenseId } = useParams();
    const { account, signAndSubmitTransaction } = useWallet();
    const [expense, setExpense] = useState<Expense | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [txnHash, setTxnHash] = useState<string | null>(null);
    const [transactionInProgress, setTransactionInProgress] = useState(false);

    useEffect(() => {
        console.log(expenseId);
        const fetchExpense = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/expenses/${expenseId}`);
                if (!response.ok) throw new Error('Failed to fetch expense');
                const data = await response.json();
                setExpense(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load expense');
            } finally {
                setLoading(false);
            }
        };

        fetchExpense();
    }, [expenseId]);

    const handleSign = async () => {
        if (!expense || !account) return;

        try {
            setTransactionInProgress(true);
            setError(null);

            // Convert description to bytes
            const encoder = new TextEncoder();
            const bytes = encoder.encode(expense.description);


            // Create the transaction payload
            const transaction: InputTransactionData = {
                data: {
                    function: `${MODULE_ADDRESS}::split_expense::CreateExpense`,
                    typeArguments: [],
                    functionArguments: [
                        expense.expenseId,
                        expense.memberAddresses,
                        expense.amountsOwed,
                        Array.from(bytes),
                        expense.dateCreated
                    ]
                }
            };

            // Sign and submit the transaction
            const response = await signAndSubmitTransaction(transaction);

            // Wait for transaction to be confirmed
            const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
            await aptos.waitForTransaction({ transactionHash: response.hash });

            setTxnHash(response.hash);

            // Notify backend of successful transaction
            await fetch(`http://localhost:3000/api/expenses/${expenseId}/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ transactionHash: response.hash })
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to sign transaction');
        } finally {
            setTransactionInProgress(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!expense) return <div>Expense not found</div>;

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Sign Expense Split</h1>

            <div className="bg-white shadow rounded-lg p-6 mb-4">
                <h2 className="text-xl font-semibold mb-2">Expense Details</h2>
                <p className="mb-2"><strong>Description:</strong> {expense.description}</p>
                <p className="mb-2"><strong>Total Amount:</strong> {expense.amountsOwed.reduce((a, b) => a + b, 0)} APT</p>
                <p className="mb-2"><strong>Number of Participants:</strong> {expense.memberAddresses.length}</p>
            </div>

            {!account ? (
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-yellow-800">Please connect your wallet to continue</p>
                </div>
            ) : txnHash ? (
                <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-green-800 mb-2">Transaction successful!</p>
                    <a
                        href={`https://explorer.aptoslabs.com/txn/${txnHash}?network=testnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                    >
                        View on Explorer
                    </a>
                </div>
            ) : (
                <button
                    onClick={handleSign}
                    disabled={transactionInProgress}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                >
                    {transactionInProgress ? 'Signing...' : 'Sign Transaction'}
                </button>
            )}
        </div>
    );
} 