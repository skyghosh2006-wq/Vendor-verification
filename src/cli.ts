/**
 * CLI for interacting with private-vendor-verification contract
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';
import { Buffer } from 'buffer';

// Midnight SDK imports
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { resolveNetwork, getOrCreateSeed, getDeployment } from './network';
import { createWallet, persistWalletState, unshieldedToken, type WalletContext } from './wallet';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';

// Enable WebSocket for GraphQL subscriptions
// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

const PRIVATE_STATE_ID = 'vendorVerificationPrivateState';

const { network, config: networkConfig } = resolveNetwork();
const SEED = getOrCreateSeed(network);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zkConfigPath = path.resolve(__dirname, '..', 'contracts', 'managed', 'vendor-verification');

// Load compiled contract
const contractPath = path.join(zkConfigPath, 'contract', 'index.js');

// Check if contract is compiled
if (!fs.existsSync(contractPath)) {
  console.error('\n❌ Contract not compiled! Run: npm run compile\n');
  process.exit(1);
}

const VendorVerification = await import(pathToFileURL(contractPath).href);

const compiledContract = CompiledContract.make('vendor-verification', VendorVerification.Contract).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);

// ─── Helpers ───────────────────────────────────────────────────────────────────

function hexToBytes32(hexStr: string): Uint8Array {
  const cleanHex = hexStr.replace(/^0x/, '').padStart(64, '0').slice(0, 64);
  return Buffer.from(cleanHex, 'hex');
}

function stringToBytes32(str: string): Uint8Array {
  const buf = Buffer.alloc(32);
  buf.write(str, 'utf-8');
  return buf;
}

// ─── Providers ─────────────────────────────────────────────────────────────────

async function createProviders(walletCtx: WalletContext) {
  const privateStatePassword = process.env.PRIVATE_STATE_PASSWORD?.trim() || 'Local-Devnet-Development-Placeholder-1';

  const walletProvider = {
    getCoinPublicKey: () => walletCtx.shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => walletCtx.shieldedSecretKeys.encryptionPublicKey,
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: walletCtx.shieldedSecretKeys, dustSecretKey: walletCtx.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      return walletCtx.wallet.finalizeRecipe(recipe);
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
  };

  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);
  const accountId = walletCtx.unshieldedKeystore.getBech32Address().toString();

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'vendor-verification-state',
      accountId,
      privateStoragePasswordProvider: () => privateStatePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(networkConfig.indexer, networkConfig.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(networkConfig.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
}

// ─── Main CLI ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║               Private Vendor Verification CLI                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const rl = createInterface({ input: stdin, output: stdout });

  const deployment = getDeployment(network);
  if (!deployment) {
    console.error(`No deploy on file for network ${network}. Run \`npm run setup -- --network ${network}\` first.`);
    process.exit(1);
  }
  console.log(`  Contract: ${deployment.address}`);
  console.log(`  Network: ${network}\n`);

  try {
    const seed = SEED;

    console.log('  Connecting to wallet...');
    const walletCtx = await createWallet({ network, networkConfig, seed });
    const restoredCount = Object.values(walletCtx.restored).filter(Boolean).length;
    if (restoredCount > 0) {
      console.log(`  Restored ${restoredCount}/3 child wallets from .midnight-wallet-state — sync will resume.`);
    }

    console.log('  Syncing with network...');
    const syncStart = Date.now();
    const syncInterval = setInterval(() => {
      const elapsed = Math.round((Date.now() - syncStart) / 1000);
      process.stdout.write(`\r  ⏳ Still syncing... (${elapsed}s elapsed)   `);
    }, 5000);
    const state = await walletCtx.wallet.waitForSyncedState();
    clearInterval(syncInterval);
    process.stdout.write('\r  ✓ Synced with network.                                      \n');

    await persistWalletState(network, walletCtx);
    const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
    console.log(`  Balance: ${balance.toLocaleString()} tNight\n`);

    if (balance === 0n && network !== 'undeployed' && networkConfig.faucet) {
      const address = walletCtx.unshieldedKeystore.getBech32Address();
      console.log('  ⚠ Wallet has no tNight. Fund it from the faucet to send transactions:');
      console.log(`     ${networkConfig.faucet}`);
      console.log(`     Wallet address: ${address}\n`);
    }

    console.log('  Connecting to contract...');
    const providers = await createProviders(walletCtx);

    const deployed: any = await findDeployedContract(providers, {
      compiledContract: compiledContract as any,
      contractAddress: deployment.address,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: {},
    });

    console.log('  ✅ Connected to contract successfully!\n');

    let running = true;
    while (running) {
      console.log('─── Menu ───────────────────────────────────────────────────────');
      console.log('  1. Verify Vendor Compliance (Zero-Knowledge Proof)');
      console.log('  2. Set Minimum Score Requirement (Admin)');
      console.log('  3. Read Public Ledger State');
      console.log('  4. Check Wallet Balance');
      console.log('  5. Exit\n');

      const choice = await rl.question('  Your choice (1-5): ');

      switch (choice.trim()) {
        case '1': {
          console.log('\n─── Private Vendor Verification ─────────────────────────────');
          const scoreStr = await rl.question('  Enter Compliance Score (e.g. 85): ');
          const taxIdStr = await rl.question('  Enter Tax ID / Business Reg (kept secret): ');
          const secretStr = await rl.question('  Enter Vendor Secret Salt (kept secret): ');

          const score = BigInt(scoreStr.trim() || '80');
          const taxIdHash = stringToBytes32(taxIdStr.trim() || 'TAX-99887766');
          const vendorSecret = stringToBytes32(secretStr.trim() || 'vendor-secret-key-123');
          const timestamp = BigInt(Math.floor(Date.now() / 1000));

          console.log('\n  Generating ZK Proof & submitting transaction...');
          try {
            const tx = await deployed.callTx.verifyVendor(vendorSecret, score, taxIdHash, timestamp);
            console.log('\n  ✅ Vendor Verification Successful!');
            console.log(`  Transaction ID: ${tx.public.txId}`);
            console.log(`  Block Height: ${tx.public.blockHeight}\n`);
          } catch (error) {
            console.error('\n  ❌ Verification Failed:', error instanceof Error ? error.message : error);
          }
          break;
        }

        case '2': {
          console.log('\n─── Set Minimum Compliance Score Requirement ─────────────');
          const newScoreStr = await rl.question('  Enter New Minimum Score Requirement (e.g. 70): ');
          const newScore = BigInt(newScoreStr.trim() || '70');

          console.log('\n  Submitting transaction...');
          try {
            const tx = await deployed.callTx.setMinimumScore(newScore);
            console.log(`\n  ✅ Minimum score requirement updated to ${newScore}`);
            console.log(`  Transaction ID: ${tx.public.txId}`);
            console.log(`  Block Height: ${tx.public.blockHeight}\n`);
          } catch (error) {
            console.error('\n  ❌ Failed to set minimum score:', error instanceof Error ? error.message : error);
          }
          break;
        }

        case '3': {
          console.log('\n─── Public Ledger State ─────────────────────────────────────');
          try {
            const contractState = await providers.publicDataProvider.queryContractState(deployment.address);
            if (contractState) {
              const ledgerState = VendorVerification.ledger(contractState.data);
              const commitmentHex = Buffer.from(ledgerState.lastVerifiedCommitment).toString('hex');
              const dateStr = ledgerState.lastVerificationTimestamp > 0n
                ? new Date(Number(ledgerState.lastVerificationTimestamp) * 1000).toLocaleString()
                : 'None';

              console.log(`  Total Verified Vendors:       ${ledgerState.totalVerifiedVendors}`);
              console.log(`  Minimum Score Requirement:    ${ledgerState.minimumScoreRequirement}`);
              console.log(`  Last Verification Timestamp:  ${dateStr}`);
              console.log(`  Last Verified Commitment Hash: ${commitmentHex || '0x000000000000000000'}\n`);
            } else {
              console.log('  📋 Contract state is empty / not initialized.\n');
            }
          } catch (error) {
            console.error('\n  ❌ Failed to read ledger state:', error instanceof Error ? error.message : error);
          }
          break;
        }

        case '4': {
          console.log('\n─── Wallet Balance ──────────────────────────────────────────');
          const currentState = await walletCtx.wallet.waitForSyncedState();
          const currentBalance = currentState.unshielded.balances[unshieldedToken().raw] ?? 0n;
          const dustBalance = currentState.dust.balance(new Date());
          console.log(`  tNight Balance: ${currentBalance.toLocaleString()}`);
          console.log(`  DUST Balance:   ${dustBalance.toLocaleString()}\n`);
          break;
        }

        case '5':
          running = false;
          console.log('\n  👋 Goodbye!\n');
          break;

        default:
          console.log('\n  ❌ Invalid choice. Please enter 1-5.\n');
      }
    }

    await persistWalletState(network, walletCtx);
    await walletCtx.wallet.stop();
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
  } finally {
    rl.close();
  }
}

main().catch(console.error);
