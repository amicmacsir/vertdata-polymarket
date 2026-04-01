import React, { useState } from 'react';
import WalletConnect from './pages/WalletConnect';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [walletAddress, setWalletAddress] = useState('');

  const handleConnect = (address) => {
    setWalletAddress(address);
    setConnected(true);
  };

  const handleDisconnect = () => {
    setConnected(false);
    setWalletAddress('');
    setActiveTab('overview');
  };

  if (!connected) {
    return <WalletConnect onConnect={handleConnect} />;
  }

  return (
    <Dashboard
      walletAddress={walletAddress}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onDisconnect={handleDisconnect}
    />
  );
}
