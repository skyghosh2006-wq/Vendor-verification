import React, { useState } from 'react';
import { Database, Shield, Clock, Hash, Sliders, RefreshCw, Copy, Check } from 'lucide-react';

interface LedgerDashboardProps {
  totalVerifiedVendors: number;
  minimumRequiredScore: number;
  lastVerificationTimestamp: number | null;
  lastVerifiedCommitment: string;
  contractAddress: string | null;
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
  walletConnected,
  onUpdateMinimumScore,
  isUpdatingScore,
  onRefreshState,
}) => {
  const [newScoreInput, setNewScoreInput] = useState<number>(75);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyCommitment = () => {
    if (!lastVerifiedCommitment) return;
    navigator.clipboard.writeText(lastVerifiedCommitment);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdminUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMinimumScore(newScoreInput);
  };

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
              On-chain state visible to all observers. Zero sensitive witness data disclosed.
            </p>
          </div>
        </div>

        <button onClick={onRefreshState} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
          <RefreshCw size={14} />
          <span>Refresh State</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        
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
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
            {formattedDate}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>
            Disclosed Unix timestamp
          </span>
        </div>

      </div>

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
          Deterministic ZK commitment computed from <code style={{ color: 'var(--text-secondary)' }}>persistentHash([vendorSecret, taxIdHash])</code>. Observers cannot reverse this to find the raw tax ID.
        </p>
      </div>

      {/* Admin Threshold Management */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="var(--accent-purple)" />
          <span>Admin Configuration: Update Score Threshold</span>
        </h4>
        <form onSubmit={handleAdminUpdate} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            type="number"
            min="0"
            max="100"
            value={newScoreInput}
            onChange={(e) => setNewScoreInput(Number(e.target.value))}
            className="form-input"
            style={{ width: '140px' }}
            disabled={!walletConnected || isUpdatingScore}
          />
          <button 
            type="submit" 
            className="btn-secondary" 
            disabled={!walletConnected || isUpdatingScore}
            style={{ borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)' }}
          >
            {isUpdatingScore ? <div className="spinner" /> : <Sliders size={16} />}
            <span>Set Minimum Score</span>
          </button>
        </form>
      </div>

    </div>
  );
};
