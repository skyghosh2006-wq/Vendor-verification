# Private Vendor Verification (Midnight dApp)

[![Midnight Network](https://img.shields.io/badge/Midnight-ZK_Protocol-00F0FF?style=for-the-badge)](https://midnight.network)
[![Level 3 Submission](https://img.shields.io/badge/Level_3-Confidential_Credentials-00FF9D?style=for-the-badge)](#submission-checklists)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://private-vendor-verification-fronten.vercel.app/)
[![YouTube Demo](https://img.shields.io/badge/YouTube-Video_Demo-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/9_tS69z-GEM?si=2DitQYsSC1SnvYvj)
[![Build Status](https://img.shields.io/badge/CI-Passing-00F0FF?style=for-the-badge)](#cicd-pipeline)


[Prepod Wallet Connected]<img width="2873" height="1566" alt="image" src="https://github.com/user-attachments/assets/763d1baf-90c4-46fa-b5e2-dc57e7402372" />

<img width="2878" height="1555" alt="image" src="https://github.com/user-attachments/assets/38aa80e8-e0ec-4955-916e-a41e943fea3c" />

<img width="2873" height="1548" alt="image" src="https://github.com/user-attachments/assets/841456ff-a0cb-40be-8740-3a7383def43b" />
<img width="2863" height="1545" alt="image" src="https://github.com/user-attachments/assets/57871d08-f391-4920-b684-ede44145b4b2" />

<img width="1015" height="243" alt="image" src="https://github.com/user-attachments/assets/bf575b14-e1b1-4916-8b5d-992dad59bcdc" />



A full-stack zero-knowledge dApp built on the **Midnight Network** for enterprise compliance and private vendor verification. This submission satisfies all Level 1, Level 2, and Level 3 requirements of the Midnight Developer Challenge.

👉 **Vercel Deployment Link**: [https://vendor-verification-frontend-seven.vercel.app/](https://vendor-verification-frontend-seven.vercel.app/)  
🎬 **Video Walkthrough**: https://youtu.be/9_f9l9Cdk5k 

🆔 **Preprod Contract Address**: 0xed3c0b8bbdc6e2405d1b606dfe38ef7d895ad95c9d7ecd69b68b4c2a0fa5e68b

🌍 **Deployment Tx**:0xb13f0d232605c0bc819c973a14a152ffaf47a8845dba8f26f4fb845ad38bc0b4

🌐 **Midnight Preprod Explorer**: https://preprod.midnightexplorer.com/contracts/ed3c0b8bbdc6e2405d1b606dfe38ef7d895ad95c9d7ecd69b68b4c2a0fa5e68b


---

## 💡 Product Proposal: Confidential Credentials for Enterprise Procurement

### Background & Problem
Enterprise procurement departments, supply chain networks, and decentralized protocols require vendors to prove compliance (e.g., passing a minimum compliance/credit score of 70+, possessing a valid tax registration code, and holding active certifications).

However, traditional public blockchains force vendors to post their raw scores, tax identification numbers, and proprietary metrics on a public ledger. Exposing this information invites competitive espionage, data leaks, and regulatory non-compliance.

### The Midnight Solution
`Private Vendor Verification` uses Midnight's **Compact zero-knowledge smart contracts** to allow vendors to verify compliance:
1. **Client-Side ZK Proof Generation**: The vendor enters their private tax registration ID, secret salt, and compliance score on their own device.
2. **ZK Constraint Verification**: The Compact circuit evaluates `assert(complianceScore >= minimumScoreRequirement)` locally inside the client's proof server.
3. **Official DApp Connector & Genuine Transactions**: The frontend connects directly to the **Lace Midnight Wallet** (`window.midnight.lace`), signing real zero-knowledge transactions (`verifyVendor` & `setMinimumScore`) on the Midnight network with verifiable explorer transaction links.
4. **Privacy-Preserving Ledger State**: The circuit outputs a deterministic 32-byte commitment hash `persistentHash([vendorSecret, taxIdHash])` and increments the public verified vendor counter on-chain—disclosing **zero** raw metrics or sensitive IDs.

---

## 🛡️ Privacy Model

| Category | Data Item | Exposure Level | Description |
| :--- | :--- | :--- | :--- |
| **Public Ledger** | Total Verified Vendors | 🌐 Public | Disclosed counter incremented upon successful ZK proof verification |
| **Public Ledger** | Minimum Score Requirement | 🌐 Public | Disclosed active minimum threshold (e.g. `70`) |
| **Public Ledger** | Last Verification Timestamp | 🌐 Public | Disclosed Unix timestamp of latest verification |
| **Public Ledger** | Last Verified Commitment Hash | 🌐 Public | Disclosed 32-byte zero-knowledge commitment hash |
| **Private Witness** | Compliance Score | 🙈 Confidential | Verified inside circuit via `assert()`; never published |
| **Private Witness** | Tax / Registration ID | 🙈 Confidential | Kept strictly on client device; never leaves local memory |
| **Private Witness** | Vendor Secret Salt | 🙈 Confidential | Secret key used for commitment derivation; private |

### Deliberate Disclosures in Compact
In Compact, state updates must explicitly wrap values in `disclose()` to commit them to the public ledger:
```compact
export circuit verifyVendor(
    vendorSecret: Bytes<32>,
    complianceScore: Uint<32>,
    taxIdHash: Bytes<32>,
    timestamp: Uint<64>
): [] {
    // 1. Private ZK constraint check
    assert(complianceScore >= minimumScoreRequirement, "Vendor compliance score is below required minimum threshold");

    // 2. Deterministic commitment calculation
    const commitment = persistentHash<Vector<2, Bytes<32>>>([vendorSecret, taxIdHash]);

    // 3. Deliberately disclosed public ledger outputs
    totalVerifiedVendors = disclose((totalVerifiedVendors + 1) as Uint<32>);
    lastVerificationTimestamp = disclose(timestamp);
    lastVerifiedCommitment = disclose(commitment);
}
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js**: v22+ (`node -v`)
- **npm**: v10+ (`npm -v`)
- **Compact Compiler**: v0.5.1+ (`compact --version` at `~/.local/bin/compact`)
- **Docker**: Docker Desktop with WSL2 integration (for local proof server)
- **Lace Midnight Wallet**: Browser extension with Preprod network enabled

### 1. Repository Setup
```bash
# Install root dependencies
npm install

# Install frontend dependencies
npm --prefix frontend install
```

### 2. Compile Compact Smart Contract
```bash
npm run compile
```
*Outputs generated circuits and TypeScript declarations to `contracts/managed/vendor-verification/`.*

### 3. Run Automated Tests
```bash
npm test
```
*Runs 4 comprehensive unit tests covering compilation, witness byte conversions, score evaluation rules, and privacy isolation.*

### 4. Deployment (`preprod` or `undeployed`)
Ensure Docker is running for the local proof server:
```bash
npm run setup -- --network preprod
```
*Stores deployed contract address to `.midnight-state.json`.*

### 5. Interactive CLI Utility
```bash
npm run cli
```
Offers interactive options to:
1. Verify Vendor Compliance (generate ZK proof with private witnesses)
2. Set Minimum Compliance Score (admin threshold configuration)
3. Query Public Ledger State
4. Check Wallet tNight & DUST Balance

### 6. Launch Web Frontend
```bash
npm run frontend:dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Connect 1AN Wallet to execute genuine on-chain ZK transactions.

---

## 🔗 Project Links & Live Deployment

- **Live Web Application (Vercel)**: [https://vendor-verification-frontend-seven.vercel.app/](https://vendor-verification-frontend-seven.vercel.app/)
- **Video Walkthrough (YouTube)**: https://youtu.be/9_f9l9Cdk5k 
- **Preprod Contract Address**:  0xed3c0b8bbdc6e2405d1b606dfe38ef7d895ad95c9d7ecd69b68b4c2a0fa5e68b
- **Midnight Preprod Explorer**: [https://preprod.midnightexplorer.com](https://preprod.midnightexplorer.com)
- **GitHub Repository**: [https://github.com/skyghosh2006-wq/Vendor-verification](https://github.com/skyghosh2006-wq/Vendor-verification)

---

## 🌐 Preview / Preprod Deployment Handling

To attempt deployment to the Preprod testnet:
```bash
npm run setup -- --network preprod
```

### Preprod Status & Wallet Persistence
- **Address & Wallet State**: Funded testnet wallets generate a persistent `mn_addr_preprod...` address and save state in `.midnight-state.json` and `.midnight-wallet-state`.
- **Faucet Funding**: The address can be funded via the official Midnight Preprod Faucet.
- **Sync Blocker Log**: If Preprod wallet indexer sync hangs or times out due to testnet RPC latency, `.midnight-state.json` retains the seed and funded state. Local development and proof server deployment (`--network undeployed`) remain 100% operational.

---

## 🧪 CI/CD Pipeline

Continuous Integration is configured via `.github/workflows/ci.yml`. On every `push` and `pull_request` to `main`:
1. Installs Node 22 & Compact CLI environment
2. Installs root & frontend dependencies
3. Compiles the Compact contract (`npm run compile`)
4. Runs unit test suite (`npm test`)
5. Type-checks and builds the Vite production frontend bundle (`npm run frontend:build`)

<img width="1015" height="243" alt="image" src="https://github.com/user-attachments/assets/bf575b14-e1b1-4916-8b5d-992dad59bcdc" />


---

## 📋 Submission Checklists

### Level 1 Checklist
- [x] **Compact Contract**: Public ledger state & private witness inputs with deliberate `disclose()` usage.
- [x] **Contract Compilation**: Compiles via `compact compile` with `contracts/managed/` generated artifacts.
- [x] **Local Deployment**: `npm run setup -- --network undeployed` initializes standalone devnet & proof server.
- [x] **CLI Interaction**: Interactive menu for ZK proof creation & ledger state inspection.
- [x] **Preview/Preprod Handling**: Deployment script config & documented fallback handling.
- [x] **README**: Complete setup, compile, deploy, and privacy model section.
- [x] **Git Commit History**: At least 5+ meaningful commits.

### Level 2 Checklist
- [x] **Lace Wallet Integration**: Connect, disconnect, wallet status, and network status indicator.
- [x] **Contract Integration**: Loads contract address & network from environment variables (`VITE_NETWORK`, `VITE_CONTRACT_ADDRESS`).
- [x] **Privacy Behavior**: Client-side private witness entry without displaying raw credentials publicly.
- [x] **Vercel / Netlify Readiness**: Production Vite build configured with `.env.example`.
- [x] **Git Commit History**: At least 8+ meaningful commits.

### Level 3 Checklist
- [x] **Automated Tests**: 4 unit tests covering contract compilation, witness conversions, score bounds, and privacy isolation (`npm test`).
- [x] **CI/CD Pipeline**: GitHub Actions workflow (`.github/workflows/ci.yml`) automating build, test, and frontend type-checking.
- [x] **Production Polish & UX**: Modern glassmorphic dark theme, glowing badges, loading spinners, toast alerts, error banners, and empty states.
- [x] **Product Proposal**: Fully articulated proposal for **Confidential Credentials** in enterprise vendor management.
- [x] **Git Commit History**: 10+ structured commits.

---

## 📄 License
MIT License. Built for the Midnight Network Developer Challenge.
