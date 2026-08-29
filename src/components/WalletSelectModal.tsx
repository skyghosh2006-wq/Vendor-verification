'use client';

import React from 'react';
import { X, Wallet, ShieldCheck, Cpu, ArrowRight, ExternalLink, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export interface WalletItem {
  id: string;
  name: string;
  icon?: string;
  is1AM: boolean;
  isLace: boolean;
  provider: any;
}

interface WalletSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallet: (wallet: WalletItem | '1am' | 'lace') => void;
  detectedWallets: WalletItem[];
  onRefreshWallets: () => void;
}

export const WalletSelectModal: React.FC<WalletSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectWallet,
  detectedWallets,
  onRefreshWallets,
}) => {
  if (!isOpen) return null;

  const oneAMWallet = detectedWallets.find((w) => w.is1AM);
  const laceWallet = detectedWallets.find((w) => w.isLace);
  const otherWallets = detectedWallets.filter((w) => !w.is1AM && !w.isLace);
  const hasAny = detectedWallets.length > 0;

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
        maxWidth: '540px',
        width: '100%',
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
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(0, 240, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--accent-cyan)'
          }}>
            <Wallet size={24} color="var(--accent-cyan)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Connect Midnight Wallet</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Select your installed Midnight DApp Connector extension
            </p>
          </div>
        </div>

        {/* Status Alert if no wallet is injected */}
        {!hasAny && (
          <div style={{
            background: 'rgba(255, 170, 0, 0.1)',
            border: '1px solid rgba(255, 170, 0, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 16px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            fontSize: '0.85rem'
          }}>
            <AlertCircle size={20} color="#FFAA00" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <strong>1AM Wallet Extension Not Detected</strong>
              <p style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
                Please make sure your 1AM Wallet extension is installed, unlocked, and enabled for this tab.
              </p>
              <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={onRefreshWallets}
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={12} />
                  <span>Scan Again</span>
                </button>
                <a
                  href="https://chromewebstore.google.com/detail/1am-wallet/bphnkdkcnfhompoegfpgnkidcjfbojjp"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                >
                  <span>Install 1AM Extension</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Selection Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Option 1: 1AM Wallet */}
          <div 
            onClick={() => {
              onSelectWallet(oneAMWallet || '1am');
              onClose();
            }}
            className="glass-panel glass-card-interactive"
            style={{
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              borderColor: oneAMWallet ? 'var(--accent-purple)' : 'var(--border-glass)',
              background: oneAMWallet ? 'rgba(157, 78, 221, 0.15)' : 'rgba(15, 23, 42, 0.6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(157, 78, 221, 0.2)', border: '1px solid #9d4edd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={22} color="#9d4edd" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '1.02rem', display: 'block' }}>1AM Wallet</strong>
                  {oneAMWallet ? (
                    <span className="badge badge-purple" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} />
                      <span>Detected</span>
                    </span>
                  ) : null}
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {oneAMWallet ? 'Official 1AM Midnight DApp Connector' : 'Midnight 1AM Browser Extension'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowRight size={18} color="var(--accent-purple)" />
            </div>
          </div>

          {/* Option 2: Lace Wallet */}
          <div 
            onClick={() => {
              onSelectWallet(laceWallet || 'lace');
              onClose();
            }}
            className="glass-panel glass-card-interactive"
            style={{
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              borderColor: laceWallet ? 'var(--accent-cyan)' : 'var(--border-glass)',
              background: laceWallet ? 'rgba(0, 240, 255, 0.15)' : 'rgba(15, 23, 42, 0.6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(0, 240, 255, 0.2)', border: '1px solid #00f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={22} color="#00f0ff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '1.02rem', display: 'block' }}>Lace Wallet</strong>
                  {laceWallet ? (
                    <span className="badge badge-cyan" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} />
                      <span>Detected</span>
                    </span>
                  ) : null}
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {laceWallet ? 'Lace Midnight Connector Active' : 'Official Lace Midnight Wallet'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowRight size={18} color="var(--accent-cyan)" />
            </div>
          </div>

          {/* Other discovered wallets in window.midnight */}
          {otherWallets.map((w) => (
            <div
              key={w.id}
              onClick={() => { onSelectWallet(w); onClose(); }}
              className="glass-panel glass-card-interactive"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                borderColor: 'var(--accent-emerald)',
                background: 'rgba(0, 255, 157, 0.08)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 255, 157, 0.2)', border: '1px solid var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wallet size={20} color="var(--accent-emerald)" />
                </div>
                <div>
                  <strong style={{ fontSize: '1rem', display: 'block' }}>{w.name}</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Injected DApp Connector</span>
                </div>
              </div>
              <ArrowRight size={18} color="var(--accent-emerald)" />
            </div>
          ))}

        </div>

        {/* Network & Faucet Guidance Footer */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-glass)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <span>Need testnet funds or DUST?</span>
          <a
            href="https://faucet.preview.midnight.network/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
          >
            <span>Midnight Faucet</span>
            <ExternalLink size={12} />
          </a>
        </div>

      </div>
    </div>
  );
};
