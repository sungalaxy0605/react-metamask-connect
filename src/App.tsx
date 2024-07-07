import { useState, useEffect } from "react";
import { formatBalance, formatChainAsNum } from "./utils";
import detectEthereumProvider from "@metamask/detect-provider";

import "./App.css";

function App() {
  const [hasProvider, setHasProvider] = useState<boolean | null>(null);
  const initialState = { accounts: [], balance: "", chainId: "" };
  const [wallet, setWallet] = useState(initialState);
  const [toAddress, setToAddress] = useState("");
  const [txResult, setTxResult] = useState("");

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const refreshAccounts = (accounts: any) => {
      if (accounts.length > 0) {
        updateWallet(accounts);
      } else {
        setWallet(initialState);
      }
    };

    const refreshChain = (chainId: any) => {
      setWallet((wallet) => ({ ...wallet, chainId }));
    };

    const getProvider = async () => {
      const provider = await detectEthereumProvider({ silent: true });
      setHasProvider(Boolean(provider));

      if (hasProvider) {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        refreshAccounts(accounts);
        window.ethereum.on("accountsChanged", refreshAccounts);
        window.ethereum.on("chainChanged", refreshChain);
      }
    };

    getProvider();

    return () => {
      window.ethereum?.removeListener("accountsChanged", refreshAccounts);
      window.ethereum?.removeListener("chainChanged", refreshChain);
    };
  }, []);

  const updateWallet = async (accounts: any) => {
    const balance = formatBalance(
      await window.ethereum!.request({
        method: "eth_getBalance",
        params: [accounts[0], "latest"],
      })
    );
    const chainId = await window.ethereum!.request({
      method: "eth_chainId",
    });
    setWallet({ accounts, balance, chainId });
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    await window.ethereum
      .request({
        method: "eth_requestAccounts",
      })
      .then((accounts: []) => {
        setError(false);
        updateWallet(accounts);
      })
      .catch((err: any) => {
        setError(true);
        setErrorMessage(err.message);
      });
    setIsConnecting(false);
  };

  const handleSend = async () => {
    window.ethereum
      .request({
        method: "eth_sendTransaction",
        params: [
          {
            from: wallet.accounts[0],
            to: toAddress,
            value: "0x38D7EA4C68000", //0.001eth
            gasLimit: "0x5208", //21000
            maxPriorityFeePerGas: "0x3b9aca00", //1gwei
            maxFeePerGas: "0x77359400", //2gwei
          },
        ],
      })
      .then((txHash: string) => setTxResult(txHash))
      .catch((error: Error) => setTxResult(error.message));
  };

  const disableConnect = Boolean(wallet) && isConnecting;

  return (
    <div className="App">
      {window.ethereum?.isMetaMask && wallet.accounts.length < 1 && (
        <button disabled={disableConnect} onClick={handleConnect}>
          Connect MetaMask
        </button>
      )}

      {wallet.accounts.length > 0 && (
        <p>
          <span>Wallet Accounts: {wallet.accounts[0]}</span>
          <br />
          <span>Wallet Balance: {wallet.balance}</span>
          <br />
          <span>Hex ChainId: {wallet.chainId}</span>
          <br />
          <span>Numeric ChainId: {formatChainAsNum(wallet.chainId)}</span>
          <br />
          <label>Address</label>
          {txResult === "" ? (
            <>
              <input
                type="text"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setToAddress(e.target.value)
                }
              />
              <br />
              <button onClick={handleSend}>Send</button>
            </>
          ) : (
            <p>{txResult}</p>
          )}
        </p>
      )}
      {error && (
        <p onClick={() => setError(false)}>
          <strong>Error:</strong> {errorMessage}
        </p>
      )}
    </div>
  );
}

export default App;
