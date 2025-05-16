import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { FileText, Calendar, AlertCircle, Users, Wallet, Coins, CheckCircle } from "lucide-react";

export interface Member {
    addr: string;
    member_paid: boolean;
    owed: string;
}

export interface ExpenseDetails {
    date_created: string;
    description: string;
    id: string;
    is_paid: boolean;
    members: Member[];
    payer: string;
}

interface ExpenseDetailsProps {
    expense: ExpenseDetails;
}

export function ExpenseDetails({ expense }: ExpenseDetailsProps) {
    const { account } = useWallet();

    // Convert hex description to string
    const description = expense.description.startsWith('0x')
        ? decodeURIComponent(expense.description.slice(2).replace(/.{2}/g, '%$&'))
        : expense.description;

    // Convert owed amount from octas to APT
    const convertToApt = (octas: string) => {
        return (parseInt(octas) / 1000000).toFixed(2);
    };

    // Format date
    const formatDate = (timestamp: string) => {
        return new Date(parseInt(timestamp)).toLocaleString();
    };

    // Check if current user is a member
    const isCurrentUserMember = account ? expense.members.some(m => m.addr === account.address.toString()) : false;

    return (
        <div className="bg-gray-800 shadow-lg rounded-lg p-8 mb-4 text-gray-100">
            <div className="flex flex-col items-start mb-4">
                <div className="flex items-center mb-1">
                    <CheckCircle className="w-7 h-7 text-green-400 mr-2" />
                    <h2 className="text-xl font-semibold text-white">Payment Complete! </h2>
                </div>
                <span className="font-sm text-gray-200">See Your Expense Details Below:</span>
            </div>
            <div className="space-y-4">
                <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                        <p className="text-gray-300 font-semibold">Description</p>
                        <p className="font-medium text-gray-100">{description}</p>
                    </div>
                </div>

                <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                        <p className="text-gray-300 font-semibold">Created</p>
                        <p className="font-medium text-gray-100">{formatDate(expense.date_created)}</p>
                    </div>
                </div>

                <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                        <p className="text-gray-300 font-semibold">Status</p>
                        <p className="font-medium">
                            <span className={`px-2 py-1 rounded-full text-sm ${expense.is_paid ? 'bg-green-900/50 text-green-100' : 'bg-yellow-900/50 text-yellow-100'}`}>
                                {expense.is_paid ? 'Paid' : 'Pending'}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-gray-400 mt-1" />
                    <div className="flex-1 w-full">
                        <p className="text-gray-300 font-semibold mb-2">Participants</p>
                        <div className="space-y-2">
                            {expense.members.map((member, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-700/50 rounded w-full">
                                    <div className="flex items-center space-x-2 flex-1">
                                        <span className="font-mono text-sm text-gray-100">
                                            {member.addr.slice(0, 6)}...{member.addr.slice(-4)}
                                        </span>
                                        {member.addr === account?.address.toString() && (
                                            <span className="text-xs bg-blue-900/50 text-blue-100 px-2 py-1 rounded">You</span>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className="font-medium flex items-center text-gray-100">
                                            {convertToApt(member.owed)} APT
                                            <Coins className="w-4 h-4 ml-1 text-gray-400" />
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs ${member.member_paid ? 'bg-green-900/50 text-green-100' : 'bg-yellow-900/50 text-yellow-100'}`}>
                                            {member.member_paid ? 'Paid' : 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-start space-x-3">
                    <Wallet className="w-5 h-5 text-gray-400 mt-1" />
                    <div className="flex-1 w-full">
                        <p className="text-gray-300 font-semibold">Payer</p>
                        <p className="font-mono text-sm text-gray-100">
                            {expense.payer.slice(0, 6)}...{expense.payer.slice(-4)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
} 