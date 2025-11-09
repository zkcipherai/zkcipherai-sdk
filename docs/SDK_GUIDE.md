# 🛠 zkCipherAI SDK GUIDE

**Comprehensive Guide to Building Private AI Applications**  
*From Basic Setup to Advanced Implementation*

[![Basic Usage](https://img.shields.io/badge/BASIC_USAGE-14F195?style=for-the-badge&logo=play&logoColor=white)](#-basic-usage)
[![Advanced Features](https://img.shields.io/badge/ADVANCED-9013FE?style=for-the-badge&logo=rocket&logoColor=white)](#-advanced-features)
[![Best Practices](https://img.shields.io/badge/BEST_PRACTICES-50E3C2?style=for-the-badge&logo=star&logoColor=black)](#-best-practices)

## 🎯 Getting Started

### Prerequisites

Before using zkCipherAI SDK, ensure you have:

- **Node.js 18+** installed
- **TypeScript 5.0+** for type safety
- **Solana CLI** (optional, for advanced features)
- Basic understanding of **cryptography concepts**

### Environment Setup

```bash
# Create new project directory
mkdir my-private-ai-app
cd my-private-ai-app

# Initialize Node.js project
npm init -y

# Install zkCipherAI SDK
npm install zkcipherai-sdk

# Install TypeScript and development dependencies
npm install -D typescript @types/node ts-node

# Initialize TypeScript configuration
npx tsc --init
```

## 🔧 Core Concepts

### 1. Encryption Model

zkCipherAI uses a hybrid encryption approach:

```typescript
// Hybrid encryption flow
Raw Data → AES-256-GCM Encryption → Encrypted Tensor → ZK-Friendly Format
```

### 2. Zero-Knowledge Proofs

The SDK generates proofs that verify:
- ✅ Computation was performed correctly
- ✅ Input data matches encrypted input
- ✅ Model weights haven't been tampered with
- ✅ Output is mathematically correct

### 3. Solana Integration

Proofs are verified on Solana for:
- ⛓ Immutable verification records
- 🔍 Public auditability
- ⚡ Fast confirmation times

## 🚀 Basic Usage

### Initialization

```typescript
import { zkCipherClient } from "zkcipherai-sdk";

// Basic initialization
const client = await zkCipherClient.create({
  network: "solana-devnet", // or "solana-mainnet"
  encryptionKey: "your-secure-key-here", // Keep this secure!
  solanaRpcUrl: "https://api.devnet.solana.com" // Optional custom RPC
});

// Advanced initialization with custom configuration
const advancedClient = await zkCipherClient.create({
  network: "solana-mainnet",
  encryption: {
    algorithm: "aes-256-gcm",
    keyRotation: "auto", // Automatically rotate keys
    securityLevel: "enterprise"
  },
  proof: {
    system: "plonk",
    aggregation: true, // Aggregate multiple proofs
    securityBits: 128
  },
  solana: {
    commitment: "confirmed",
    priorityFee: "medium",
    maxRetries: 3
  }
});
```

### Data Encryption

```typescript
// Encrypt different types of data
const sensitiveData = {
  financialRecords: [12000, 45000, 78000],
  userBehavior: [0.23, 0.67, 0.89, 0.45],
  biometricData: new Float32Array([...])
};

// Encrypt the data
const encryptedData = await client.encryptData(sensitiveData);

console.log(`🔒 Encrypted ${encryptedData.data.length} elements`);
console.log(`📦 Data hash: ${encryptedData.hash}`);
console.log(`🆔 Session ID: ${encryptedData.sessionId}`);
```

### Encrypted AI Inference

```typescript
// Define your AI model configuration
const modelConfig = {
  modelId: "confidential-classifier-v1",
  inputShape: [1, 128], // Input tensor shape
  outputClasses: 5,      // Number of output classes
  modelType: "neural-network",
  framework: "tensorflow-js"
};

// Run inference on encrypted data
const inferenceResult = await client.runEncryptedInference(
  encryptedData,
  modelConfig
);

console.log(`🧠 Inference completed`);
console.log(`📊 Confidence: ${inferenceResult.confidence}`);
console.log(`🎯 Prediction: ${inferenceResult.prediction}`);
```

### Proof Generation and Verification

```typescript
// Generate zero-knowledge proof
const zkProof = await client.generateProof(inferenceResult);

console.log(`📜 Proof generated: ${zkProof.proofHash}`);
console.log(`⏱️ Proof generation time: ${zkProof.generationTime}ms`);

// Verify proof locally first
const localVerification = await client.verifyProofLocally(zkProof);
if (!localVerification.isValid) {
  throw new Error("Local proof verification failed!");
}

// Verify on Solana blockchain
const onChainVerification = await client.verifyOnChain(zkProof);

console.log(`✅ On-chain verification successful!`);
console.log(`⛓ Transaction: ${onChainVerification.txHash}`);
console.log(`📦 Block: ${onChainVerification.blockNumber}`);
```

## 🎪 Advanced Features

### Batch Processing

```typescript
// Process multiple encrypted inputs efficiently
const batchInputs = [
  await client.encryptData(dataset1),
  await client.encryptData(dataset2),
  await client.encryptData(dataset3)
];

const batchConfig = {
  modelId: "batch-processor-v1",
  batchSize: 3,
  proofAggregation: true, // Combine proofs for efficiency
  parallelProcessing: true
};

const batchResults = await client.processBatch(batchInputs, batchConfig);

console.log(`📦 Processed ${batchResults.results.length} batches`);
console.log(`⚡ Aggregated proof: ${batchResults.aggregatedProof.proofHash}`);
```

### Custom Model Integration

```typescript
import { PrivacyBridge, ModelSync } from "zkcipherai-sdk/ai";

// Integrate custom AI models
const privacyBridge = new PrivacyBridge();
const modelSync = new ModelSync();

// Load custom model
await modelSync.loadCustomModel({
  modelPath: "./models/custom-classifier.json",
  weights: encryptedWeights,
  inputSpec: {
    shape: [1, 256],
    dtype: "float32"
  },
  outputSpec: {
    classes: 10,
    activation: "softmax"
  }
});

// Create custom inference pipeline
const customResult = await privacyBridge.processCustom(
  encryptedData,
  "custom-classifier",
  {
    preprocessing: "normalize",
    postprocessing: "threshold-0.8"
  }
);
```

### Real-time Monitoring

```typescript
// Monitor computation metrics
const metrics = await client.getComputationMetrics({
  timeRange: "24h",
  includeProofStats: true,
  performanceMetrics: true,
  errorRates: true
});

console.log(`📊 Success Rate: ${metrics.successRate}%`);
console.log(`⚡ Average Proof Time: ${metrics.avgProofTime}ms`);
console.log(`💰 Average Cost: ${metrics.avgCost} SOL`);

// Set up real-time alerts
client.onComputationComplete((result) => {
  console.log(`🎯 Computation ${result.computationId} completed`);
  if (result.confidence < 0.7) {
    console.warn(`⚠️ Low confidence: ${result.confidence}`);
  }
});

client.onProofGenerated((proof) => {
  console.log(`📜 Proof generated: ${proof.proofHash}`);
});
```

### Key Management

```typescript
import { KeyVault } from "zkcipherai-sdk/cipher";

const keyVault = new KeyVault();

// Generate and manage encryption keys
const masterKey = await keyVault.generateMasterKey();
const sessionKeys = await keyVault.generateSessionKeys(5); // Generate 5 session keys

// Secure key storage
await keyVault.initializeSecureStorage({
  encryption: "aes-256-gcm",
  backupEnabled: true,
  autoRotation: true
});

// Key rotation schedule
await keyVault.setupKeyRotation({
  rotationInterval: 7 * 24 * 60 * 60 * 1000, // Weekly rotation
  retainOldKeys: 3, // Keep 3 previous versions
  notifyOnRotation: true
});
```

## 🏗️ Integration Patterns

### Web Application Integration

```typescript
// Frontend encryption + Backend processing pattern
class PrivateAIService {
  private client: zkCipherClient;
  
  async initialize() {
    this.client = await zkCipherClient.create({
      network: "solana-mainnet"
    });
  }
  
  async processUserData(userData: any) {
    try {
      // Client-side encryption
      const encryptedData = await this.client.encryptData(userData);
      
      // Send to backend for processing
      const inferenceResult = await this.sendToBackend(encryptedData);
      
      // Generate and verify proof
      const proof = await this.client.generateProof(inferenceResult);
      await this.client.verifyOnChain(proof);
      
      return inferenceResult;
    } catch (error) {
      console.error("Private AI processing failed:", error);
      throw error;
    }
  }
  
  private async sendToBackend(encryptedData: EncryptedData) {
    // Your backend API call here
    const response = await fetch('/api/private-inference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encryptedData })
    });
    
    return await response.json();
  }
}
```

### Microservices Architecture

```typescript
// Distributed private AI processing
class DistributedPrivateAI {
  private clients: Map<string, zkCipherClient> = new Map();
  
  async addNode(nodeId: string, config: ClientConfig) {
    const client = await zkCipherClient.create(config);
    this.clients.set(nodeId, client);
  }
  
  async distributedInference(data: any, modelId: string) {
    const encryptedData = await this.encryptData(data);
    
    // Distribute to multiple nodes
    const nodePromises = Array.from(this.clients.values()).map(client =>
      client.runEncryptedInference(encryptedData, modelId)
    );
    
    const results = await Promise.all(nodePromises);
    
    // Aggregate results
    return this.aggregateResults(results);
  }
  
  private aggregateResults(results: InferenceResult[]): InferenceResult {
    // Your aggregation logic here
    return results[0]; // Simplified
  }
}
```

## 🔧 Troubleshooting

### Common Issues and Solutions

```typescript
// 1. Encryption failures
try {
  const encrypted = await client.encryptData(sensitiveData);
} catch (error) {
  if (error.message.includes('Key not found')) {
    console.error('🔑 Encryption key missing. Check your key configuration.');
  } else if (error.message.includes('Data too large')) {
    console.error('📦 Data size exceeds limits. Consider chunking your data.');
  }
}

// 2. Proof generation timeout
const proof = await client.generateProof(result, {
  timeout: 30000, // 30 second timeout
  retryAttempts: 3
});

// 3. Solana transaction failures
try {
  await client.verifyOnChain(proof);
} catch (error) {
  if (error.message.includes('Insufficient funds')) {
    console.error('💰 Insufficient SOL for transaction fees.');
  } else if (error.message.includes('Blockhash not found')) {
    console.error('⛓ Network connectivity issue. Retrying...');
    // Implement retry logic
  }
}
```

### Debugging Tips

```typescript
// Enable debug logging
const debugClient = await zkCipherClient.create({
  network: "solana-devnet",
  debug: true, // Enable debug mode
  logLevel: "verbose" // Detailed logging
});

// Check system health
const health = await client.getSystemHealth();
console.log('System Health:', health);

// Monitor performance
const performance = await client.getPerformanceMetrics();
console.log('Performance Metrics:', performance);
```

## 🛡️ Security Best Practices

### Key Management

```typescript
// Never hardcode keys in source code
const client = await zkCipherClient.create({
  network: process.env.SOLANA_NETWORK,
  encryptionKey: process.env.ENCRYPTION_KEY, // From environment variables
  solanaRpcUrl: process.env.SOLANA_RPC_URL
});

// Use secure key storage
import { SecureKeyStore } from "zkcipherai-sdk/cipher";
const keyStore = new SecureKeyStore();
await keyStore.initialize();
```

### Data Handling

```typescript
// Always validate input data
function validateAndProcess(data: any) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data format');
  }
  
  // Sanitize sensitive fields
  const sanitizedData = sanitizeData(data);
  
  return client.encryptData(sanitizedData);
}

// Proper error handling
try {
  const result = await client.runEncryptedInference(encryptedData, modelConfig);
} catch (error) {
  console.error('Inference failed:', error);
  // Don't expose internal errors to users
  throw new Error('Processing failed. Please try again.');
}
```

## 📚 Additional Resources

### Example Projects

Check out our example projects in the `/examples` directory:

- `basic-encryption` - Simple encryption and inference
- `batch-processing` - Efficient batch operations
- `custom-models` - Integrating custom AI models
- `web-integration` - Full-stack application example

### API Reference

For detailed API documentation, see:
- [API Reference](./API_REFERENCE.md)
- [Type Definitions](../src/utils/types.ts)

### Support Channels

- **GitHub Issues**: Bug reports and feature requests
- **Twitter**: Real-time updates
- **Email Support**: Enterprise support and consulting

---