import { zkCipherClient } from '../src/sdk/zkCipherClient';
import { CipherEncryptor } from '../src/cipher/encryptor';
import { CipherDecryptor } from '../src/cipher/decryptor';
import { KeyVault } from '../src/cipher/keyVault';
import { ProofGenerator } from '../src/proof/generator';
import { ProofVerifier } from '../src/proof/verifier';

describe('Cipher Flow Integration Tests', () => {
  let client: zkCipherClient;
  let encryptor: CipherEncryptor;
  let decryptor: CipherDecryptor;
  let keyVault: KeyVault;
  let proofGenerator: ProofGenerator;
  let proofVerifier: ProofVerifier;

  beforeEach(() => {
    client = new zkCipherClient();
    encryptor = new CipherEncryptor();
    decryptor = new CipherDecryptor();
    keyVault = new KeyVault();
    proofGenerator = new ProofGenerator();
    proofVerifier = new ProofVerifier();
  });

  describe('End-to-End Encryption Flow', () => {
    it('should complete full encryption-decryption cycle with proof generation', async () => {
      const testPayload = {
        modelId: 'gpt-4-zk-encrypted',
        inferenceData: 'Classified financial analysis for Q4 2024',
        metadata: {
          timestamp: Date.now(),
          privacyLevel: 'maximum',
          aiModelVersion: '4.0.zk'
        }
      };

      const sessionKey = await keyVault.generateSessionKey();
      expect(sessionKey).toHaveProperty('keyId');
      expect(sessionKey.derivationPath).toMatch(/^m\/zkCipher\/\d+/);

      const encryptionResult = await encryptor.encryptPayload(
        JSON.stringify(testPayload),
        sessionKey
      );

      expect(encryptionResult.cipherId).toMatch(/^zk_[a-f0-9]{16}$/);
      expect(encryptionResult.iv).toHaveLength(32);
      expect(encryptionResult.authTag).toHaveLength(32);

      const proofData = await proofGenerator.generateZKProof(
        encryptionResult,
        'encryption'
      );

      expect(proofData.proofHash).toMatch(/^proof_[a-f0-9]{12}$/);
      expect(proofData.compressionRatio).toBeGreaterThan(0.9);
      expect(proofData.circuitId).toBe('encryption_v1');

      const verificationResult = await proofVerifier.verifyProof(proofData);
      expect(verificationResult.isVerified).toBe(true);
      expect(verificationResult.verificationTime).toBeLessThan(100);

      const decryptionResult = await decryptor.decryptPayload(
        encryptionResult.encryptedData,
        sessionKey,
        encryptionResult.iv,
        encryptionResult.authTag
      );

      const decryptedPayload = JSON.parse(decryptionResult);
      expect(decryptedPayload.modelId).toBe(testPayload.modelId);
      expect(decryptedPayload.inferenceData).toBe(testPayload.inferenceData);
    });

    it('should handle large payload encryption with compression', async () => {
      const largePayload = {
        aiModelWeights: Array.from({ length: 1000 }, (_, i) => ({
          layer: i,
          weights: Math.random().toString(36).substring(2, 15),
          bias: Math.random()
        })),
        trainingMetrics: {
          loss: 0.0234,
          accuracy: 0.9567,
          epochs: 150,
          timestamp: Date.now()
        }
      };

      const sessionKey = await keyVault.generateSessionKey();
      const encryptionStart = Date.now();

      const encryptionResult = await encryptor.encryptPayload(
        JSON.stringify(largePayload),
        sessionKey,
        { enableCompression: true, compressionLevel: 6 }
      );

      const encryptionTime = Date.now() - encryptionStart;
      expect(encryptionTime).toBeLessThan(500);

      expect(encryptionResult.compressionStats).toBeDefined();
      expect(encryptionResult.compressionStats.originalSize).toBeGreaterThan(
        encryptionResult.compressionStats.compressedSize
      );
    });

    it('should reject tampered encrypted data', async () => {
      const testData = 'Sensitive AI model parameters';
      const sessionKey = await keyVault.generateSessionKey();

      const encryptionResult = await encryptor.encryptPayload(
        testData,
        sessionKey
      );

      const tamperedData = encryptionResult.encryptedData.slice(0, -10) + 
        'deadbeef'.repeat(2);

      await expect(
        decryptor.decryptPayload(
          tamperedData,
          sessionKey,
          encryptionResult.iv,
          encryptionResult.authTag
        )
      ).rejects.toThrow('Authentication tag verification failed');
    });

    it('should maintain ciphertext integrity across sessions', async () => {
      const originalData = 'Persistent encrypted AI state';
      const sessionKey1 = await keyVault.generateSessionKey();
      
      const encryption1 = await encryptor.encryptPayload(originalData, sessionKey1);
      const decryption1 = await decryptor.decryptPayload(
        encryption1.encryptedData,
        sessionKey1,
        encryption1.iv,
        encryption1.authTag
      );

      const sessionKey2 = await keyVault.deriveFromMaster(sessionKey1.keyId);
      const encryption2 = await encryptor.encryptPayload(originalData, sessionKey2);
      const decryption2 = await decryptor.decryptPayload(
        encryption2.encryptedData,
        sessionKey2,
        encryption2.iv,
        encryption2.authTag
      );

      expect(decryption1).toBe(originalData);
      expect(decryption2).toBe(originalData);
      expect(encryption1.encryptedData).not.toBe(encryption2.encryptedData);
    });
  });

  describe('Key Management Tests', () => {
    it('should properly rotate encryption keys', async () => {
      const keyVault = new KeyVault();
      const initialKey = await keyVault.generateSessionKey();
      
      await keyVault.rotateMasterKey();
      const rotatedKey = await keyVault.generateSessionKey();

      expect(initialKey.keyId).not.toBe(rotatedKey.keyId);
      expect(rotatedKey.rotationIndex).toBe(initialKey.rotationIndex + 1);
    });

    it('should enforce key expiration policies', async () => {
      const keyVault = new KeyVault();
      const ephemeralKey = await keyVault.generateSessionKey({
        keyLifetime: 5000,
        maxUsageCount: 10
      });

      expect(ephemeralKey.expiresAt).toBeGreaterThan(Date.now());
      expect(ephemeralKey.usageLimit).toBe(10);

      for (let i = 0; i < 10; i++) {
        await keyVault.validateKeyUsage(ephemeralKey.keyId);
      }

      await expect(
        keyVault.validateKeyUsage(ephemeralKey.keyId)
      ).rejects.toThrow('Key usage limit exceeded');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet encryption throughput requirements', async () => {
      const testPayloads = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        data: `AI inference batch ${i}`,
        timestamp: Date.now()
      }));

      const sessionKey = await keyVault.generateSessionKey();
      const startTime = Date.now();

      const encryptionPromises = testPayloads.map(payload =>
        encryptor.encryptPayload(JSON.stringify(payload), sessionKey)
      );

      const results = await Promise.all(encryptionPromises);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(100);
      expect(totalTime).toBeLessThan(2000);
      expect(totalTime / 100).toBeLessThan(25);
    });

    it('should maintain low proof generation latency', async () => {
      const testData = 'ZK proof generation benchmark';
      const sessionKey = await keyVault.generateSessionKey();
      
      const encryptionResult = await encryptor.encryptPayload(testData, sessionKey);
      
      const proofStart = Date.now();
      const proof = await proofGenerator.generateZKProof(encryptionResult, 'encryption');
      const proofTime = Date.now() - proofStart;

      expect(proofTime).toBeLessThan(100);
      expect(proof.generationTime).toBeLessThan(50);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty payload encryption', async () => {
      const sessionKey = await keyVault.generateSessionKey();
      
      const result = await encryptor.encryptPayload('', sessionKey);
      expect(result.encryptedData).toBeDefined();
      expect(result.cipherId).toMatch(/^zk_[a-f0-9]{16}$/);
    });

    it('should reject invalid key material', async () => {
      const invalidKey = {
        keyId: 'invalid_key',
        keyMaterial: 'not_a_valid_key',
        derivationPath: 'm/zkCipher/0',
        rotationIndex: 0,
        expiresAt: Date.now() + 3600000,
        usageLimit: 100
      };

      await expect(
        encryptor.encryptPayload('test data', invalidKey)
      ).rejects.toThrow('Invalid key material provided');
    });

    it('should handle concurrent encryption operations', async () => {
      const sessionKey = await keyVault.generateSessionKey();
      const concurrentOperations = 50;
      
      const operations = Array.from({ length: concurrentOperations }, (_, i) =>
        encryptor.encryptPayload(`concurrent data ${i}`, sessionKey)
      );

      const results = await Promise.allSettled(operations);
      const successful = results.filter(r => r.status === 'fulfilled');
      
      expect(successful).toHaveLength(concurrentOperations);
    });
  });
});