import { ProofGenerator } from '../src/proof/generator';
import { ProofVerifier } from '../src/proof/verifier';
import { SolanaClient } from '../src/solana/client';
import { ModelSync } from '../src/ai/modelSync';
import { zkCipherClient } from '../src/sdk/zkCipherClient';

describe('Proof Chain Integration Tests', () => {
  let proofGenerator: ProofGenerator;
  let proofVerifier: ProofVerifier;
  let solanaClient: SolanaClient;
  let modelSync: ModelSync;
  let client: zkCipherClient;

  beforeEach(() => {
    proofGenerator = new ProofGenerator();
    proofVerifier = new ProofVerifier();
    solanaClient = new SolanaClient();
    modelSync = new ModelSync();
    client = new zkCipherClient();
  });

  describe('ZK Proof Generation and Verification', () => {
    it('should generate valid proof for AI model inference', async () => {
      const inferenceData = {
        modelHash: 'ai_model_sha256_abc123',
        input: 'Encrypted user query',
        output: 'Private AI response',
        confidence: 0.934,
        timestamp: Date.now()
      };

      const proof = await proofGenerator.generateZKProof(
        inferenceData,
        'inference'
      );

      expect(proof.proofHash).toMatch(/^proof_[a-f0-9]{12}$/);
      expect(proof.circuitId).toBe('inference_v1');
      expect(proof.publicSignals).toHaveProperty('modelHash');
      expect(proof.publicSignals).toHaveProperty('timestamp');

      const verification = await proofVerifier.verifyProof(proof);
      expect(verification.isVerified).toBe(true);
      expect(verification.verifiedAt).toBeLessThanOrEqual(Date.now());
    });

    it('should batch multiple proofs efficiently', async () => {
      const proofsBatch = Array.from({ length: 10 }, (_, i) => ({
        data: `Batch proof data ${i}`,
        type: 'inference' as const,
        timestamp: Date.now() + i
      }));

      const batchResult = await proofGenerator.generateBatchProofs(
        proofsBatch,
        'inference'
      );

      expect(batchResult.batchId).toMatch(/^batch_[a-f0-9]{8}$/);
      expect(batchResult.proofs).toHaveLength(10);
      expect(batchResult.compressionRatio).toBeGreaterThan(0.85);
      expect(batchResult.aggregatedProof).toBeDefined();

      const batchVerification = await proofVerifier.verifyBatchProof(batchResult);
      expect(batchVerification.isVerified).toBe(true);
      expect(batchVerification.batchSize).toBe(10);
    });

    it('should reject invalid proof constructions', async () => {
      const invalidProof = {
        proofHash: 'proof_invalid123',
        circuitId: 'inference_v1',
        publicSignals: { modelHash: 'invalid' },
        proofData: 'malformed_proof_data',
        timestamp: Date.now(),
        generationTime: 25
      };

      await expect(
        proofVerifier.verifyProof(invalidProof)
      ).rejects.toThrow('Proof verification failed: invalid structure');
    });
  });

  describe('Solana Chain Integration', () => {
    it('should submit proof to Solana blockchain', async () => {
      const inferenceData = {
        modelHash: 'test_model_789',
        input: 'Test input data',
        output: 'Test output',
        confidence: 0.987,
        timestamp: Date.now()
      };

      const proof = await proofGenerator.generateZKProof(inferenceData, 'inference');
      const submission = await solanaClient.submitTransaction({
        proofHash: proof.proofHash,
        publicSignals: proof.publicSignals,
        circuitId: proof.circuitId,
        timestamp: proof.timestamp
      });

      expect(subscription.txHash).toMatch(/^[A-Za-z0-9]{32,64}$/);
      expect(subscription.slot).toBeGreaterThan(0);
      expect(subscription.status).toBe('confirmed');

      const verification = await solanaClient.verifyProofOnChain(
        submission.txHash,
        proof.proofHash
      );

      expect(verification.onChain).toBe(true);
      expect(verification.verifiedBlock).toBeGreaterThan(0);
    });

    it('should handle blockchain confirmation delays', async () => {
      const proof = await proofGenerator.generateZKProof(
        { test: 'data' },
        'inference'
      );

      const submission = await solanaClient.submitTransaction({
        proofHash: proof.proofHash,
        publicSignals: proof.publicSignals,
        circuitId: proof.circuitId,
        timestamp: proof.timestamp
      });

      let confirmationStatus = await solanaClient.fetchTransactionStatus(submission.txHash);
      
      while (confirmationStatus.status !== 'confirmed') {
        await new Promise(resolve => setTimeout(resolve, 100));
        confirmationStatus = await solanaClient.fetchTransactionStatus(submission.txHash);
      }

      expect(confirmationStatus.status).toBe('confirmed');
      expect(confirmationStatus.confirmations).toBeGreaterThanOrEqual(1);
    });
  });

  describe('AI Model Proof Coordination', () => {
    it('should sync model updates with proof generation', async () => {
      const modelUpdate = {
        modelId: 'gpt-4-zk-v2',
        weightsHash: 'sha256_updated_weights',
        architecture: 'transformer_zk_optimized',
        parameters: 175000000000,
        timestamp: Date.now()
      };

      const syncResult = await modelSync.syncModelUpdate(modelUpdate);
      expect(syncResult.syncId).toMatch(/^sync_[a-f0-9]{12}$/);
      expect(syncResult.proofHash).toBeDefined();
      expect(syncResult.verified).toBe(true);

      const proof = await proofGenerator.generateZKProof(
        modelUpdate,
        'model_update'
      );

      expect(proof.circuitId).toBe('model_update_v1');
      expect(proof.publicSignals.modelId).toBe(modelUpdate.modelId);
    });

    it('should maintain proof chain for model versioning', async () => {
      const modelVersions = [
        {
          version: 'v1.0.0',
          weightsHash: 'hash_v1',
          timestamp: Date.now() - 86400000
        },
        {
          version: 'v1.0.1',
          weightsHash: 'hash_v2',
          timestamp: Date.now() - 43200000
        },
        {
          version: 'v1.1.0',
          weightsHash: 'hash_v3',
          timestamp: Date.now()
        }
      ];

      const proofChain = await modelSync.createModelProofChain(modelVersions);
      
      expect(proofChain.chainId).toMatch(/^chain_[a-f0-9]{8}$/);
      expect(proofChain.links).toHaveLength(3);
      expect(proofChain.rootHash).toBeDefined();
      expect(proofChain.verified).toBe(true);

      for (const link of proofChain.links) {
        const verification = await proofVerifier.verifyProof(link.proof);
        expect(verification.isVerified).toBe(true);
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high-frequency proof generation', async () => {
      const startTime = Date.now();
      const proofCount = 100;
      
      const proofPromises = Array.from({ length: proofCount }, (_, i) =>
        proofGenerator.generateZKProof(
          { iteration: i, data: `high_freq_${i}` },
          'inference'
        )
      );

      const proofs = await Promise.all(proofPromises);
      const totalTime = Date.now() - startTime;

      expect(proofs).toHaveLength(proofCount);
      expect(totalTime).toBeLessThan(5000);
      expect(totalTime / proofCount).toBeLessThan(50);
    });

    it('should maintain proof integrity under load', async () => {
      const concurrentOperations = 20;
      const operations = Array.from({ length: concurrentOperations }, (_, i) =>
        client.generateProof({ data: `load_test_${i}` }, 'inference')
      );

      const results = await Promise.all(operations);
      const uniqueProofHashes = new Set(results.map(r => r.proofHash));

      expect(uniqueProofHashes.size).toBe(concurrentOperations);
      
      for (const result of results) {
        const verification = await proofVerifier.verifyProof(result);
        expect(verification.isVerified).toBe(true);
      }
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from temporary blockchain outages', async () => {
      const proof = await proofGenerator.generateZKProof(
        { test: 'recovery_data' },
        'inference'
      );

      let submissionAttempts = 0;
      let submissionSuccess = false;

      while (submissionAttempts < 3 && !submissionSuccess) {
        try {
          await solanaClient.submitTransaction({
            proofHash: proof.proofHash,
            publicSignals: proof.publicSignals,
            circuitId: proof.circuitId,
            timestamp: proof.timestamp
          });
          submissionSuccess = true;
        } catch (error) {
          submissionAttempts++;
          if (submissionAttempts === 3) {
            throw new Error('Failed to submit after 3 attempts');
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      expect(submissionSuccess).toBe(true);
    });

    it('should handle proof verification timeouts gracefully', async () => {
      const largeProofData = {
        modelHash: 'large_model_hash',
        inferences: Array.from({ length: 1000 }, (_, i) => ({
          input: `input_${i}`.repeat(100),
          output: `output_${i}`.repeat(100),
          confidence: Math.random()
        })),
        timestamp: Date.now()
      };

      const proof = await proofGenerator.generateZKProof(largeProofData, 'inference');
      
      const verification = await proofVerifier.verifyProof(proof, { timeout: 5000 });
      expect(verification.isVerified).toBe(true);
    });
  });

  describe('Cross-Module Integration', () => {
    it('should complete full AI inference with encryption and proof chain', async () => {
      const inferenceRequest = {
        modelId: 'private-gpt-zk',
        encryptedInput: '7f5e8d3a1c9b2e4f6a8d0c7e5b9a1f3d',
        userId: 'user_encrypted_123',
        sessionId: 'session_zk_456'
      };

      const inferenceResult = await modelSync.executePrivateInference(inferenceRequest);
      expect(inferenceResult.encryptedOutput).toBeDefined();
      expect(inferenceResult.inferenceId).toMatch(/^inf_[a-f0-9]{12}$/);

      const proof = await proofGenerator.generateZKProof(
        {
          inferenceId: inferenceResult.inferenceId,
          modelId: inferenceRequest.modelId,
          inputHash: 'hash_' + inferenceRequest.encryptedInput,
          outputHash: 'hash_' + inferenceResult.encryptedOutput,
          timestamp: Date.now()
        },
        'private_inference'
      );

      const chainSubmission = await solanaClient.submitTransaction({
        proofHash: proof.proofHash,
        publicSignals: proof.publicSignals,
        circuitId: proof.circuitId,
        timestamp: proof.timestamp
      });

      expect(chainSubmission.status).toBe('confirmed');
      
      const fullVerification = await client.verifyOnSolana(chainSubmission.txHash);
      expect(fullVerification.verified).toBe(true);
      expect(fullVerification.onChain).toBe(true);
    });
  });
});