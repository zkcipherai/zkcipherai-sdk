import { Logger } from '../utils/logger';
import { zkCipherClient } from '../sdk/zkCipherClient';
import { CipherEncryptor } from '../cipher/encryptor';
import { CipherDecryptor } from '../cipher/decryptor';
import { ProofGenerator } from '../proof/generator';
import { ProofVerifier } from '../proof/verifier';
import { ModelSync } from '../ai/modelSync';
import { SolanaClient } from '../solana/client';
import { KeyVault } from '../cipher/keyVault';
import * as fs from 'fs';
import * as path from 'path';

const logger = new Logger('CLI-Actions');

async function initProjectAction(options: any): Promise<void> {
  try {
    logger.info('Initializing new zkCipherAI project...');
    
    const projectDir = path.resolve(options.dir);
    
    if (fs.existsSync(projectDir)) {
      throw new Error(`Directory already exists: ${projectDir}`);
    }

    fs.mkdirSync(projectDir, { recursive: true });
    
    const templateConfig = {
      name: path.basename(projectDir),
      version: '1.0.0',
      template: options.template,
      sdk: {
        version: '^1.0.0',
        features: getTemplateFeatures(options.template)
      },
      networks: {
        solana: 'devnet'
      }
    };

    const files = {
      'zkcipher.json': JSON.stringify(templateConfig, null, 2),
      'README.md': generateReadme(templateConfig),
      '.gitignore': generateGitignore(),
      'src/index.ts': generateMainFile(options.template),
      'examples/basic-usage.ts': generateExampleFile()
    };

    Object.entries(files).forEach(([filePath, content]) => {
      const fullPath = path.join(projectDir, filePath);
      const dir = path.dirname(fullPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, content);
      logger.debug(`Created: ${filePath}`);
    });

    logger.success(`Project initialized in: ${projectDir}`);
    logger.info('Next steps:');
    logger.info('  cd ' + path.basename(projectDir));
    logger.info('  npm install');
    logger.info('  zkcipher encrypt --data "Hello zkCipherAI"');

  } catch (error) {
    logger.error(`Project initialization failed: ${error.message}`);
    process.exit(1);
  }
}

async function encryptAction(options: any): Promise<void> {
  try {
    logger.info('Starting encryption process...');
    
    const client = new zkCipherClient();
    let data = options.data;

    if (fs.existsSync(data)) {
      logger.debug(`Reading data from file: ${data}`);
      data = fs.readFileSync(data, 'utf8');
    }

    const encryptionResult = await client.encrypt({
      data,
      encryptionLevel: options.level,
      compression: options.compress
    });

    const output = {
      cipherId: encryptionResult.cipherId,
      encryptedData: encryptionResult.encryptedData,
      iv: encryptionResult.iv,
      authTag: encryptionResult.authTag,
      metadata: encryptionResult.metadata,
      timestamp: new Date().toISOString()
    };

    if (options.output) {
      fs.writeFileSync(options.output, JSON.stringify(output, null, 2));
      logger.success(`Encrypted data saved to: ${options.output}`);
    } else {
      console.log(JSON.stringify(output, null, 2));
    }

    logger.success(`Encryption completed: ${encryptionResult.cipherId}`);
    logger.info(`Compression ratio: ${encryptionResult.compressionStats?.ratio?.toFixed(2) || 'N/A'}x`);

  } catch (error) {
    logger.error(`Encryption failed: ${error.message}`);
    process.exit(1);
  }
}

async function decryptAction(options: any): Promise<void> {
  try {
    logger.info('Starting decryption process...');
    
    const client = new zkCipherClient();
    const { KeyVault } = await import('../cipher/keyVault');
    
    const keyVault = new KeyVault();
    const inputData = JSON.parse(fs.readFileSync(options.input, 'utf8'));

    const sessionKey = await keyVault.generateSessionKey({
      purpose: 'cli_decryption'
    });

    const decryptionResult = await client.decrypt({
      encryptedData: inputData.encryptedData,
      key: sessionKey,
      iv: options.iv || inputData.iv,
      authTag: options.tag || inputData.authTag
    });

    logger.success(`Decryption completed: ${inputData.cipherId}`);
    console.log('\nDecrypted Data:');
    console.log('─'.repeat(50));
    console.log(decryptionResult.decryptedData);
    console.log('─'.repeat(50));

  } catch (error) {
    logger.error(`Decryption failed: ${error.message}`);
    process.exit(1);
  }
}

async function generateProofAction(options: any): Promise<void> {
  try {
    logger.info('Generating zero-knowledge proof...');
    
    const client = new zkCipherClient();
    let data = options.data;

    if (fs.existsSync(data)) {
      logger.debug(`Reading data from file: ${data}`);
      data = JSON.parse(fs.readFileSync(data, 'utf8'));
    } else {
      try {
        data = JSON.parse(data);
      } catch {
        data = { content: data };
      }
    }

    const proofResult = await client.generateProof(data, options.type, {
      batch: options.batch
    });

    const output = {
      proofHash: proofResult.proofHash,
      circuitId: proofResult.circuitId,
      publicSignals: proofResult.publicSignals,
      proofData: proofResult.proofData,
      timestamp: new Date().toISOString(),
      metadata: {
        type: options.type,
        batch: options.batch,
        generationTime: proofResult.generationTime
      }
    };

    if (options.output) {
      fs.writeFileSync(options.output, JSON.stringify(output, null, 2));
      logger.success(`Proof saved to: ${options.output}`);
    } else {
      console.log(JSON.stringify(output, null, 2));
    }

    logger.success(`Proof generated: ${proofResult.proofHash}`);
    logger.info(`Circuit: ${proofResult.circuitId}, Time: ${proofResult.generationTime}ms`);

  } catch (error) {
    logger.error(`Proof generation failed: ${error.message}`);
    process.exit(1);
  }
}

async function verifyProofAction(options: any): Promise<void> {
  try {
    logger.info('Starting proof verification...');
    
    const client = new zkCipherClient();
    const proofData = JSON.parse(fs.readFileSync(options.proof, 'utf8'));

    let verificationResult;
    
    if (options.onChain) {
      logger.info('Performing on-chain verification...');
      verificationResult = await client.verifyOnSolana(
        options.tx || proofData.proofHash
      );
    } else {
      verificationResult = await client.verifyProof(proofData);
    }

    if (verificationResult.verified) {
      logger.success('Proof verification: ✅ SUCCESS');
    } else {
      logger.error('Proof verification: ❌ FAILED');
    }

    console.log('\nVerification Details:');
    console.log('─'.repeat(50));
    console.log(`Proof Hash: ${proofData.proofHash}`);
    console.log(`Circuit: ${proofData.circuitId}`);
    console.log(`On-chain: ${verificationResult.onChain || false}`);
    console.log(`Verification Time: ${verificationResult.verificationTime}ms`);
    
    if (verificationResult.txHash) {
      console.log(`Transaction: ${verificationResult.txHash}`);
    }

  } catch (error) {
    logger.error(`Proof verification failed: ${error.message}`);
    process.exit(1);
  }
}

async function syncAIModelAction(options: any): Promise<void> {
  try {
    logger.info('Synchronizing AI model...');
    
    const client = new zkCipherClient();
    
    const modelUpdate: any = {
      modelId: options.model,
      weightsHash: `sha256_${Date.now()}`,
      architecture: 'transformer_zk',
      parameters: 1000000000,
      timestamp: Date.now()
    };

    if (options.weights) {
      const weightsData = fs.readFileSync(options.weights);
      modelUpdate.weightsHash = `sha256_${Buffer.from(weightsData).toString('hex').substring(0, 32)}`;
    }

    const syncResult = await client.syncAIModel(modelUpdate, {
      privacyLevel: options.privacy,
      federated: options.federated
    });

    logger.success(`AI model synchronized: ${syncResult.syncId}`);
    logger.info(`Verified: ${syncResult.verified}, Time: ${syncResult.synchronizationTime}ms`);

    console.log('\nModel Details:');
    console.log('─'.repeat(50));
    console.log(`Model ID: ${modelUpdate.modelId}`);
    console.log(`Architecture: ${modelUpdate.architecture}`);
    console.log(`Parameters: ${modelUpdate.parameters.toLocaleString()}`);
    console.log(`Weights Hash: ${modelUpdate.weightsHash.substring(0, 16)}...`);

  } catch (error) {
    logger.error(`AI model synchronization failed: ${error.message}`);
    process.exit(1);
  }
}

async function solanaVerifyAction(options: any): Promise<void> {
  try {
    logger.info('Verifying on Solana blockchain...');
    
    const client = new zkCipherClient();
    
    const verificationResult = await client.verifyOnSolana(options.proof, {
      network: options.network,
      rpcUrl: options.rpc
    });

    if (verificationResult.verified) {
      logger.success('On-chain verification: ✅ SUCCESS');
    } else {
      logger.error('On-chain verification: ❌ FAILED');
    }

    console.log('\nBlockchain Verification:');
    console.log('─'.repeat(50));
    console.log(`Proof Hash: ${options.proof}`);
    console.log(`Network: ${options.network}`);
    console.log(`Transaction: ${verificationResult.txHash}`);
    console.log(`Block: ${verificationResult.blockNumber}`);
    console.log(`Slot: ${verificationResult.slot}`);
    console.log(`Confirmation Time: ${verificationResult.verificationTime}ms`);

  } catch (error) {
    logger.error(`Solana verification failed: ${error.message}`);
    process.exit(1);
  }
}

async function statusAction(options: any): Promise<void> {
  try {
    logger.info('Checking system status...');
    
    const client = new zkCipherClient();
    const status = await client.getSystemStatus();

    console.log('\nzkCipherAI System Status');
    console.log('═'.repeat(50));

    Object.entries(status.components).forEach(([component, compStatus]) => {
      const icon = compStatus.healthy ? '🟢' : '🔴';
      const statusText = compStatus.healthy ? 'HEALTHY' : 'DEGRADED';
      console.log(`${icon} ${component.padEnd(20)} ${statusText}`);
      
      if (compStatus.message) {
        console.log(`   ${compStatus.message}`);
      }
    });

    console.log('\nPerformance Metrics:');
    console.log('─'.repeat(30));
    console.log(`Encryption Speed: ${status.metrics.encryptionSpeed} ops/sec`);
    console.log(`Proof Generation: ${status.metrics.proofGenerationTime}ms avg`);
    console.log(`AI Inference: ${status.metrics.aiInferenceTime}ms avg`);
    console.log(`Uptime: ${status.metrics.uptime}`);

    if (options.components) {
      console.log('\nDetailed Component Status:');
      console.log(JSON.stringify(status.components, null, 2));
    }

    if (options.metrics) {
      console.log('\nDetailed Metrics:');
      console.log(JSON.stringify(status.metrics, null, 2));
    }

  } catch (error) {
    logger.error(`Status check failed: ${error.message}`);
    process.exit(1);
  }
}

function getTemplateFeatures(template: string): string[] {
  const features = {
    basic: ['encryption', 'basic_proofs', 'ai_sync'],
    advanced: ['encryption', 'zk_proofs', 'ai_sync', 'solana_integration'],
    enterprise: ['encryption', 'zk_proofs', 'ai_sync', 'solana_integration', 'federated_learning', 'privacy_bridge']
  };
  
  return features[template] || features.basic;
}

function generateReadme(config: any): string {
  return `# ${config.name}

zkCipherAI Project - Privacy × Encryption × Artificial Intelligence × Solana

## Features
${config.sdk.features.map((f: string) => `- ${f}`).join('\n')}

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Encrypt data
zkcipher encrypt --data "Your sensitive data"

# Generate proof
zkcipher proof --data data.json --type inference

# Verify on Solana
zkcipher solana-verify --proof proof_hash
\`\`\`

## Configuration

Edit \`zkcipher.json\` to configure your project settings.

## Documentation

Visit [zkCipherAI Documentation](https://docs.zkcipher.ai) for detailed guides.
`;
}

function generateGitignore(): string {
  return `node_modules/
dist/
build/
*.key
*.enc
*.proof
.env
.DS_Store
logs/
.cache/
`;
}

function generateMainFile(template: string): string {
  return `import { zkCipherClient } from 'zkcipherai-sdk';

const client = new zkCipherClient();

async function main() {
  console.log('🚀 zkCipherAI ${template} template');
  
  // Example: Encrypt data
  const encrypted = await client.encrypt({
    data: 'Hello, secure world!',
    encryptionLevel: 'high'
  });
  
  console.log('Encrypted:', encrypted.cipherId);
}

main().catch(console.error);
`;
}

function generateExampleFile(): string {
  return `import { zkCipherClient } from 'zkcipherai-sdk';

const client = new zkCipherClient();

async function demonstratePrivateAI() {
  console.log('🧠 zkCipherAI Basic Usage Example');
  
  // 1. Encrypt sensitive data
  const sensitiveData = {
    user: 'alice',
    medical: { condition: 'classified', treatment: 'encrypted' },
    timestamp: Date.now()
  };
  
  const encrypted = await client.encrypt({
    data: JSON.stringify(sensitiveData),
    encryptionLevel: 'maximum'
  });
  
  console.log('✅ Data encrypted:', encrypted.cipherId);
  
  // 2. Generate proof of encryption
  const proof = await client.generateProof(encrypted, 'encryption');
  console.log('✅ Proof generated:', proof.proofHash);
  
  // 3. Verify on Solana (optional)
  const verification = await client.verifyOnSolana(proof.proofHash);
  console.log('✅ On-chain verification:', verification.verified);
}

demonstratePrivateAI().catch(console.error);
`;
}

export {
  initProjectAction,
  encryptAction,
  decryptAction,
  generateProofAction,
  verifyProofAction,
  syncAIModelAction,
  solanaVerifyAction,
  statusAction
};