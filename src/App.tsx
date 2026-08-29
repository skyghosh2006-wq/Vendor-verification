import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { VerificationForm } from './components/VerificationForm';
import { LedgerDashboard } from './components/LedgerDashboard';
import { PrivacyModelModal } from './components/PrivacyModelModal';
import { WalletSelectModal, WalletItem } from './components/WalletSelectModal';
import MagicRings from './components/MagicRings';
import {
  executeVerifyVendorCircuit,
  executeSetMinimumScoreCircuit,
  fetchOnChainLedgerState,
  extractAddressFromWalletApi,
  DEFAULT_CONTRACT_ADDRESS,
  DEFAULT_PREPROD_EXPLORER,
} from './components/circuitApi';
import { CheckCircle2, AlertCircle, Info, Sparkles, ExternalLink } from 'lucide-react';

export const App: React.FC = () => {
  // Environment variables / Config
  const network =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_NETWORK) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_NETWORK) ||
    'preprod';

  const envContractAddress =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_CONTRACT_ADDRESS) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CONTRACT_ADDRESS) ||
    DEFAULT_CONTRACT_ADDRESS;

  // Mount state to prevent hydration mismatches
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Real Midnight Wallet Connection State
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletProviderName, setWalletProviderName] = useState<string>('');
  const [contractInstance, setContractInstance] = useState<any>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [detectedWallets, setDetectedWallets] = useState<WalletItem[]>([]);

  // Public On-Chain Ledger State
  const [contractAddress, setContractAddress] = useState<string>(envContractAddress);
  const [totalVerifiedVendors, setTotalVerifiedVendors] = useState<number>(0);
  const [minimumRequiredScore, setMinimumRequiredScore] = useState<number>(70);
  const [lastVerificationTimestamp, setLastVerificationTimestamp] = useState<number | null>(null);
  const [lastVerifiedCommitment, setLastVerifiedCommitment] = useState<string>(
    '0x0000000000000000000000000000000000000000000000000000000000000000'
  );
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  // UI Flow States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUpdatingScore, setIsUpdatingScore] = useState<boolean>(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string; txHash?: string } | null>(null);

  // Safe client-side wallet scanner for Midnight v4 Multi-Wallet pattern
  const scanWallets = useCallback((): WalletItem[] => {
    if (typeof window === 'undefined') return [];

    try {
      const w = window as any;
      const midnight = w.midnight;
      const list: WalletItem[] = [];

      if (midnight && typeof midnight === 'object') {
        const keys = Object.keys(midnight);
        for (const key of keys) {
          try {
            const entry = midnight[key];
            if (entry && (typeof entry.connect === 'function' || typeof entry.enable === 'function')) {
              const rawName = String(entry.name || key);
              const is1AM =
                rawName.toLowerCase().includes('1am') ||
                key.toLowerCase().includes('1am') ||
                rawName.toLowerCase().includes('oneam') ||
                key.toLowerCase().includes('oneam');

              const isLace =
                rawName.toLowerCase().includes('lace') ||
                key.toLowerCase().includes('lace') ||
                key === 'mnLace';

              list.push({
                id: key,
                name: is1AM ? '1AM Wallet' : isLace ? 'Lace Wallet' : rawName,
                icon: entry.icon,
                is1AM,
                isLace,
                provider: entry,
              });
            }
          } catch (e) {
            console.warn('Error reading window.midnight entry:', key, e);
          }
        }
      }

      // Check legacy direct properties
      if (w.oneAM && !list.some((x) => x.is1AM)) {
        list.push({ id: 'oneAM', name: '1AM Wallet', is1AM: true, isLace: false, provider: w.oneAM });
      }
      if (w.oneAMWallet && !list.some((x) => x.is1AM)) {
        list.push({ id: 'oneAMWallet', name: '1AM Wallet', is1AM: true, isLace: false, provider: w.oneAMWallet });
      }
      if (w.cardano?.lace && !list.some((x) => x.isLace)) {
        list.push({ id: 'cardano.lace', name: 'Lace Wallet', is1AM: false, isLace: true, provider: w.cardano.lace });
      }

      console.log('[Midnight Wallet Discovery] Discovered wallets:', list);
      return list;
    } catch {
      return [];
    }
  }, []);

  // Fetch real on-chain ledger state from Midnight Indexer
  const refreshLedgerState = useCallback(async (addressToQuery?: string) => {
    const targetAddr = addressToQuery || contractAddress;
    if (!targetAddr) return;

    try {
      const state = await fetchOnChainLedgerState(targetAddr);
      if (state) {
        setTotalVerifiedVendors(state.totalVerifiedVendors);
        setMinimumRequiredScore(state.minimumScoreRequirement);
        setLastVerificationTimestamp(state.lastVerificationTimestamp);
        setLastVerifiedCommitment(state.lastVerifiedCommitment);
      }
    } catch (err) {
      console.warn('Failed to sync on-chain state:', err);
    }
  }, [contractAddress]);

  // Initial client mount & scan
  useEffect(() => {
    setIsMounted(true);
    const detected = scanWallets();
    setDetectedWallets(detected);
    refreshLedgerState(contractAddress);

    // Periodically re-scan in first 4 seconds in case extension initializes asynchronously
    const timer1 = setTimeout(() => setDetectedWallets(scanWallets()), 500);
    const timer2 = setTimeout(() => setDetectedWallets(scanWallets()), 1500);
    const timer3 = setTimeout(() => setDetectedWallets(scanWallets()), 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [contractAddress, refreshLedgerState, scanWallets]);

  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string, txHash?: string) => {
    setToast({ type, title, message, txHash });
    setTimeout(() => setToast(null), 8000);
  };

  const handleOpenWalletModal = () => {
    setDetectedWallets(scanWallets());
    setIsWalletModalOpen(true);
  };

  // Official Midnight DApp Connector Integration (connect with networkId)
  const handleSelectWallet = async (walletTarget: WalletItem | '1am' | 'lace') => {
    if (typeof window === 'undefined') return;

    let provider: any = null;
    let displayName = 'Midnight Wallet';

    if (typeof walletTarget === 'object' && walletTarget !== null) {
      provider = walletTarget.provider;
      displayName = walletTarget.name;
    } else {
      const latestWallets = scanWallets();
      if (walletTarget === '1am') {
        displayName = '1AM Wallet';
        const found = latestWallets.find((w) => w.is1AM);
        provider = found ? found.provider : (window as any).midnight?.['1am-wallet'] || (window as any).oneAM;
      } else if (walletTarget === 'lace') {
        displayName = 'Lace Wallet';
        const found = latestWallets.find((w) => w.isLace);
        provider = found ? found.provider : (window as any).midnight?.mnLace || (window as any).cardano?.lace;
      }
    }

    if (!provider) {
      showToast(
        'error',
        `${displayName} Extension Not Detected`,
        `Please open your ${displayName} extension, unlock your wallet, and try connecting again.`
      );
      return;
    }

    try {
      showToast('info', 'Connecting Wallet', `Please approve the connection request in your ${displayName} popup...`);

      let api: any = null;
      const targetNetwork = network || 'preprod';

      // 1. Midnight v4 standard connect(networkId)
      if (typeof provider.connect === 'function') {
        try {
          console.log(`[1AM Connector] Calling provider.connect("${targetNetwork}")...`);
          api = await provider.connect(targetNetwork);
        } catch (connectErr: any) {
          console.warn(`[1AM Connector] provider.connect("${targetNetwork}") threw:`, connectErr);
          try {
            api = await provider.connect();
          } catch {
            throw connectErr;
          }
        }
      } else if (typeof provider.enable === 'function') {
        console.log('[1AM Connector] Calling provider.enable()...');
        api = await provider.enable();
      }

      if (!api) {
        throw new Error(`Connection request was declined in ${displayName}.`);
      }

      console.log('[1AM Connector] Established connected API session:', api);

      // Extract real address
      const addr = await extractAddressFromWalletApi(api);

      if (!addr) {
        throw new Error(
          `Connected to ${displayName}, but no active wallet address was returned. Please verify that your 1AM Wallet has an active funded account.`
        );
      }

      setWalletConnected(true);
      setWalletAddress(addr);
      setWalletProviderName(displayName);
      setContractInstance(api);

      showToast(
        'success',
        `${displayName} Connected!`,
        `Connected address: ${addr.slice(0, 16)}...`
      );

      // Refresh on-chain state upon connection
      await refreshLedgerState(contractAddress);
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      showToast(
        'error',
        'Connection Failed',
        err?.message || `Failed to establish connection with ${displayName}. Please check extension permissions.`
      );
    }
  };

  // Disconnect Handler
  const handleDisconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress(null);
    setWalletProviderName('');
    setContractInstance(null);
    showToast('info', 'Wallet Disconnected', 'Disconnected Midnight wallet session.');
  };

  // Submit genuine private vendor verification ZK circuit
  const handleSubmitVerification = async (data: { score: number; taxId: string; secretSalt: string }) => {
    if (!walletConnected || !contractInstance) {
      showToast('error', 'Wallet Required', 'Please connect your 1AM or Lace Wallet before submitting verification proofs.');
      return;
    }

    setIsSubmitting(true);
    showToast('info', 'Generating ZK Proof', 'Computing witness and submitting verifyVendor circuit to Midnight Network...');

    try {
      const encoder = new TextEncoder();
      const vendorSecret = encoder.encode(data.secretSalt.padEnd(32, '0')).slice(0, 32);
      const taxIdHash = encoder.encode(data.taxId.padEnd(32, '0')).slice(0, 32);
      const timestamp = BigInt(Math.floor(Date.now() / 1000));
      const scoreBigInt = BigInt(data.score);

      // Execute genuine verifyVendor circuit via DApp connector
      const res = await executeVerifyVendorCircuit(contractInstance, {
        vendorSecret,
        complianceScore: scoreBigInt,
        taxIdHash,
        timestamp,
      });

      setLastTxHash(res.txHash);

      // Refresh live on-chain state
      await refreshLedgerState(contractAddress);

      showToast(
        'success',
        'Vendor Verification Confirmed On-Chain!',
        `Midnight transaction submitted successfully: ${res.txHash.slice(0, 18)}...`,
        res.txHash
      );
    } catch (err: any) {
      console.error('Verification transaction error:', err);
      showToast(
        'error',
        'Verification Failed',
        err?.message || 'Transaction submission or ZK proof generation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit genuine admin threshold update circuit
  const handleUpdateMinimumScore = async (newScore: number) => {
    if (!walletConnected || !contractInstance) {
      showToast('error', 'Wallet Required', 'Please connect your wallet to submit contract transactions.');
      return;
    }

    setIsUpdatingScore(true);
    showToast('info', 'Submitting Transaction', `Updating minimum score threshold to ${newScore} on-chain...`);

    try {
      const res = await executeSetMinimumScoreCircuit(contractInstance, BigInt(newScore));
      setMinimumRequiredScore(newScore);
      if (res.txHash) {
        setLastTxHash(res.txHash);
      }

      await refreshLedgerState(contractAddress);

      showToast(
        'success',
        'Threshold Updated On-Chain',
        `Minimum compliance score requirement updated to ${newScore}.`,
        res.txHash
      );
    } catch (err: any) {
      console.error('Update threshold error:', err);
      showToast('error', 'Update Failed', err?.message || 'Failed to update threshold on-chain.');
    } finally {
      setIsUpdatingScore(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {/* Interactive Shader Background */}
      {isMounted && (
        <MagicRings
          color="#00f0ff"
          colorTwo="#9d4edd"
          speed={0.8}
          ringCount={6}
          attenuation={10}
          lineThickness={2.2}
          baseRadius={0.3}
          radiusStep={0.12}
          scaleRate={0.1}
          opacity={0.65}
          noiseAmount={0.08}
          ringGap={1.5}
          followMouse={true}
          mouseInfluence={0.25}
          parallax={0.06}
          clickBurst={false}
        />
      )}
      
      {/* Top Navigation */}
      <Navbar
        walletConnected={walletConnected}
        walletAddress={walletAddress}
        network={network}
        contractAddress={contractAddress}
        onConnectWallet={handleOpenWalletModal}
        onDisconnectWallet={handleDisconnectWallet}
        onOpenPrivacyInfo={() => setIsPrivacyModalOpen(true)}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* Toast Notification Banner */}
        {toast && (
          <div className="glass-panel" style={{
            padding: '14px 20px',
            borderColor: toast.type === 'success' ? 'var(--accent-emerald)' : toast.type === 'error' ? 'var(--accent-rose)' : 'var(--accent-cyan)',
            background: toast.type === 'success' ? 'rgba(0, 255, 157, 0.1)' : toast.type === 'error' ? 'rgba(255, 46, 147, 0.1)' : 'rgba(0, 240, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {toast.type === 'success' && <CheckCircle2 size={20} color="var(--accent-emerald)" />}
              {toast.type === 'error' && <AlertCircle size={20} color="var(--accent-rose)" />}
              {toast.type === 'info' && <Info size={20} color="var(--accent-cyan)" />}
              <div>
                <strong style={{ fontSize: '0.9rem', display: 'block' }}>{toast.title}</strong>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{toast.message}</span>
              </div>
            </div>
            {toast.txHash && (
              <a
                href={`${DEFAULT_PREPROD_EXPLORER}/tx/${toast.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '6px 12px', color: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)' }}
              >
                <span>View Explorer</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}

        {/* Hero Section */}
        <div className="glass-panel" style={{ padding: '32px', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(11, 15, 23, 0.95) 100%)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,240,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          
          <div style={{ maxWidth: '780px' }}>
            <div className="badge badge-cyan" style={{ marginBottom: '12px' }}>
              <Sparkles size={14} />
              <span>Midnight Network Privacy Protocol • Preprod</span>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '12px' }}>
              Zero-Knowledge Enterprise Vendor Compliance
            </h2>
            <p style={{ fontSize: '0.98rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Verify vendor credentials, credit scores, and tax registration status with zero exposure of sensitive proprietary financial data. Powered by Midnight Network zero-knowledge circuits and 1AM Wallet DApp Connector.
            </p>
          </div>
        </div>

        {/* Workspace Layout: Form & Ledger */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', alignItems: 'start' }}>
          
          {/* Verification Form Section */}
          <VerificationForm
            walletConnected={walletConnected}
            minimumRequiredScore={minimumRequiredScore}
            onSubmitVerification={handleSubmitVerification}
            isSubmitting={isSubmitting}
          />

          {/* Public Ledger Dashboard Section */}
          <LedgerDashboard
            totalVerifiedVendors={totalVerifiedVendors}
            minimumRequiredScore={minimumRequiredScore}
            lastVerificationTimestamp={lastVerificationTimestamp}
            lastVerifiedCommitment={lastVerifiedCommitment}
            contractAddress={contractAddress}
            lastTxHash={lastTxHash}
            walletConnected={walletConnected}
            onUpdateMinimumScore={handleUpdateMinimumScore}
            isUpdatingScore={isUpdatingScore}
            onRefreshState={() => refreshLedgerState(contractAddress)}
          />

        </div>

      </main>

      {/* Footer */}
      <footer className="glass-panel" style={{ borderRadius: 0, borderBottom: 'none', borderLeft: 'none', borderRight: 'none', padding: '20px 24px', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>Private Vendor Verification dApp • Midnight Network</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Compact 0.5.1</span>
            <span>Midnight SDK 4.1.1</span>
            <span style={{ color: 'var(--accent-emerald)' }}>DApp Connector Active</span>
          </div>
        </div>
      </footer>

      {/* Privacy Model Information Modal */}
      <PrivacyModelModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      {/* Wallet Selection Modal */}
      {isMounted && (
        <WalletSelectModal
          isOpen={isWalletModalOpen}
          onClose={() => setIsWalletModalOpen(false)}
          onSelectWallet={handleSelectWallet}
          detectedWallets={detectedWallets}
          onRefreshWallets={() => setDetectedWallets(scanWallets())}
        />
      )}

    </div>
  );
};
