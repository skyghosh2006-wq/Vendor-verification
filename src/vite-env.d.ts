/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NETWORK: string;
  readonly VITE_CONTRACT_ADDRESS: string;
  readonly VITE_PROOF_SERVER_URL: string;
  readonly VITE_INDEXER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  midnight?: {
    lace?: {
      enable: () => Promise<{
        address: string;
        networkId: string;
        apiVersion: string;
      }>;
      isEnabled: () => Promise<boolean>;
      name: string;
      icon: string;
      version: string;
    };
  };
  cardano?: {
    lace?: any;
  };
}
