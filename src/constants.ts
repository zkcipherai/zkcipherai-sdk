export const SDK_VERSION = '1.0.0';
export const SDK_NAME = 'zkCipherAI-SDK';

export const CIPHER_ALGORITHMS = {
  AES_256_GCM: 'aes-256-gcm',
  CHACHA20_POLY1305: 'chacha20-poly1305',
  ZK_HYBRID: 'zk-hybrid-aes'
} as const;

export const PROOF_TYPES = {
  RANGE_PROOF: 'range_proof',
  MEMBERSHIP_PROOF: 'membership_proof',
  VALIDITY_PROOF: 'validity_proof',
  AI_INFERENCE_PROOF: 'ai_inference_proof'
} as const;

export const SOLANA_NETWORKS = {
  MAINNET: 'mainnet-beta',
  DEVNET: 'devnet',
  TESTNET: 'testnet',
  LOCALNET: 'localnet'
} as const;

export const DEFAULT_RPC_ENDPOINTS = {
  [SOLANA_NETWORKS.MAINNET]: 'https://api.mainnet-beta.solana.com',
  [SOLANA_NETWORKS.DEVNET]: 'https://api.devnet.solana.com',
  [SOLANA_NETWORKS.TESTNET]: 'https://api.testnet.solana.com',
  [SOLANA_NETWORKS.LOCALNET]: 'http://localhost:8899'
} as const;

export const KEY_DERIVATION = {
  SALT_BYTES: 32,
  ITERATIONS: 100000,
  KEY_LENGTH: 32,
  ALGORITHM: 'pbkdf2'
} as const;

export const ENCRYPTION_PARAMS = {
  IV_LENGTH: 16,
  TAG_LENGTH: 16,
  BLOCK_SIZE: 128,
  KEY_SIZE: 256
} as const;

export const PROOF_PARAMS = {
  BATCH_SIZE: 1000,
  COMPRESSION_THRESHOLD: 0.95,
  MAX_CIRCUIT_SIZE: 1000000,
  MIN_SECURITY_LEVEL: 128
} as const;

export const AI_MODEL_CONFIG = {
  SYNC_INTERVAL: 30000,
  MODEL_HASH_LENGTH: 64,
  MAX_MODEL_SIZE: 1024 * 1024 * 100,
  ENCRYPTED_GRADIENTS: true
} as const;

export const ERROR_CODES = {
  INVALID_CIPHER_TEXT: 'CIPHER_001',
  PROOF_GENERATION_FAILED: 'PROOF_001',
  SOLANA_RPC_ERROR: 'SOLANA_001',
  AI_MODEL_SYNC_FAILED: 'AI_001',
  KEY_DERIVATION_FAILED: 'KEY_001',
  SESSION_EXPIRED: 'SESSION_001',
  INSUFFICIENT_PERMISSIONS: 'AUTH_001'
} as const;

export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SILENT: 4
} as const;

export const ANIMATION_CONFIG = {
  DECRYPT_SPEED: 50,
  MATRIX_CHARS: '01',
  COLORS: ['\x1b[32m', '\x1b[36m', '\x1b[92m'],
  RESET_COLOR: '\x1b[0m'
} as const;

export const SESSION_CONFIG = {
  TIMEOUT: 3600000,
  RENEWAL_THRESHOLD: 300000,
  MAX_SESSIONS: 1000
} as const;

export const REGISTRY_KEYS = {
  ACTIVE_SESSIONS: 'active_sessions',
  ENCRYPTION_KEYS: 'encryption_keys',
  PROOF_CACHE: 'proof_cache',
  AI_MODELS: 'ai_models',
  TRANSACTION_LOGS: 'transaction_logs'
} as const;

export const CIPHER_STREAMS = {
  ENCRYPTION: 'encryption_stream',
  DECRYPTION: 'decryption_stream',
  PROOF_GENERATION: 'proof_generation_stream',
  AI_SYNC: 'ai_sync_stream'
} as const;

export const ZK_CIPHER_HEADER = 'zkCipherAI_v1';
export const PROOF_MAGIC_BYTES = '0xzkproof';
export const AI_MODEL_MAGIC = 'zkAIModel_v1';

export const DEFAULT_CONFIG = {
  network: SOLANA_NETWORKS.DEVNET,
  logLevel: LOG_LEVELS.INFO,
  autoSyncAI: true,
  proofCompression: true,
  sessionTracking: true,
  encryptionAlgorithm: CIPHER_ALGORITHMS.ZK_HYBRID
} as const;