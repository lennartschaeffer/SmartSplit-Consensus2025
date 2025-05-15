import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";
// Internal Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { ExpenseSigner } from "./src/components/ExpenseSigner";
import { PaymentSigner } from "./src/components/PaymentSigner";

function AppContent() {
  const { connected } = useWallet();

  return (
    <>
      <Header />
      <div className="flex items-center justify-center flex-col">
        {connected ? (
          <Card>
            <CardContent className="flex flex-col gap-10 pt-6">
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
          <CardHeader>
            <CardTitle>To get started Connect a wallet</CardTitle>
          </CardHeader>
        )}
      </div>
    </>
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
