import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { ExpenseDetails } from "./ExpenseDetails";
import { FileText, Coins, AlertCircle, Loader2, Link } from "lucide-react";

const MODULE_ADDRESS = "070d8a633688cd6d29f688788110feffacedbf42c8ac68e1c14aca6bbfe880c8";

// Mock data for testing


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
    const [expenseDetails, setExpenseDetails] = useState<ExpenseDetails[] | null>(null);
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

            // Fetch updated expense information from the smart contract
            const payload = {
                function: `${MODULE_ADDRESS}::split_expense::get_expense` as const,
                typeArguments: [],
                functionArguments: [creatorAddress, expense.expenseId]
            };

            const result = await aptos.view({ payload });
            setExpenseDetails(result as unknown as ExpenseDetails[]);

            //if the payment is_paid attribute is true, call the complete expense endpoint
            const expenseResult = result as { is_paid?: boolean }[];

            if (expenseResult.length > 0 && expenseResult[0]?.is_paid) {
                await fetch(`http://localhost:3000/api/expenses/${expenseId}/complete`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            }


        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to sign transaction');
        } finally {
            setTransactionInProgress(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-40"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
    if (error) return <div>Error: {error}</div>;
    if (!expense) return <div>Expense not found</div>;

    return (
        <div className="p-4 max-w-6xl mx-auto bg-gray-900 text-gray-100 rounded-lg">
            <h1 className="text-2xl font-bold mb-2 text-white">Pay Your Share</h1>
            <p className="text-gray-400 mb-4">Transaction details for your expense.</p>


            {!account ? (
                <div className="text-center p-4 bg-yellow-900/50 rounded-lg text-yellow-100">
                    <p>Please connect your wallet to continue</p>
                </div>
            ) : userShare === null ? (
                <div className="text-center p-4 bg-yellow-900/50 rounded-lg text-yellow-100">
                    <p>You are not a participant in this expense</p>
                </div>
            ) : txnHash ? (
                <>
                    {expenseDetails && <ExpenseDetails expense={expenseDetails[0]} />}
                    <div className="bg-gray-800 shadow-lg rounded-lg p-8 mb-4 text-gray-100 gap-2 flex items-center justify-center font-semibold"> <a
                        href={`https://explorer.aptoslabs.com/txn/${txnHash}?network=testnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-300 hover:text-blue-200 hover:underline"
                    >
                        View on Explorer
                    </a>
                        <Link />
                    </div>
                </>
            ) : (
                <>
                    <div className="bg-gray-800 shadow-lg rounded-lg p-8 mb-4 text-gray-100">
                        <h2 className="text-xl font-semibold mb-2 text-white">Expense</h2>
                        <div className="flex items-center mb-2">
                            <FileText className="w-4 h-4 text-purple-400 mr-2" />
                            <strong className="text-gray-300 mr-2">Description:</strong>
                            <span className="text-gray-100">{expense.description}</span>
                        </div>
                        <div className="flex items-center mb-2">
                            <Coins className="w-4 h-4 text-cyan-400 mr-2" />
                            <strong className="text-gray-300 mr-2">Total Amount:</strong>
                            <span className="flex items-center text-gray-100">
                                {expense.amountsOwed.reduce((a, b) => a + b, 0).toFixed(2)} APT
                                <div className="w-4 h-4 ml-1 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"></div>
                            </span>
                        </div>
                        {userShare !== null && (
                            <div className="flex items-center mb-2">
                                <Coins className="w-4 h-4 text-cyan-400 mr-2" />
                                <strong className="text-gray-300 mr-2">Your Share:</strong>
                                <span className="flex items-center text-gray-100">
                                    {userShare.toFixed(2)} APT
                                    <div className="w-4 h-4 ml-1 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"></div>
                                </span>
                            </div>
                        )}
                        <div className="flex items-center mb-2">
                            <AlertCircle className={`w-4 h-4 mr-2 ${expense.status.toLowerCase() === 'confirmed' ? 'text-green-400' : 'text-yellow-400'}`} />
                            <strong className="text-gray-300 mr-2">Status:</strong>
                            <span className={`text-gray-100 px-3 py-1 rounded-full font-semibold text-sm ${expense.status.toLowerCase() === 'confirmed' ? 'bg-green-700/80' : 'bg-yellow-700/80'}`}>
                                {expense.status}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handlePayment}
                        disabled={transactionInProgress}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-900 disabled:text-blue-300"
                    >
                        {transactionInProgress ? 'Processing...' : <span className="flex items-center justify-center">{`Pay ${userShare.toFixed(2)} APT`}<div className="w-4 h-4 ml-1 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"></div></span>}
                    </button>
                </>
            )}
        </div>
    );
} 