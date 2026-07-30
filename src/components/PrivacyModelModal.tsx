import React from 'react';
import { X, ShieldCheck, Eye, EyeOff, Code2 } from 'lucide-react';

interface PrivacyModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModelModal: React.FC<PrivacyModelModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '720px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        position: 'relative',
        border: '1px solid var(--accent-cyan)'
      }}>
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="btn-secondary" 
          style={{ position: 'absolute', top: '20px', right: '20px', padding: '6px 10px' }}
        >
          <X size={18} />
        </button>

        {/* Modal Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(0, 240, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={24} color="var(--accent-cyan)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Privacy Model Architecture</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Midnight Compact Zero-Knowledge Proof Guarantee Analysis
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* What Observers CAN Learn */}
          <div style={{ background: 'rgba(0, 255, 157, 0.06)', border: '1px solid rgba(0, 255, 157, 0.2)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Eye size={18} />
              <span>What Observers CAN Learn (Public Ledger State)</span>
            </h3>
            <ul style={{ paddingLeft: '20px', fontSize: '0.88rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li><strong>Total Verified Vendors Counter:</strong> The public number of vendors successfully verified on-chain.</li>
              <li><strong>Minimum Compliance Score Requirement:</strong> The current active threshold value (e.g. 70).</li>
              <li><strong>Verification Timestamp:</strong> Unix timestamp of the latest verification execution.</li>
              <li><strong>Verified Commitment Hash:</strong> 32-byte hash computed deterministically from secret inputs.</li>
            </ul>
          </div>

          {/* What Observers CANNOT Learn */}
          <div style={{ background: 'rgba(255, 46, 147, 0.06)', border: '1px solid rgba(255, 46, 147, 0.2)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <EyeOff size={18} />
              <span>What Observers CANNOT Learn (Private Witness Data)</span>
            </h3>
            <ul style={{ paddingLeft: '20px', fontSize: '0.88rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li><strong>Raw Vendor Compliance Score:</strong> The precise score (e.g., 94) remains strictly inside client ZK circuit bounds.</li>
              <li><strong>Vendor Tax / Business ID:</strong> Secret registration string is never published to the network.</li>
              <li><strong>Vendor Secret Salt:</strong> Used for key derivation and commitment generation, completely private.</li>
              <li><strong>Financial Metrics:</strong> Credit history or proprietary internal business records.</li>
            </ul>
          </div>

          {/* Compact Disclose Model */}
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Code2 size={18} />
              <span>Compact Contract Circuit Implementation</span>
            </h3>
            <pre style={{ 
              background: '#04060A', 
              padding: '14px', 
              borderRadius: 'var(--radius-sm)', 
              fontSize: '0.8rem', 
              fontFamily: 'var(--font-mono)', 
              color: '#00F0FF',
              overflowX: 'auto'
            }}>
{`export circuit verifyVendor(
    vendorSecret: Bytes<32>,
    complianceScore: Uint<32>,
    taxIdHash: Bytes<32>,
    timestamp: Uint<64>
): [] {
    // 1. ZK constraint check inside circuit
    assert(complianceScore >= minimumScoreRequirement, "Score below minimum");

    // 2. Compute commitment hash
    const commitment = persistentHash<Vector<2, Bytes<32>>>([vendorSecret, taxIdHash]);

    // 3. Deliberately disclose ONLY public outcomes
    totalVerifiedVendors = disclose((totalVerifiedVendors + 1) as Uint<32>);
    lastVerificationTimestamp = disclose(timestamp);
    lastVerifiedCommitment = disclose(commitment);
}`}
            </pre>
          </div>

        </div>

      </div>
    </div>
  );
};
