// Core SDK Types
export interface SDKConfig {
  encryptionLevel: 'basic' | 'medium' | 'high' | 'maximum';
  proofGeneration: 'immediate' | 'batch' | 'on_demand';
  verificationMode: 'local' | 'on_chain' | 'both';
  network: 'mainnet' | 'devnet' | 'testnet';
  performanceOptimization: boolean;
  privacyLevel: 'basic' | 'medium' | 'high' | 'maximum';
}

export interface SystemStatus {
  overallHealthy: boolean;
  components: {
    encryption: ComponentStatus;
    decryption: ComponentStatus;
    proofGeneration: ComponentStatus;
    proofVerification: ComponentStatus;
    aiSync: ComponentStatus;
    solana: ComponentStatus;
    privacy: ComponentStatus;
  };
  metrics: SystemMetrics;
}

export interface ComponentStatus {
  healthy: boolean;
  message?: string;
}

export interface SystemMetrics {
  uptime: number;
  totalOperations: number;
  encryptionSpeed: number;
  proofGenerationTime: number;
  aiInferenceTime: number;
  cacheEfficiency: number;
}

// Encryption Types
export interface EncryptionResult {
  cipherId: string;
  encryptedData: string;
  iv: string;
  authTag: string;
  dataHash: string;
  encryptionTime: number;
  compressionStats?: CompressionStats;
  metadata: EncryptionMetadata;
}

export interface EncryptionMetadata {
  algorithm: string;
  mode: string;
  keyDerivation: string;
  timestamp: number;
}

export interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  ratio: number;
  algorithm: string;
  compressionTime: number;
}

export interface DecryptionResult {
  decryptedData: string;
  dataHash: string;
  decryptionTime: number;
  integrityVerified: boolean;
  metadata: DecryptionMetadata;
}

export interface DecryptionMetadata {
  algorithm: string;
  keyId: string;
  timestamp: number;
}

// Key Management Types
export interface SessionKey {
  keyId: string;
  keyMaterial: string;
  derivationPath: string;
  rotationIndex: number;
  expiresAt: number;
  usageLimit: number;
  currentUsage: number;
  metadata: KeyMetadata;
}

export interface KeyMetadata {
  created: number;
  algorithm: string;
  strength: number;
  purpose: string;
}

export interface KeyGenerationOptions {
  keyLifetime?: number;
  maxUsageCount?: number;
  strength?: number;
  purpose?: string;
  derivationPath?: string;
}

// Proof System Types
export interface ZKProof {
  proofHash: string;
  circuitId: string;
  publicSignals: any;
  proofData: string;
  timestamp: number;
  generationTime: number;
  compressionRatio?: number;
  trustScore?: number;
}

export interface ProofGenerationOptions {
  batch?: boolean;
  compression?: boolean;
  optimization?: 'speed' | 'size' | 'balanced';
  privacyLevel?: 'minimum' | 'standard' | 'maximum';
}

export interface BatchProofResult {
  batchId: string;
  proofs: ZKProof[];
  aggregatedProof: ZKProof;
  compressionRatio: number;
  generationTime: number;
}

export interface VerificationResult {
  verified: boolean;
  verificationTime: number;
  verifiedAt: number;
  details: VerificationDetails;
  trustScore?: number;
  onChain?: boolean;
  error?: string;
}

export interface VerificationDetails {
  proofStructure: boolean;
  cryptographic: boolean;
  circuitConsistency: boolean;
  timestamp: boolean;
}

export interface BatchVerificationResult {
  batchId: string;
  verified: boolean;
  verifiedProofs: string[];
  failedProofs: string[];
  verificationTime: number;
  successRate: number;
}

export interface VerificationOptions {
  timeout?: number;
  checkOnChain?: boolean;
  strictMode?: boolean;
  trustThreshold?: number;
}

// AI Model Types
export interface ModelUpdate {
  modelId: string;
  weightsHash: string;
  architecture: string;
  parameters: number;
  timestamp: number;
  metadata?: ModelMetadata;
}

export interface ModelMetadata {
  trainingData?: string;
  performance?: ModelPerformance;
  privacyLevel?: string;
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  inferenceTime: number;
}

export interface InferenceRequest {
  modelId: string;
  encryptedInput: string;
  inferenceType: string;
  privacyContext?: PrivacyContext;
  performanceRequirements?: PerformanceRequirements;
}

export interface InferenceResult {
  inferenceId: string;
  encryptedOutput: string;
  outputHash: string;
  processingTime: number;
  confidence?: number;
  privacyMetrics?: PrivacyMetrics;
  proof?: ZKProof;
}

export interface FederatedSession {
  sessionId: string;
  modelId: string;
  participants: any[];
  aggregationMethod: string;
  rounds: number;
  targetAccuracy: number;
  currentRound: number;
  finalModelHash?: string;
}

// Privacy Types
export interface PrivacyContext {
  level: 'maximum' | 'high' | 'medium' | 'basic';
  techniques: string[];
  guarantees: PrivacyGuarantees;
  compliance: string[];
}

export interface PrivacyGuarantees {
  zeroKnowledge: boolean;
  differentialPrivacy: boolean;
  secureMultiParty: boolean;
  homomorphicEncryption: boolean;
}

export interface PrivacyMetrics {
  dataExposure: number;
  computationPrivacy: number;
  outputLinkability: number;
  overallScore: number;
  recommendations: string[];
}

export interface DifferentialPrivacyConfig {
  epsilon: number;
  delta: number;
  sensitivity: number;
  mechanism: 'laplace' | 'gaussian' | 'exponential';
}

// Solana Types
export interface SolanaTransaction {
  signature: string;
  slot: number;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations?: number;
  metadata?: TransactionMetadata;
}

export interface TransactionMetadata {
  proofHash?: string;
  circuitId?: string;
  network?: string;
  type?: string;
}

export interface SolanaProofVerification {
  onChain: boolean;
  verifiedBlock: number;
  verificationTime: number;
  txHash?: string;
}

export interface SolanaNetworkStatus {
  networkName: string;
  slot: number;
  absoluteSlot: number;
  blockHeight: number;
  version: string;
  health: 'healthy' | 'degraded' | 'unhealthy';
}

export interface TransactionOptions {
  priorityFee?: number;
  computeUnits?: number;
  skipPreflight?: boolean;
  maxRetries?: number;
}

export interface SignedTransaction {
  signature: string;
  rawTransaction: string;
  publicKey: string;
  timestamp: number;
}

export interface TransactionResult {
  signature: string;
  slot: number;
  status: 'success' | 'failed';
  error?: string;
  metadata?: any;
}

// Integration Types
export interface AIZKIntegration {
  inferenceId: string;
  proofHash: string;
  verification: any;
  blockchainTx?: string;
  privacyMetrics: PrivacyMetrics;
  performance: IntegrationPerformance;
}

export interface IntegrationPerformance {
  totalTime: number;
  inferenceTime: number;
  proofTime: number;
  verificationTime: number;
  efficiency: number;
}

export interface BridgeConfig {
  privacyLevel: 'maximum' | 'high' | 'medium' | 'basic';
  enableBlockchain: boolean;
  proofGeneration: 'immediate' | 'batch' | 'on_demand';
  verificationMode: 'local' | 'on_chain' | 'both';
  performanceOptimization: boolean;
}

// Monitoring Types
export interface MonitorConfig {
  network: 'mainnet' | 'devnet' | 'testnet';
  rpcUrl?: string;
  pollInterval: number;
  alertThreshold: number;
  monitorProofs: boolean;
  monitorTransactions: boolean;
  monitorNetwork: boolean;
  webhookUrl?: string;
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  data?: any;
}

export interface MonitorMetrics {
  uptime: number;
  proofsVerified: number;
  transactionsProcessed: number;
  alertsTriggered: number;
  averageResponseTime: number;
  networkHealth: number;
}

// Runtime Types
export interface RuntimeConfig {
  environment: 'development' | 'staging' | 'production';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  performanceMonitoring: boolean;
  cacheEnabled: boolean;
  security: RuntimeSecurity;
}

export interface RuntimeSecurity {
  keyRotation: boolean;
  sessionTimeout: number;
  maxConcurrentOperations: number;
}

export interface RuntimeMetrics {
  uptime: number;
  memoryUsage: number;
  activeOperations: number;
  totalOperations: number;
  errorRate: number;
  performance: RuntimePerformance;
}

export interface RuntimePerformance {
  encryption: OperationMetrics;
  decryption: OperationMetrics;
  proofGeneration: OperationMetrics;
  proofVerification: OperationMetrics;
}

export interface OperationMetrics {
  count: number;
  averageTime: number;
}

// Registry Types
export interface ComponentInfo {
  name: string;
  type: string;
  version: string;
  status: 'registered' | 'initialized' | 'active' | 'degraded' | 'failed';
  dependencies: string[];
  metadata: any;
}

export interface RegistryConfig {
  autoInitialize: boolean;
  dependencyChecking: boolean;
  healthCheckInterval: number;
  maxRetries: number;
}

// CLI Types
export interface CLIOptions {
  debug?: boolean;
  silent?: boolean;
  output?: string;
  network?: string;
  level?: string;
  compress?: boolean;
}

export interface CommandResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
}

// Utility Types
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
  level: LogLevel;
  colors: boolean;
  timestamps: boolean;
  module: string;
  pulseAnimation: boolean;
}

export interface FormatOptions {
  compact?: boolean;
  includeMetadata?: boolean;
  includeData?: boolean;
  includePublicSignals?: boolean;
  includePrivacy?: boolean;
  indent?: number;
  sortKeys?: boolean;
}

// Error Types
export interface SDKError extends Error {
  code: string;
  details?: any;
  timestamp: number;
}

export interface ValidationError extends SDKError {
  field: string;
  value: any;
  constraint: string;
}

export interface NetworkError extends SDKError {
  url: string;
  statusCode?: number;
  response?: any;
}

export interface CryptoError extends SDKError {
  operation: string;
  algorithm: string;
}

// Event Types
export interface SDKEvent {
  type: string;
  timestamp: number;
  data: any;
  module: string;
}

export interface EncryptionEvent extends SDKEvent {
  type: 'encryption_start' | 'encryption_complete' | 'encryption_error';
  data: {
    cipherId?: string;
    dataSize?: number;
    encryptionTime?: number;
    error?: string;
  };
}

export interface ProofEvent extends SDKEvent {
  type: 'proof_generation_start' | 'proof_generation_complete' | 'proof_verification_complete';
  data: {
    proofHash?: string;
    circuitId?: string;
    generationTime?: number;
    verificationTime?: number;
    verified?: boolean;
    error?: string;
  };
}

export interface AIEvent extends SDKEvent {
  type: 'inference_start' | 'inference_complete' | 'model_sync_complete';
  data: {
    inferenceId?: string;
    modelId?: string;
    processingTime?: number;
    confidence?: number;
    syncId?: string;
    error?: string;
  };
}

// Generic Response Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface HealthCheckResponse {
  healthy: boolean;
  timestamp: number;
  version: string;
  components: {
    [key: string]: ComponentHealth;
  };
}

export interface ComponentHealth {
  healthy: boolean;
  status: string;
  message?: string;
  lastCheck: number;
}

// Configuration Types
export interface DatabaseConfig {
  type: 'memory' | 'redis' | 'postgres';
  url?: string;
  timeout?: number;
  maxConnections?: number;
}

export interface CacheConfig {
  type: 'memory' | 'redis';
  ttl: number;
  maxSize?: number;
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
}

export interface SecurityConfig {
  ssl: boolean;
  certificates?: {
    key: string;
    cert: string;
    ca?: string;
  };
  rateLimiting: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
}

// Export all types
export type {
  // Re-export for backward compatibility
  LogLevel as LoggerLevel,
  SystemStatus as SDKStatus,
  ZKProof as ZeroKnowledgeProof,
  AIZKIntegration as AIZKIntegrationResult
};