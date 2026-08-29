'use client';

import React, { useState } from 'react';
import { Database, Shield, Clock, Hash, Sliders, RefreshCw, Copy, Check, ExternalLink, FileCode } from 'lucide-react';
import { DEFAULT_PREPROD_EXPLORER } from './circuitApi';

interface LedgerDashboardProps {
  totalVerifiedVendors: number;
  minimumRequiredScore: number;
  lastVerificationTimestamp: number | null;
  lastVerifiedCommitment: string;
  contractAddress: string | null;
  lastTxHash?: string | null;
  walletConnected: boolean;
  onUpdateMinimumScore: (newScore: number) => Promise<void>;
  isUpdatingScore: boolean;
  onRefreshState: () => void;
}

export const LedgerDashboard: React.FC<LedgerDashboardProps> = ({
  totalVerifiedVendors,
  minimumRequiredScore,
  lastVerificationTimestamp,
  lastVerifiedCommitment,
  contractAddress,
  lastTxHash,
  walletConnected,
  onUpdateMinimumScore,
  isUpdatingScore,
  onRefreshState,
}) => {
  const [newScoreInput, setNewScoreInput] = useState<number>(75);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedContract, setCopiedContract] = useState<boolean>(false);

  const handleCopyCommitment = () => {
    if (!lastVerifiedCommitment) return;
    navigator.clipboard.writeText(lastVerifiedCommitment);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyContract = () => {
    if (!contractAddress) return;
    navigator.clipboard.writeText(contractAddress);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  const handleAdminUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMinimumScore(newScoreInput);
  };

  const [mounted, setMounted] = React.useState<boolean>(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const formattedDate = lastVerificationTimestamp && lastVerificationTimestamp > 0
    ? new Date(lastVerificationTimestamp * 1000).toLocaleString()
    : 'No Verifications Yet';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Bar */}
      <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Database size={22} color="var(--accent-cyan)" />
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Public Ledger State</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Live state queried from Midnight Indexer. Zero sensitive witness data disclosed.
            </p>
          </div>
        </div>

        <button onClick={onRefreshState} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
          <RefreshCw size={14} />
          <span>Sync State</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        {/* Total Verified Vendors Card */}
        <div className="glass-panel glass-card-interactive" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Verified Vendors</span>
            <Shield size={20} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
            {totalVerifiedVendors}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            On-chain counter incremented via ZK proof
          </span>
        </div>

        {/* Minimum Score Requirement Card */}
        <div className="glass-panel glass-card-interactive" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Min Score Threshold</span>
            <Sliders size={20} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
            {minimumRequiredScore}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            Active minimum threshold rule
          </span>
        </div>

        {/* Last Verification Timestamp Card */}
        <div className="glass-panel glass-card-interactive" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Last Verified</span>
            <Clock size={20} color="var(--accent-purple)" />
          </div>
          <div suppressHydrationWarning style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
            {mounted ? formattedDate : '...'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>
            Disclosed Unix timestamp
          </span>
        </div>

      </div>

      {/* Real Deployed Contract Card */}
      {contractAddress && (
        <div className="glass-panel" style={{ padding: '18px 20px', borderColor: 'rgba(157, 78, 221, 0.4)', background: 'rgba(157, 78, 221, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c77dff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCode size={16} />
              <span>Deployed Midnight Smart Contract</span>
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handleCopyContract} 
                className="btn-secondary" 
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                {copiedContract ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                <span>{copiedContract ? 'Copied' : 'Copy'}</span>
              </button>
              <a 
                href={`${DEFAULT_PREPROD_EXPLORER}/contract/${contractAddress}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '4px 10px', color: '#c77dff', borderColor: '#c77dff' }}
              >
                <span>Explorer</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
            {contractAddress}
          </div>
        </div>
      )}

      {/* Verifiable Transaction & Explorer Link Card */}
      {lastTxHash && (
        <div className="glass-panel" style={{ padding: '20px', borderColor: 'var(--accent-emerald)', background: 'rgba(0, 255, 157, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ExternalLink size={16} />
              <span>Verifiable Preprod Midnight Transaction</span>
            </span>
            <a 
              href={`${DEFAULT_PREPROD_EXPLORER}/tx/${lastTxHash}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '4px 10px', color: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)' }}
            >
              <span>View in Explorer</span>
              <ExternalLink size={12} />
            </a>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
            {lastTxHash}
          </div>
        </div>
      )}

      {/* Last Verified Commitment Box */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Hash size={18} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Latest Verified Commitment Hash</span>
          </div>
          <button 
            onClick={handleCopyCommitment} 
            className="btn-secondary" 
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
          >
            {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy Hash'}</span>
          </button>
        </div>

        <div style={{ 
          background: 'rgba(0, 0, 0, 0.4)', 
          border: '1px solid var(--border-glass)', 
          borderRadius: 'var(--radius-sm)', 
          padding: '12px 16px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem',
          color: 'var(--accent-cyan)',
          wordBreak: 'break-all'
        }}>
          {lastVerifiedCommitment || '0x0000000000000000000000000000000000000000000000000000000000000000'}
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
          Cryptographic Pedersen commitment combining Tax ID & Secret Salt on-chain.
        </p>
      </div>

      {/* Admin Controls Section */}
      <div className="glass-panel" style={{ padding: '24px', borderColor: 'rgba(0, 240, 255, 0.3)' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', color: 'var(--accent-cyan)' }}>
          Contract Admin Actions
        </h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Update the global compliance minimum score requirement on the Midnight ledger using the <code style={{ color: 'var(--accent-cyan)' }}>setMinimumScore</code> ZK circuit.
        </p>

        <form onSubmit={handleAdminUpdate} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <input
              type="number"
              min="1"
              max="100"
              value={newScoreInput}
              onChange={(e) => setNewScoreInput(Number(e.target.value))}
              placeholder="New minimum score"
              disabled={isUpdatingScore || !walletConnected}
              style={{ width: '100%' }}
            />
          </div>
          <button 
            type="submit" 
            disabled={isUpdatingScore || !walletConnected} 
            className="btn-primary" 
            style={{ padding: '10px 18px', fontSize: '0.85rem' }}
          >
            {isUpdatingScore ? <RefreshCw className="animate-spin" size={16} /> : <Sliders size={16} />}
            <span>{isUpdatingScore ? 'Submitting Tx...' : 'Update Min Threshold'}</span>
          </button>
        </form>

        {!walletConnected && (
          <p style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', marginTop: '10px' }}>
            Connect your 1AM or Lace Wallet to update contract threshold rules.
          </p>
        )}
      </div>

    </div>
  );
};
