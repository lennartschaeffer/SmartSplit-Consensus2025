import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";
// Internal Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { ExpenseSigner } from "./src/components/ExpenseSigner";
import { PaymentSigner } from "./src/components/PaymentSigner";
import { Wallet } from "lucide-react";

function AppContent() {
  const { connected } = useWallet();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-12">
      <Header />
      <div className="flex items-center justify-center flex-col">
        {connected ? (
          <Card className="border-none shadow-lg mt-10 bg-gray-900">
            <CardContent className="flex flex-col gap-10 pt-6 bg-gray-900 rounded-lg border-none">
              <Routes>
                <Route path="/:expenseId" element={<ExpenseSigner />} />
                <Route path="/pay/:expenseId" element={<PaymentSigner />} />
                <Route path="/" element={
                  <div className="text-center py-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                      SmartSplit dApp
                    </h1>
                    <p className="text-gray-600">
                      Please use the Telegram bot to create a split request.
                    </p>
                  </div>
                } />
              </Routes>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-none shadow-lg mt-10 bg-gray-800 text-gray-100 flex items-center justify-center py-16">
            <div className="flex flex-col items-center">
              <Wallet className="w-10 h-10 mb-4 text-blue-400" />
              <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-gray-400 text-center max-w-md">
                To get started, please connect your wallet. This will allow you to create and manage your expense splits securely.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
