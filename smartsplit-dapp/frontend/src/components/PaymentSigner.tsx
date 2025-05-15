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
    status: string;
}

export function PaymentSigner() {
    const { expenseId } = useParams();
    const { account, signAndSubmitTransaction } = useWallet();
    const [expense, setExpense] = useState<Expense | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [txnHash, setTxnHash] = useState<string | null>(null);
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const [userShare, setUserShare] = useState<number | null>(null);

    useEffect(() => {
        const fetchExpense = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/expenses/${expenseId}`);
                if (!response.ok) throw new Error('Failed to fetch expense');
                const data = await response.json();
                setExpense(data);

                // Find user's share if wallet is connected
                if (account) {
                    const userIndex = data.memberAddresses.indexOf(account.address.toString());
                    if (userIndex !== -1) {
                        setUserShare(data.amountsOwed[userIndex]);
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load expense');
            } finally {
                setLoading(false);
            }
        };

        fetchExpense();
    }, [expenseId, account]);

    const handlePayment = async () => {
        if (!expense || !account || userShare === null) return;

        try {
            setTransactionInProgress(true);
            setError(null);

            // Validate user is a participant
            const userIndex = expense.memberAddresses.indexOf(account.address.toString());
            if (userIndex === -1) {
                throw new Error('You are not a participant in this expense');
            }

            // Validate expense is not already paid
            if (expense.status === 'PAID') {
                throw new Error('This expense has already been paid');
            }

            console.log('Paying expense share with account:', account.address.toString());

            // Convert expense ID to a hex string and pad it to 64 characters


            // The creator's address should already be in the correct format (32 bytes)
            // If it's not, we need to ensure it's properly formatted
            let creatorAddress = expense.creatorWalletAddress;
            if (!creatorAddress.startsWith('0x')) {
                creatorAddress = `0x${creatorAddress}`;
            }
            console.log('Creator address:', creatorAddress);

            // Arguments must match the order in the Move contract:
            // 1. account: &signer (handled by wallet adapter)
            // 2. expense_id: u64


            const transaction: InputTransactionData = {
                data: {
                    function: `${MODULE_ADDRESS}::split_expense::PayExpense`,
                    typeArguments: [],
                    functionArguments: [
                        creatorAddress,
                        expense.expenseId  // expense_id: u64 as hex string
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
            <h1 className="text-2xl font-bold mb-4">Pay Your Share</h1>

            <div className="bg-white shadow rounded-lg p-6 mb-4">
                <h2 className="text-xl font-semibold mb-2">Expense Details</h2>
                <p className="mb-2"><strong>Description:</strong> {expense.description}</p>
                <p className="mb-2"><strong>Total Amount:</strong> {expense.amountsOwed.reduce((a, b) => a + b, 0)} APT</p>
                {userShare !== null && (
                    <p className="mb-2"><strong>Your Share:</strong> {userShare} APT</p>
                )}
                <p className="mb-2"><strong>Status:</strong> {expense.status}</p>
            </div>

            {!account ? (
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-yellow-800">Please connect your wallet to continue</p>
                </div>
            ) : userShare === null ? (
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-yellow-800">You are not a participant in this expense</p>
                </div>
            ) : txnHash ? (
                <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-green-800 mb-2">Payment successful!</p>
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
                    onClick={handlePayment}
                    disabled={transactionInProgress}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                >
                    {transactionInProgress ? 'Processing...' : `Pay ${userShare} APT`}
                </button>
            )}
        </div>
    );
} 