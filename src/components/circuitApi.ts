/**
 * Midnight Network Compact Circuit API Integration (UI Layer)
 * Real DApp Connector & Contract Interaction Provider for Private Vendor Verification.
 */

export interface VerifyVendorWitnessInputs {
  vendorSecret: Uint8Array;
  complianceScore: bigint;
  taxIdHash: Uint8Array;
  timestamp: bigint;
}

export interface OnChainLedgerState {
  totalVerifiedVendors: number;
  minimumScoreRequirement: number;
  lastVerificationTimestamp: number | null;
  lastVerifiedCommitment: string;
}

// Midnight Indexer GraphQL endpoint default for Preprod
export const DEFAULT_PREPROD_INDEXER = 'https://indexer.preprod.midnight.network/api/v4/graphql';
export const DEFAULT_PREPROD_EXPLORER = 'https://explorer.preprod.midnight.network';
export const DEFAULT_CONTRACT_ADDRESS = '0x0200f8a91b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef12';

/**
 * Safely extract address from Midnight DApp Connector API (supporting v4 ConnectedAPI, RxJS, Promises, and direct getters).
 */
export async function extractAddressFromWalletApi(api: any): Promise<string | null> {
  if (!api) return null;
  console.log('[1AM / Midnight DApp Connector] Connected API instance:', api);

  // 1. Midnight v4 standard: getUnshieldedAddress()
  if (typeof api.getUnshieldedAddress === 'function') {
    try {
      const res = await api.getUnshieldedAddress();
      console.log('[1AM / Midnight DApp Connector] getUnshieldedAddress() result:', res);
      if (typeof res === 'string' && res.length > 0) return res;
      if (res && typeof res.address === 'string') return res.address;
      if (res && typeof res.unshieldedAddress === 'string') return res.unshieldedAddress;
      if (res && typeof res.toString === 'function' && res.toString() !== '[object Object]') return res.toString();
    } catch (e) {
      console.warn('api.getUnshieldedAddress failed:', e);
    }
  }

  // 2. Direct method: getAddress()
  if (typeof api.getAddress === 'function') {
    try {
      const res = await api.getAddress();
      console.log('[1AM / Midnight DApp Connector] getAddress() result:', res);
      if (typeof res === 'string' && res.length > 0) return res;
      if (res && typeof res.address === 'string') return res.address;
    } catch (e) {
      console.warn('api.getAddress failed:', e);
    }
  }

  // 3. Midnight v4: getShieldedAddresses()
  if (typeof api.getShieldedAddresses === 'function') {
    try {
      const res = await api.getShieldedAddresses();
      console.log('[1AM / Midnight DApp Connector] getShieldedAddresses() result:', res);
      if (typeof res === 'string' && res.length > 0) return res;
      if (res && typeof res.address === 'string') return res.address;
      if (res && typeof res.shieldedAddress === 'string') return res.shieldedAddress;
      if (res && res.coinPublicKey) return String(res.coinPublicKey);
    } catch (e) {
      console.warn('api.getShieldedAddresses failed:', e);
    }
  }

  // 4. Method: getConnectionStatus()
  if (typeof api.getConnectionStatus === 'function') {
    try {
      const status = await api.getConnectionStatus();
      console.log('[1AM / Midnight DApp Connector] getConnectionStatus() result:', status);
      if (status?.address) return String(status.address);
      if (status?.unshieldedAddress) return String(status.unshieldedAddress);
      if (status?.account) return String(status.account);
    } catch (e) {
      console.warn('api.getConnectionStatus failed:', e);
    }
  }

  // 5. Observable / Promise method: state()
  if (typeof api.state === 'function') {
    try {
      const stateRes = api.state();
      let state: any = null;

      if (stateRes && typeof stateRes.subscribe === 'function') {
        state = await new Promise<any>((resolve) => {
          let resolved = false;
          const sub = stateRes.subscribe({
            next: (val: any) => {
              if (!resolved) {
                resolved = true;
                resolve(val);
                setTimeout(() => sub?.unsubscribe?.(), 0);
              }
            },
            error: (err: any) => {
              if (!resolved) {
                resolved = true;
                resolve(null);
              }
            },
          });

          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              sub?.unsubscribe?.();
              resolve(null);
            }
          }, 3000);
        });
      } else if (stateRes && typeof stateRes.then === 'function') {
        state = await stateRes;
      } else if (stateRes && typeof stateRes.toPromise === 'function') {
        state = await stateRes.toPromise();
      } else {
        state = stateRes;
      }

      if (state) {
        const candidate =
          state.unshieldedAddress ||
          state.address ||
          state.dustAddress ||
          state.unshielded?.address ||
          (state.unshielded && typeof state.unshielded.getBech32Address === 'function' && state.unshielded.getBech32Address().toString());

        if (candidate && typeof candidate === 'string') return candidate;
      }
    } catch (e) {
      console.warn('api.state() evaluation failed:', e);
    }
  }

  // 6. Direct properties on API object
  if (api.unshieldedAddress && typeof api.unshieldedAddress === 'string') return api.unshieldedAddress;
  if (api.address && typeof api.address === 'string') return api.address;
  if (api.dustAddress && typeof api.dustAddress === 'string') return api.dustAddress;
  if (api.accountId && typeof api.accountId === 'string') return api.accountId;

  return null;
}

/**
 * Query live public ledger state from the Midnight Indexer GraphQL endpoint.
 */
export async function fetchOnChainLedgerState(
  contractAddress: string,
  indexerUrl: string = DEFAULT_PREPROD_INDEXER
): Promise<OnChainLedgerState | null> {
  try {
    const cleanAddress = contractAddress.startsWith('0x') ? contractAddress : `0x${contractAddress}`;
    const query = `
      query GetContractState($address: String!) {
        contractState(address: $address) {
          data
          blockHeight
        }
      }
    `;

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 6000) : null;

    try {
      const response = await fetch(indexerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { address: cleanAddress },
        }),
        signal: controller ? controller.signal : undefined,
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const json = await response.json();
      const stateData = json?.data?.contractState?.data;

      if (stateData) {
        return parseLedgerStateData(stateData);
      }
    } catch {
      if (timeoutId) clearTimeout(timeoutId);
      return null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse raw state data into structured ledger state.
 */
export function parseLedgerStateData(rawState: any): OnChainLedgerState {
  try {
    if (typeof rawState === 'object' && rawState !== null) {
      return {
        totalVerifiedVendors: Number(rawState.totalVerifiedVendors ?? 0),
        minimumScoreRequirement: Number(rawState.minimumScoreRequirement ?? 70),
        lastVerificationTimestamp: rawState.lastVerificationTimestamp ? Number(rawState.lastVerificationTimestamp) : null,
        lastVerifiedCommitment: rawState.lastVerifiedCommitment ? String(rawState.lastVerifiedCommitment) : '0x0000000000000000000000000000000000000000000000000000000000000000',
      };
    }
  } catch (e) {
    console.error('Error parsing contract state:', e);
  }
  return {
    totalVerifiedVendors: 0,
    minimumScoreRequirement: 70,
    lastVerificationTimestamp: null,
    lastVerifiedCommitment: '0x0000000000000000000000000000000000000000000000000000000000000000',
  };
}

/**
 * Execute the `verifyVendor` ZK circuit from the frontend UI layer via Midnight DApp Connector.
 * Enforces client-side private witness score evaluation, generates ZK proof, and registers commitment on-chain.
 */
export async function executeVerifyVendorCircuit(
  contractInstance: any,
  witnesses: VerifyVendorWitnessInputs
): Promise<{ success: boolean; txHash: string; blockHeight?: number }> {
  console.log('[Midnight DApp Connector] Executing verifyVendor ZK circuit with private witness inputs...');

  if (!contractInstance) {
    throw new Error('Wallet not connected. Please connect your 1AM or Lace Wallet first.');
  }

  // 1. Check if contract instance provides callTx (Midnight JS contract bindings)
  if (contractInstance.callTx?.verifyVendor) {
    const txResult = await contractInstance.callTx.verifyVendor(
      witnesses.vendorSecret,
      witnesses.complianceScore,
      witnesses.taxIdHash,
      witnesses.timestamp
    );
    const txId = txResult?.public?.txId || txResult?.public?.txHash || txResult?.txHash || txResult?.hash || txResult?.id;
    if (!txId) {
      throw new Error('Transaction submission failed: no transaction ID returned by wallet provider.');
    }
    return {
      success: true,
      txHash: String(txId),
      blockHeight: txResult?.public?.blockHeight,
    };
  }

  // 2. Check if DApp connector provides generic circuit invocation
  if (typeof contractInstance.executeCircuit === 'function') {
    const txResult = await contractInstance.executeCircuit('verifyVendor', [
      witnesses.vendorSecret,
      witnesses.complianceScore,
      witnesses.taxIdHash,
      witnesses.timestamp,
    ]);
    const txId = txResult?.txId || txResult?.txHash || txResult?.hash;
    if (!txId) throw new Error('Circuit execution did not return a valid transaction hash.');
    return {
      success: true,
      txHash: String(txId),
      blockHeight: txResult?.blockHeight,
    };
  }

  // 3. Check if standard submitTx is available on wallet API
  if (typeof contractInstance.submitTx === 'function') {
    const txResult = await contractInstance.submitTx({
      circuit: 'verifyVendor',
      args: [
        witnesses.vendorSecret,
        witnesses.complianceScore,
        witnesses.taxIdHash,
        witnesses.timestamp,
      ],
    });
    const txId = txResult?.txId || txResult?.txHash || txResult?.hash;
    if (!txId) throw new Error('Transaction submission did not return a valid transaction hash.');
    return {
      success: true,
      txHash: String(txId),
      blockHeight: txResult?.blockHeight,
    };
  }

  throw new Error('The connected Midnight DApp Connector does not export a compatible contract execution interface.');
}

/**
 * Execute the `setMinimumScore` admin circuit from the frontend UI layer.
 * Updates the public minimum compliance threshold on the Midnight ledger.
 */
export async function executeSetMinimumScoreCircuit(
  contractInstance: any,
  newMinimumScore: bigint
): Promise<{ success: boolean; txHash: string; blockHeight?: number }> {
  console.log(`[Midnight DApp Connector] Executing setMinimumScore ZK circuit (Threshold: ${newMinimumScore})...`);

  if (!contractInstance) {
    throw new Error('Wallet not connected. Please connect your 1AM or Lace Wallet first.');
  }

  if (contractInstance.callTx?.setMinimumScore) {
    const txResult = await contractInstance.callTx.setMinimumScore(newMinimumScore);
    const txId = txResult?.public?.txId || txResult?.public?.txHash || txResult?.txHash || txResult?.hash || txResult?.id;
    if (!txId) {
      throw new Error('Transaction submission failed: no transaction ID returned by wallet provider.');
    }
    return {
      success: true,
      txHash: String(txId),
      blockHeight: txResult?.public?.blockHeight,
    };
  }

  if (typeof contractInstance.executeCircuit === 'function') {
    const txResult = await contractInstance.executeCircuit('setMinimumScore', [newMinimumScore]);
    const txId = txResult?.txId || txResult?.txHash || txResult?.hash;
    if (!txId) throw new Error('Circuit execution did not return a valid transaction hash.');
    return {
      success: true,
      txHash: String(txId),
      blockHeight: txResult?.blockHeight,
    };
  }

  if (typeof contractInstance.submitTx === 'function') {
    const txResult = await contractInstance.submitTx({
      circuit: 'setMinimumScore',
      args: [newMinimumScore],
    });
    const txId = txResult?.txId || txResult?.txHash || txResult?.hash;
    if (!txId) throw new Error('Transaction submission did not return a valid transaction hash.');
    return {
      success: true,
      txHash: String(txId),
      blockHeight: txResult?.blockHeight,
    };
  }

  throw new Error('The connected Midnight DApp Connector does not export a compatible setMinimumScore handler.');
}
