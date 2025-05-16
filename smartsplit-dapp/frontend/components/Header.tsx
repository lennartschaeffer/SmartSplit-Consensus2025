import { WalletSelector } from "./WalletSelector";

export function Header() {
  return (
    <div className="flex items-center justify-center px-4 py-2 max-w-screen-xl mx-auto w-full flex-wrap">
      <h1 className="display bg-gradient-to-r mr-40 from-purple-400 to-blue-400 text-transparent bg-clip-text
">SplitShare</h1>

      <div className="flex gap-2 items-center flex-wrap">
        <WalletSelector />
      </div>
    </div>
  );
}
