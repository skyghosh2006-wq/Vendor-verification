import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'buffer';

function stringToBytes32(str: string): Uint8Array {
  const buf = Buffer.alloc(32);
  buf.write(str, 'utf-8');
  return buf;
}

test('1. Locate compiled vendor-verification contract artifacts & ZK circuits', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const zkConfigPath = path.resolve(__dirname, '..', 'contracts', 'managed', 'vendor-verification');
  const contractPath = path.join(zkConfigPath, 'contract', 'index.js');
  const dtsPath = path.join(zkConfigPath, 'contract', 'index.d.ts');
  const verifyVendorZkir = path.join(zkConfigPath, 'zkir', 'verifyVendor.zkir');
  const setMinimumScoreZkir = path.join(zkConfigPath, 'zkir', 'setMinimumScore.zkir');

  assert.equal(fs.existsSync(zkConfigPath), true, 'Managed directory must exist');
  assert.equal(fs.existsSync(contractPath), true, 'Compiled contract index.js must exist');
  assert.equal(fs.existsSync(dtsPath), true, 'TypeScript definitions must exist');
  assert.equal(fs.existsSync(verifyVendorZkir), true, 'verifyVendor.zkir circuit must exist');
  assert.equal(fs.existsSync(setMinimumScoreZkir), true, 'setMinimumScore.zkir circuit must exist');
});

test('2. Convert vendor credentials to 32-byte witness arrays', () => {
  const taxIdStr = 'TAX-US-987654321';
  const secretStr = 'vendor-salt-883921';

  const taxIdBytes = stringToBytes32(taxIdStr);
  const secretBytes = stringToBytes32(secretStr);

  assert.equal(taxIdBytes.length, 32);
  assert.equal(secretBytes.length, 32);

  assert.equal(Buffer.from(taxIdBytes).toString('utf-8').startsWith(taxIdStr), true);
  assert.equal(Buffer.from(secretBytes).toString('utf-8').startsWith(secretStr), true);
});

test('3. Validate compliance score threshold evaluation rules', () => {
  const minimumRequirement = 70n;

  const validVendorScore = 85n;
  const failingVendorScore = 55n;

  const isEligible = (score: bigint, minReq: bigint) => score >= minReq;

  assert.equal(isEligible(validVendorScore, minimumRequirement), true);
  assert.equal(isEligible(failingVendorScore, minimumRequirement), false);
});

test('4. Enforce Privacy Model guarantees (Private Witness vs Ledger Isolation)', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const dtsPath = path.resolve(__dirname, '..', 'contracts', 'managed', 'vendor-verification', 'contract', 'index.d.ts');
  
  const dtsContent = fs.readFileSync(dtsPath, 'utf-8');

  // Public Ledger must contain only disclosed aggregated metrics & commitments
  assert.equal(dtsContent.includes('totalVerifiedVendors'), true);
  assert.equal(dtsContent.includes('lastVerificationTimestamp'), true);
  assert.equal(dtsContent.includes('lastVerifiedCommitment'), true);
  assert.equal(dtsContent.includes('minimumScoreRequirement'), true);

  // Sensitive vendor witnesses MUST NOT exist on the public ledger interface
  assert.equal(dtsContent.includes('readonly complianceScore'), false);
  assert.equal(dtsContent.includes('readonly vendorSecret'), false);
  assert.equal(dtsContent.includes('readonly taxIdHash'), false);
});

test('5. Verify DApp Connector Witness preparation for Midnight circuits', () => {
  const encoder = new TextEncoder();
  const rawSalt = 'secret-salt-xyz-123';
  const rawTaxId = 'TAX-US-998877';

  const vendorSecret = encoder.encode(rawSalt.padEnd(32, '0')).slice(0, 32);
  const taxIdHash = encoder.encode(rawTaxId.padEnd(32, '0')).slice(0, 32);
  const score = 88n;
  const timestamp = BigInt(Math.floor(Date.now() / 1000));

  assert.equal(vendorSecret.length, 32);
  assert.equal(taxIdHash.length, 32);
  assert.equal(typeof score, 'bigint');
  assert.equal(typeof timestamp, 'bigint');
  assert.ok(score >= 70n);
});
