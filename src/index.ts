import { zkCipherClient } from './sdk/zkCipherClient';
import { CipherEncryptor } from './cipher/encryptor';
import { CipherDecryptor } from './cipher/decryptor';
import { KeyVault } from './cipher/keyVault';
import { ModelSync } from './ai/modelSync';
import { PrivacyBridge } from './ai/privacyBridge';
import { AINode } from './ai/aiNode';
import { ProofGenerator } from './proof/generator';
import { ProofVerifier } from './proof/verifier';
import { SolanaClient } from './solana/client';
import { SolanaTransactionBuilder } from './solana/transaction';
import { ComponentRegistry } from './sdk/registry';
import { Runtime } from './sdk/runtime';
import { Logger } from './utils/logger';
import { Formatter } from './utils/formatter';

import {
  SDK_VERSION,
  SDK_NAME,
  CIPHER_ALGORITHMS,
  PROOF_TYPES,
  SOLANA_NETWORKS,
  DEFAULT_CONFIG,
  ERROR_CODES,
  LOG_LEVELS,
  ZK_CIPHER_HEADER
} from './constants';

export {
  zkCipherClient,
  CipherEncryptor,
  CipherDecryptor,
  KeyVault,
  ModelSync,
  PrivacyBridge,
  AINode,
  ProofGenerator,
  ProofVerifier,
  SolanaClient,
  SolanaTransactionBuilder,
  ComponentRegistry,
  Runtime,
  Logger,
  Formatter
};

export {
  SDK_VERSION,
  SDK_NAME,
  CIPHER_ALGORITHMS,
  PROOF_TYPES,
  SOLANA_NETWORKS,
  DEFAULT_CONFIG,
  ERROR_CODES,
  LOG_LEVELS,
  ZK_CIPHER_HEADER
};

export type * from './utils/types';

export const initializeSDK = (config?: Partial<typeof DEFAULT_CONFIG>) => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const runtime = Runtime.getInstance();
  runtime.initialize(mergedConfig);
  
  const logger = new Logger(mergedConfig.logLevel);
  logger.info(`Initializing ${SDK_NAME} v${SDK_VERSION}`);
  logger.debug('Runtime configuration loaded', mergedConfig);
  
  const client = new zkCipherClient(mergedConfig);
  logger.success('zkCipherAI SDK initialized successfully');
  
  return client;
};

export const createEncryptionSession = (algorithm: keyof typeof CIPHER_ALGORITHMS = 'ZK_HYBRID') => {
  const encryptor = new CipherEncryptor();
  const decryptor = new CipherDecryptor();
  const keyVault = new KeyVault();
  
  return {
    encryptor,
    decryptor,
    keyVault,
    algorithm: CIPHER_ALGORITHMS[algorithm]
  };
};

export const createAIProofSession = (modelId: string, proofType: keyof typeof PROOF_TYPES = 'AI_INFERENCE_PROOF') => {
  const modelSync = new ModelSync();
  const proofGenerator = new ProofGenerator();
  const privacyBridge = new PrivacyBridge();
  
  return {
    modelSync,
    proofGenerator,
    privacyBridge,
    modelId,
    proofType: PROOF_TYPES[proofType]
  };
};

export const createSolanaVerificationSession = (network: keyof typeof SOLANA_NETWORKS = 'DEVNET') => {
  const client = new SolanaClient(SOLANA_NETWORKS[network]);
  const transaction = new SolanaTransactionBuilder('default_fee_payer');
  
  return {
    client,
    transaction,
    network: SOLANA_NETWORKS[network]
  };
};

export const getSDKInfo = () => {
  return {
    name: SDK_NAME,
    version: SDK_VERSION,
    features: {
      encryption: Object.values(CIPHER_ALGORITHMS),
      proofTypes: Object.values(PROOF_TYPES),
      networks: Object.values(SOLANA_NETWORKS),
      aiIntegration: true,
      zeroKnowledge: true,
      solanaIntegration: true
    },
    runtime: Runtime.getInstance().getStatus()
  };
};

export const shutdownSDK = async () => {
  const runtime = Runtime.getInstance();
  const logger = new Logger();
  
  logger.info('Initiating graceful SDK shutdown...');
  
  await runtime.shutdown();
  logger.info('Runtime shutdown completed');
  
  logger.success('zkCipherAI SDK shutdown successfully');
};

export default {
  initializeSDK,
  createEncryptionSession,
  createAIProofSession,
  createSolanaVerificationSession,
  getSDKInfo,
  shutdownSDK,
  constants: {
    SDK_VERSION,
    SDK_NAME,
    CIPHER_ALGORITHMS,
    PROOF_TYPES,
    SOLANA_NETWORKS,
    DEFAULT_CONFIG,
    ERROR_CODES,
    LOG_LEVELS
  }
};