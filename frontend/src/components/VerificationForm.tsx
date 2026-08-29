import React, { useState } from 'react';
import { Lock, EyeOff, AlertTriangle, Cpu, Sparkles, ArrowRight } from 'lucide-react';

interface VerificationFormProps {
  walletConnected: boolean;
  minimumRequiredScore: number;
  onSubmitVerification: (data: {
    score: number;
    taxId: string;
    secretSalt: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export const VerificationForm: React.FC<VerificationFormProps> = ({
  walletConnected,
  minimumRequiredScore,
  onSubmitVerification,
  isSubmitting,
}) => {
  const [score, setScore] = useState<number>(85);
  const [taxId, setTaxId] = useState<string>('TAX-US-9988776655');
  const [secretSalt, setSecretSalt] = useState<string>('vendor-salt-xyz-88192');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!walletConnected) {
      setErrorMsg('Please connect your 1AM or Lace Wallet before submitting verification proofs.');
      return;
    }

    if (score < minimumRequiredScore) {
      setErrorMsg(`Compliance score (${score}) does not meet the minimum required score (${minimumRequiredScore}). Proof circuit will reject this witness.`);
      return;
    }

    if (!taxId.trim() || !secretSalt.trim()) {
      setErrorMsg('Please provide a valid Tax ID and Secret Salt for zero-knowledge witness computation.');
      return;
    }

    try {
      await onSubmitVerification({ score, taxId, secretSalt });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to generate ZK proof and verify vendor.');
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '28px', height: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={20} color="var(--accent-cyan)" />
            <span>Client-Side ZK Vendor Verification</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Prove compliance locally without revealing your raw score or private Tax ID on-chain.
          </p>
        </div>
        <div className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
          <EyeOff size={12} />
          <span>Zero-Knowledge Witness</span>
        </div>
      </div>

      {errorMsg && (
        <div style={{ 
          background: 'rgba(255, 46, 147, 0.12)', 
          border: '1px solid rgba(255, 46, 147, 0.3)', 
          borderRadius: 'var(--radius-sm)', 
          padding: '12px 16px', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.88rem',
          color: 'var(--text-primary)'
        }}>
          <AlertTriangle size={18} color="var(--accent-rose)" style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* Compliance Score Field */}
        <div>
          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
            <span>Private Compliance / Credit Score</span>
            <span style={{ color: score >= minimumRequiredScore ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
              Required Min: {minimumRequiredScore}
            </span>
          </label>
          <input 
            type="number"
            min="0"
            max="100"
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="form-input"
            required
            disabled={isSubmitting}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            🔒 Checked inside client ZK circuit constraint: <code style={{ color: 'var(--accent-cyan)' }}>assert(complianceScore &gt;= minimumScoreRequirement)</code>
          </span>
        </div>

        {/* Private Tax ID Field */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
            Private Tax ID / Registration Code
          </label>
          <input 
            type="password"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            className="form-input form-input-mono"
            placeholder="e.g. TAX-US-9988776655"
            required
            disabled={isSubmitting}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            🙈 Never transmitted to blockchain. Combined into a secret commitment hash via Compact <code style={{ color: 'var(--accent-cyan)' }}>persistentHash</code>.
          </span>
        </div>

        {/* Secret Salt */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
            Vendor Secret Salt
          </label>
          <input 
            type="password"
            value={secretSalt}
            onChange={(e) => setSecretSalt(e.target.value)}
            className="form-input form-input-mono"
            placeholder="e.g. vendor-salt-key"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Local Proof Notice */}
        <div style={{ background: 'rgba(0, 240, 255, 0.05)', border: '1px border-glass', borderRadius: 'var(--radius-sm)', padding: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <Cpu size={18} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>Client Proving Notice:</strong> ZK Proof calculation occurs locally on your browser/client device before sending the transaction envelope to Midnight Indexer.
          </span>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={!walletConnected || isSubmitting}
          className="btn-primary" 
          style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '10px' }}
        >
          {isSubmitting ? (
            <>
              <div className="spinner" />
              <span>Generating ZK Proof & Verifying...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Generate ZK Proof & Register Vendor</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>

      </form>
    </div>
  );
};
