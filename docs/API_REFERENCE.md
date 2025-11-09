# 📚 zkCipherAI SDK API REFERENCE

**Complete TypeScript API Documentation**  
*Enterprise-Grade Cryptographic AI Development*

[![Core API](https://img.shields.io/badge/CORE_API-14F195?style=for-the-badge&logo=code&logoColor=white)](#-core-api)
[![Modules](https://img.shields.io/badge/MODULES-9013FE?style=for-the-badge&logo=package&logoColor=white)](#-modules)
[![Types](https://img.shields.io/badge/TYPES-50E3C2?style=for-the-badge&logo=typescript&logoColor=black)](#-type-definitions)

## 🎯 Overview

This API reference provides complete documentation for all classes, methods, and types in the zkCipherAI SDK. All APIs are fully typed with TypeScript and follow enterprise-grade development practices.

## 🏗 Core API

### zkCipherClient

The main client class for interacting with the zkCipherAI SDK.

```typescript
class zkCipherClient {
  // Static Methods
  static create(config: ClientConfig): Promise<zkCipherClient>
  static createWithKeypair(keypair: Keypair, config?: ClientConfig): Promise<zkCipherClient>
  
  // Core Methods
  encryptData(data: TensorData, options?: EncryptionOptions): Promise<EncryptedData>
  decryptData(encryptedData: EncryptedData, options?: DecryptionOptions): Promise<TensorData>
  runEncryptedInference(data: EncryptedData, modelConfig: ModelConfig): Promise<InferenceResult>
  generateProof(result: InferenceResult, options?: ProofOptions): Promise<ZKProof>
  verifyProofLocally(proof: ZKProof): Promise<VerificationResult>
  verifyOnChain(proof: ZKProof, options?: VerificationOptions): Promise<OnChainVerification>
  
  // Batch Operations
  processBatch(inputs: EncryptedData[], config: BatchConfig): Promise<BatchResult>
  generateBatchProofs(results: InferenceResult[]): Promise<ZKProof[]>
  verifyBatchProofs(proofs: ZKProof[]): Promise<BatchVerificationResult>
  
  // Management Methods
  getComputationMetrics(options: MetricsOptions): Promise<ComputationMetrics>
  rotateEncryptionKeys(): Promise<void>
  createSessionManager(): Promise<SessionManager>
  getSystemHealth(): Promise<SystemHealth>
  getPerformanceMetrics(): Promise<PerformanceMetrics>
  
  // Event Handlers
  onComputationComplete(callback: (result: InferenceResult) => void): void
  onProofGenerated(callback: (proof: ZKProof) => void): void
  onError(callback: (error: SDKError) => void): void
}
```

#### Methods

##### `static create(config: ClientConfig)`

Creates a new zkCipherClient instance.

**Parameters:**
- `config` (ClientConfig) - Configuration object for the client

**Returns:** `Promise<zkCipherClient>`

**Example:**
```typescript
const client = await zkCipherClient.create({
  network: "solana-mainnet",
  encryptionKey: "your-secure-key",
  solanaRpcUrl: "https://api.mainnet.solana.com"
});
```

##### `encryptData(data: TensorData, options?)`

Encrypts tensor data for private computation.

**Parameters:**
- `data` (TensorData) - Input data to encrypt
- `options` (EncryptionOptions) - Optional encryption settings

**Returns:** `Promise<EncryptedData>`

**Example:**
```typescript
const encrypted = await client.encryptData({
  tensor: new Float32Array([1, 2, 3, 4]),
  shape: [1, 4],
  dtype: "float32"
});
```

##### `runEncryptedInference(data: EncryptedData, modelConfig)`

Runs AI inference on encrypted data.

**Parameters:**
- `data` (EncryptedData) - Encrypted input data
- `modelConfig` (ModelConfig) - AI model configuration

**Returns:** `Promise<InferenceResult>`

**Example:**
```typescript
const result = await client.runEncryptedInference(encryptedData, {
  modelId: "classifier-v1",
  inputShape: [1, 128],
  outputClasses: 10
});
```

##### `generateProof(result: InferenceResult, options?)`

Generates a zero-knowledge proof for computation.

**Parameters:**
- `result` (InferenceResult) - Inference result to prove
- `options` (ProofOptions) - Optional proof generation settings

**Returns:** `Promise<ZKProof>`

**Example:**
```typescript
const proof = await client.generateProof(inferenceResult, {
  complexity: "high",
  aggregation: true
});
```

##### `verifyOnChain(proof: ZKProof, options?)`

Verifies a proof on the Solana blockchain.

**Parameters:**
- `proof` (ZKProof) - Proof to verify
- `options` (VerificationOptions) - Optional verification settings

**Returns:** `Promise<OnChainVerification>`

**Example:**
```typescript
const verification = await client.verifyOnChain(proof, {
  priority: "high",
  commitment: "confirmed"
});
```

## 🔐 Cipher Module

### Encryptor

Handles tensor encryption and decryption operations.

```typescript
class Encryptor {
  constructor(config?: EncryptorConfig)
  
  // Core Methods
  encryptTensor(tensor: TensorData, key: CryptoKey): Promise<EncryptedTensor>
  decryptTensor(encrypted: EncryptedTensor, key: CryptoKey): Promise<TensorData>
  encryptBatch(tensors: TensorData[], key: CryptoKey): Promise<EncryptedTensor[]>
  
  // Utility Methods
  generateIV(): Promise<Uint8Array>
  computeHash(data: ArrayBuffer): Promise<string>
  validateEncryption(encrypted: EncryptedTensor): boolean
}
```

### KeyVault

Manages cryptographic key generation and storage.

```typescript
class KeyVault {
  constructor(storage?: SecureStorage)
  
  // Key Management
  generateMasterKey(): Promise<CryptoKey>
  deriveSessionKey(masterKey: CryptoKey, context?: string): Promise<CryptoKey>
  generateSessionKeys(count: number): Promise<CryptoKey[]>
  rotateKeys(): Promise<KeyRotationResult>
  
  // Storage Operations
  storeKey(key: CryptoKey, id: string): Promise<void>
  retrieveKey(id: string): Promise<CryptoKey>
  deleteKey(id: string): Promise<boolean>
  
  // Security Operations
  initializeSecureStorage(config: StorageConfig): Promise<void>
  setupKeyRotation(config: RotationConfig): Promise<void>
  backupKeys(backupLocation: string): Promise<BackupResult>
}
```

## 🧠 AI Module

### PrivacyBridge

Bridges AI models with encrypted computation.

```typescript
class PrivacyBridge {
  constructor(runtime?: AIRuntime)
  
  // Core Methods
  processEncrypted(data: EncryptedData, modelConfig: ModelConfig): Promise<InferenceResult>
  processBatchEncrypted(data: EncryptedData[], modelConfig: ModelConfig): Promise<InferenceResult[]>
  
  // Model Management
  loadModel(config: ModelConfig): Promise<ModelHandle>
  unloadModel(modelId: string): Promise<void>
  getModelStatus(modelId: string): Promise<ModelStatus>
  
  // Computation Tracking
  generateComputationTrace(result: InferenceResult): Promise<ComputationTrace>
  validateComputation(trace: ComputationTrace): Promise<ValidationResult>
}
```

### ModelSync

Manages AI model synchronization and versioning.

```typescript
class ModelSync {
  constructor(repository?: ModelRepository)
  
  // Model Operations
  loadEncryptedModel(modelPath: string): Promise<EncryptedModel>
  loadCustomModel(config: CustomModelConfig): Promise<ModelHandle>
  syncModelWeights(weights: EncryptedWeights): Promise<SyncResult>
  
  // Version Management
  getModelVersion(modelId: string): Promise<ModelVersion>
  updateModel(modelId: string, version: string): Promise<UpdateResult>
  rollbackModel(modelId: string, version: string): Promise<RollbackResult>
  
  // Validation
  validateModelIntegrity(model: EncryptedModel): Promise<IntegrityResult>
  verifyModelSignature(model: EncryptedModel): Promise<VerificationResult>
}
```

## 📜 Proof Module

### ProofGenerator

Generates zero-knowledge proofs for computations.

```typescript
class ProofGenerator {
  constructor(circuit?: ZKCircuit)
  
  // Proof Generation
  createZKProof(computation: ComputationTrace): Promise<ZKProof>
  createBatchProofs(computations: ComputationTrace[]): Promise<ZKProof[]>
  createAggregatedProof(proofs: ZKProof[]): Promise<AggregatedProof>
  
  // Circuit Management
  loadCircuit(circuitData: CircuitData): Promise<void>
  compileCircuit(source: CircuitSource): Promise<CompilationResult>
  optimizeCircuit(optimizations: OptimizationConfig): Promise<OptimizationResult>
  
  // Performance
  benchmarkProofGeneration(config: BenchmarkConfig): Promise<BenchmarkResult>
  estimateProofComplexity(trace: ComputationTrace): Promise<ComplexityEstimate>
}
```

### ProofVerifier

Verifies zero-knowledge proofs.

```typescript
class ProofVerifier {
  constructor(verificationKey?: VerificationKey)
  
  // Verification Methods
  verifyProof(proof: ZKProof): Promise<VerificationResult>
  verifyBatchProofs(proofs: ZKProof[]): Promise<BatchVerificationResult>
  verifyAggregatedProof(proof: AggregatedProof): Promise<AggregatedVerification>
  
  // Key Management
  loadVerificationKey(key: VerificationKey): Promise<void>
  generateVerificationKey(circuit: ZKCircuit): Promise<VerificationKey>
  
  // Security
  validateProofIntegrity(proof: ZKProof): Promise<IntegrityResult>
  checkProofFreshness(proof: ZKProof): Promise<FreshnessResult>
}
```

## ⛓ Solana Module

### SolanaClient

Handles Solana blockchain interactions.

```typescript
class SolanaClient {
  constructor(config: SolanaConfig)
  
  // Core Methods
  verifyProof(proof: ZKProof): Promise<TransactionResult>
  verifyBatchProofs(proofs: ZKProof[]): Promise<TransactionResult[]>
  getVerificationStatus(txSignature: string): Promise<VerificationStatus>
  
  // Transaction Management
  sendTransaction(transaction: Transaction): Promise<TransactionResult>
  waitForConfirmation(txSignature: string, timeout?: number): Promise<ConfirmationResult>
  getTransactionHistory(address: string, options?: HistoryOptions): Promise<Transaction[]>
  
  // Account Management
  getAccountInfo(address: string): Promise<AccountInfo>
  getBalance(address: string): Promise<number>
  requestAirdrop(address: string, amount: number): Promise<AirdropResult>
}
```

### TransactionManager

Manages Solana transaction lifecycle.

```typescript
class TransactionManager {
  constructor(connection: Connection, wallet: Wallet)
  
  // Transaction Operations
  createProofTransaction(proof: ZKProof): Promise<Transaction>
  createBatchTransaction(proofs: ZKProof[]): Promise<Transaction>
  signTransaction(transaction: Transaction): Promise<Transaction>
  
  // Fee Management
  estimateTransactionFee(transaction: Transaction): Promise<FeeEstimate>
  setPriorityFee(transaction: Transaction, priority: PriorityLevel): Promise<Transaction>
  
  // Monitoring
  monitorTransaction(txSignature: string, callback: (status: TransactionStatus) => void): Promise<void>
  getTransactionStats(timeRange: TimeRange): Promise<TransactionStats>
}
```

## 🛠 Utility Modules

### SessionManager

Manages encrypted computation sessions.

```typescript
class SessionManager {
  constructor(client: zkCipherClient)
  
  // Session Management
  createSession(config: SessionConfig): Promise<Session>
  getSession(sessionId: string): Promise<Session>
  closeSession(sessionId: string): Promise<void>
  listSessions(): Promise<Session[]>
  
  // Resource Management
  allocateResources(sessionId: string, resources: ResourceAllocation): Promise<void>
  releaseResources(sessionId: string): Promise<void>
  getResourceUsage(): Promise<ResourceUsage>
}
```

### SecurityMonitor

Monitors security events and anomalies.

```typescript
class SecurityMonitor {
  constructor(config: MonitorConfig)
  
  // Monitoring
  startMonitoring(): Promise<void>
  stopMonitoring(): Promise<void>
  getSecurityEvents(options: EventOptions): Promise<SecurityEvent[]>
  
  // Alerting
  setAlertThreshold(threshold: AlertThreshold): Promise<void>
  onSecurityAlert(callback: (alert: SecurityAlert) => void): void
  
  // Reporting
  generateSecurityReport(timeRange: TimeRange): Promise<SecurityReport>
  exportSecurityLogs(options: ExportOptions): Promise<ExportResult>
}
```

## 📊 Type Definitions

### Core Types

```typescript
// Configuration Types
interface ClientConfig {
  network: 'solana-mainnet' | 'solana-devnet' | 'solana-testnet'
  encryptionKey?: string
  solanaRpcUrl?: string
  encryption?: EncryptionConfig
  proof?: ProofConfig
  solana?: SolanaConfig
  debug?: boolean
  logLevel?: 'error' | 'warn' | 'info' | 'debug' | 'verbose'
}

interface EncryptionConfig {
  algorithm: 'aes-256-gcm' | 'aes-256-cbc'
  keyRotation: 'auto' | 'manual'
  securityLevel: 'standard' | 'high' | 'enterprise'
}

// Data Types
interface TensorData {
  tensor: Float32Array | Float64Array | number[]
  shape: number[]
  dtype: 'float32' | 'float64' | 'int32'
  metadata?: Record<string, any>
}

interface EncryptedData {
  data: Uint8Array
  hash: string
  sessionId: string
  timestamp: number
  encryptionMetadata: EncryptionMetadata
}

interface InferenceResult {
  prediction: any
  confidence: number
  computationId: string
  modelId: string
  timestamp: number
  metadata: InferenceMetadata
}

// Proof Types
interface ZKProof {
  proofHash: string
  computationId: string
  publicInputs: any[]
  proofData: Uint8Array
  verificationKey: string
  timestamp: number
  generationTime: number
}

interface VerificationResult {
  isValid: boolean
  verificationTime: number
  errors?: string[]
  warnings?: string[]
}

interface OnChainVerification {
  txHash: string
  blockNumber: number
  slot: number
  confirmationStatus: 'confirmed' | 'finalized'
  verificationTime: number
}
```

### Response Types

```typescript
interface ComputationMetrics {
  successRate: number
  avgProofTime: number
  avgInferenceTime: number
  totalComputations: number
  errorRate: number
  performanceByModel: Record<string, ModelPerformance>
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  components: {
    cipher: ComponentHealth
    ai: ComponentHealth
    proof: ComponentHealth
    solana: ComponentHealth
  }
  lastChecked: number
  recommendations?: string[]
}

interface PerformanceMetrics {
  encryptionThroughput: number
  inferenceThroughput: number
  proofGenerationRate: number
  memoryUsage: number
  cpuUsage: number
  networkLatency: number
}
```

### Error Types

```typescript
class SDKError extends Error {
  code: string
  details?: any
  timestamp: number
  component: string
  
  constructor(code: string, message: string, details?: any)
}

// Common Error Codes
const ERROR_CODES = {
  ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED: 'DECRYPTION_FAILED',
  PROOF_GENERATION_TIMEOUT: 'PROOF_GENERATION_TIMEOUT',
  SOLANA_TRANSACTION_FAILED: 'SOLANA_TRANSACTION_FAILED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  NETWORK_ERROR: 'NETWORK_ERROR',
  MODEL_LOAD_FAILED: 'MODEL_LOAD_FAILED',
  INVALID_CONFIG: 'INVALID_CONFIG'
} as const
```

## 🔧 Configuration Reference

### Client Configuration

```typescript
const defaultConfig: ClientConfig = {
  network: 'solana-devnet',
  encryption: {
    algorithm: 'aes-256-gcm',
    keyRotation: 'auto',
    securityLevel: 'high'
  },
  proof: {
    system: 'plonk',
    aggregation: true,
    securityBits: 128
  },
  solana: {
    commitment: 'confirmed',
    priorityFee: 'medium',
    maxRetries: 3,
    timeout: 30000
  },
  debug: false,
  logLevel: 'info'
}
```

### Model Configuration

```typescript
interface ModelConfig {
  modelId: string
  inputShape: number[]
  outputClasses: number
  modelType: 'neural-network' | 'classifier' | 'regressor' | 'custom'
  framework?: 'tensorflow-js' | 'onnx' | 'custom'
  preprocessing?: PreprocessingConfig
  postprocessing?: PostprocessingConfig
  quantization?: QuantizationConfig
}
```

## 🎯 Usage Examples

### Basic Encryption and Inference

```typescript
import { zkCipherClient } from "zkcipherai-sdk";

const client = await zkCipherClient.create({
  network: "solana-devnet"
});

// Encrypt data
const encrypted = await client.encryptData({
  tensor: new Float32Array([1, 2, 3, 4]),
  shape: [1, 4]
});

// Run inference
const result = await client.runEncryptedInference(encrypted, {
  modelId: "classifier-v1",
  inputShape: [1, 4],
  outputClasses: 2
});

// Generate and verify proof
const proof = await client.generateProof(result);
const verification = await client.verifyOnChain(proof);

console.log(`Verified: ${verification.txHash}`);
```

### Advanced Batch Processing

```typescript
// Process multiple inputs
const batchResults = await client.processBatch(
  [encrypted1, encrypted2, encrypted3],
  {
    modelId: "batch-classifier",
    batchSize: 3,
    proofAggregation: true,
    parallelProcessing: true
  }
);

// Monitor performance
const metrics = await client.getComputationMetrics({
  timeRange: "1h",
  includeProofStats: true
});
```

---
