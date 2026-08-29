import React from 'react';
import { ShieldCheck, Wallet, LogOut, Network, Info, ExternalLink, FileCode } from 'lucide-react';
import { DEFAULT_PREPROD_EXPLORER } from './circuitApi';

interface NavbarProps {
  walletConnected: boolean;
  walletAddress: string | null;
  network: string;
  contractAddress: string | null;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onOpenPrivacyInfo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  walletConnected,
  walletAddress,
  network,
  contractAddress,
  onConnectWallet,
  onDisconnectWallet,
  onOpenPrivacyInfo,
}) => {
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-6)}`
    : '';

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(157, 78, 221, 0.2) 100%)',
            border: '1px solid var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)'
          }}>
            <ShieldCheck size={24} color="#00F0FF" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px', background: 'linear-gradient(90deg, #FFFFFF 0%, #94A3B8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Private Vendor Verification
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Midnight ZK Protocol</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span style={{ color: 'var(--text-muted)' }}>DApp Connector</span>
            </p>
          </div>
        </div>

        {/* Action Controls & Wallet Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          
          <button 
            onClick={onOpenPrivacyInfo} 
            className="btn-secondary"
            title="Privacy Model Information"
            style={{ fontSize: '0.85rem' }}
          >
            <Info size={16} color="var(--accent-cyan)" />
            <span>Privacy Model</span>
          </button>

          {contractAddress && (
            <a
              href={`${DEFAULT_PREPROD_EXPLORER}/contract/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="badge badge-purple"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', textDecoration: 'none' }}
              title={`View Contract on Midnight Explorer: ${contractAddress}`}
            >
              <FileCode size={13} />
              <span>Contract: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}</span>
              <ExternalLink size={11} />
            </a>
          )}

          <div className="badge badge-cyan" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}>
            <Network size={14} />
            <span>Network: <strong>{network.toUpperCase()}</strong></span>
          </div>

          {walletConnected && walletAddress ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <a
                href={`${DEFAULT_PREPROD_EXPLORER}/address/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-panel"
                style={{
                  padding: '6px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0, 255, 157, 0.08)',
                  borderColor: 'rgba(0, 255, 157, 0.3)',
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
                title="View Account on Midnight Explorer"
              >
                <span className="pulse-dot" style={{ color: 'var(--accent-emerald)' }}></span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                  {shortAddress}
                </span>
                <ExternalLink size={12} color="var(--accent-emerald)" />
              </a>
              <button 
                onClick={onDisconnectWallet} 
                className="btn-secondary" 
                style={{ padding: '8px 12px', color: 'var(--accent-rose)', borderColor: 'rgba(255, 46, 147, 0.3)' }}
                title="Disconnect Wallet"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={onConnectWallet} className="btn-primary">
              <Wallet size={18} />
              <span>Connect Wallet</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
