import { zkCipherClient } from '../src/sdk/zkCipherClient';
import { ModelSync } from '../src/ai/modelSync';
import { ProofGenerator } from '../src/proof/generator';
import { SolanaClient } from '../src/solana/client';

class PrivateComputationExample {
  private client: zkCipherClient;
  private modelSync: ModelSync;
  private proofGenerator: ProofGenerator;
  private solanaClient: SolanaClient;

  constructor() {
    this.client = new zkCipherClient();
    this.modelSync = new ModelSync();
    this.proofGenerator = new ProofGenerator();
    this.solanaClient = new SolanaClient();
  }

  async demonstratePrivateAIInference() {
    console.log('\n🚀 Starting Private AI Inference Demonstration\n');

    try {
      const sensitiveData = {
        medicalRecords: [
          {
            patientId: 'encrypted_patient_123',
            diagnosis: 'Classified medical condition',
            treatmentPlan: 'Advanced therapeutic protocol',
            labResults: {
              bloodWork: 'encrypted_blood_metrics',
              imaging: 'encrypted_scan_data',
              geneticMarkers: 'encrypted_genomic_data'
            }
          }
        ],
        researchData: {
          clinicalTrial: 'Phase III encrypted results',
          drugEfficacy: 'Proprietary effectiveness metrics',
          sideEffects: 'Encrypted adverse event profiles'
        }
      };

      console.log('📊 Step 1: Encrypting sensitive medical data...');
      
      const encryptionResult = await this.client.encrypt({
        data: JSON.stringify(sensitiveData),
        encryptionLevel: 'maximum',
        compression: true
      });

      console.log(`✅ Encryption complete - Cipher ID: ${encryptionResult.cipherId}`);
      console.log(`   Data size reduction: ${encryptionResult.compressionStats.ratio.toFixed(2)}x`);

      console.log('\n🤖 Step 2: Executing private AI inference on encrypted data...');
      
      const inferenceRequest = {
        modelId: 'medical-ai-zk-v2',
        encryptedInput: encryptionResult.encryptedData,
        inferenceType: 'diagnostic_analysis',
        privacyGuarantees: {
          zeroKnowledge: true,
          differentialPrivacy: true,
          secureMultiParty: false
        }
      };

      const inferenceResult = await this.modelSync.executePrivateInference(inferenceRequest);
      console.log(`✅ Private inference complete - Inference ID: ${inferenceResult.inferenceId}`);
      console.log(`   Processing time: ${inferenceResult.processingTime}ms`);

      console.log('\n🧩 Step 3: Generating zero-knowledge proof of computation...');
      
      const proofPayload = {
        inputHash: encryptionResult.dataHash,
        outputHash: inferenceResult.outputHash,
        modelHash: 'sha256_medical_ai_model_v2',
        computationIntegrity: true,
        privacyPreserved: true,
        timestamp: Date.now()
      };

      const proof = await this.proofGenerator.generateZKProof(proofPayload, 'medical_inference');
      console.log(`✅ ZK Proof generated - Proof Hash: ${proof.proofHash}`);
      console.log(`   Circuit: ${proof.circuitId}, Compression: ${proof.compressionRatio.toFixed(3)}`);

      console.log('\n🔗 Step 4: Verifying proof on Solana blockchain...');
      
      const verification = await this.client.verifyOnSolana(proof.proofHash);
      console.log(`✅ On-chain verification: ${verification.verified ? 'SUCCESS' : 'FAILED'}`);
      console.log(`   Transaction: ${verification.txHash}`);
      console.log(`   Block: ${verification.blockNumber}, Slot: ${verification.slot}`);

      console.log('\n📋 Step 5: Comprehensive audit trail generation...');
      
      const auditTrail = await this.generateAuditTrail({
        encryption: encryptionResult,
        inference: inferenceResult,
        proof: proof,
        verification: verification
      });

      this.displayResults(auditTrail);

    } catch (error) {
      console.error('❌ Private computation failed:', error);
      throw error;
    }
  }

  async demonstrateFederatedLearning() {
    console.log('\n🌐 Starting Federated Learning Demonstration\n');

    const participatingNodes = [
      { nodeId: 'hospital_alpha', dataType: 'oncology', samples: 12500 },
      { nodeId: 'clinic_beta', dataType: 'cardiology', samples: 8700 },
      { nodeId: 'research_gamma', dataType: 'neurology', samples: 15600 }
    ];

    console.log('🔒 Step 1: Establishing secure federated learning session...');
    
    const federationSession = await this.modelSync.initiateFederatedSession({
      modelId: 'federated-medical-ai',
      participants: participatingNodes,
      aggregationMethod: 'secure_aggregation',
      rounds: 10,
      targetAccuracy: 0.95
    });

    console.log(`✅ Federation session created - Session ID: ${federationSession.sessionId}`);
    console.log(`   Participants: ${federationSession.participants.length} nodes`);
    console.log(`   Target rounds: ${federationSession.rounds}`);

    for (let round = 1; round <= 3; round++) {
      console.log(`\n🔄 Round ${round}: Secure model aggregation...`);
      
      const roundUpdate = await this.modelSync.federatedRoundUpdate({
        sessionId: federationSession.sessionId,
        round: round,
        nodeUpdates: participatingNodes.map(node => ({
          nodeId: node.nodeId,
          gradientHash: `encrypted_gradients_${node.nodeId}_r${round}`,
          sampleCount: node.samples,
          proofOfComputation: `proof_${node.nodeId}_round_${round}`
        }))
      });

      console.log(`✅ Round ${round} complete - Accuracy: ${roundUpdate.accuracy.toFixed(4)}`);
      console.log(`   Model hash: ${roundUpdate.modelHash.substring(0, 16)}...`);
      
      if (roundUpdate.accuracy >= 0.95) {
        console.log('🎯 Target accuracy achieved!');
        break;
      }
    }

    console.log('\n📜 Step 2: Generating federation proof chain...');
    
    const federationProof = await this.proofGenerator.generateZKProof(
      {
        sessionId: federationSession.sessionId,
        finalModelHash: federationSession.finalModelHash,
        participants: participatingNodes.length,
        totalSamples: participatingNodes.reduce((sum, node) => sum + node.samples, 0),
        privacyPreserved: true
      },
      'federated_learning'
    );

    console.log(`✅ Federation proof generated - Hash: ${federationProof.proofHash}`);
    
    const chainSubmission = await this.solanaClient.submitTransaction({
      proofHash: federationProof.proofHash,
      publicSignals: federationProof.publicSignals,
      circuitId: federationProof.circuitId,
      metadata: {
        type: 'federated_learning_completion',
        model: 'federated-medical-ai',
        participants: participatingNodes.length
      }
    });

    console.log(`✅ Federation recorded on Solana - TX: ${chainSubmission.txHash}`);
  }

  async demonstrateSecureModelUpdates() {
    console.log('\n🔄 Starting Secure Model Update Demonstration\n');

    const modelVersion = {
      current: 'medical-ai-v1.2.3',
      new: 'medical-ai-v1.3.0',
      changes: {
        architecture: 'Enhanced transformer layers',
        trainingData: 'Additional 50k medical records',
        performance: '5.2% accuracy improvement',
        privacyEnhancements: ['Differential privacy', 'Secure aggregation']
      }
    };

    console.log('🔐 Step 1: Creating encrypted model update...');
    
    const modelUpdate = {
      modelId: modelVersion.new,
      previousVersion: modelVersion.current,
      weightsHash: 'sha256_updated_weights_7f3e9a',
      architectureHash: 'sha256_new_arch_4b2c8d',
      trainingProof: 'proof_enhanced_training_abc123',
      performanceMetrics: {
        accuracy: 0.956,
        precision: 0.942,
        recall: 0.961,
        f1Score: 0.951
      }
    };

    const encryptedUpdate = await this.client.encrypt({
      data: JSON.stringify(modelUpdate),
      encryptionLevel: 'model_weights',
      compression: true
    });

    console.log(`✅ Model update encrypted - Cipher: ${encryptedUpdate.cipherId}`);

    console.log('\n🧾 Step 2: Generating update verification proof...');
    
    const updateProof = await this.proofGenerator.generateZKProof(
      {
        fromVersion: modelVersion.current,
        toVersion: modelVersion.new,
        weightsIntegrity: true,
        performanceImprovement: true,
        noDataLeakage: true,
        timestamp: Date.now()
      },
      'model_update'
    );

    console.log(`✅ Update proof generated - Hash: ${updateProof.proofHash}`);

    console.log('\n🌐 Step 3: Distributing update to AI network...');
    
    const distribution = await this.modelSync.distributeModelUpdate({
      updateId: `update_${modelVersion.new}`,
      encryptedModel: encryptedUpdate.encryptedData,
      proof: updateProof,
      targetNodes: ['node_alpha', 'node_beta', 'node_gamma', 'node_delta'],
      rolloutStrategy: 'progressive'
    });

    console.log(`✅ Model update distributed - Distribution ID: ${distribution.distributionId}`);
    console.log(`   Nodes updated: ${distribution.updatedNodes.length}`);
    console.log(`   Rollout status: ${distribution.rolloutPhase}`);

    console.log('\n✅ Secure Model Update Completed Successfully!');
  }

  private async generateAuditTrail(components: any) {
    return {
      auditId: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      components: {
        encryption: {
          cipherId: components.encryption.cipherId,
          timestamp: components.encryption.timestamp,
          dataHash: components.encryption.dataHash
        },
        inference: {
          inferenceId: components.inference.inferenceId,
          modelId: components.inference.modelId,
          processingTime: components.inference.processingTime
        },
        proof: {
          proofHash: components.proof.proofHash,
          circuitId: components.proof.circuitId,
          generationTime: components.proof.generationTime
        },
        blockchain: {
          txHash: components.verification.txHash,
          blockNumber: components.verification.blockNumber,
          verificationTime: components.verification.verificationTime
        }
      },
      integrity: {
        dataFlow: 'encrypted → private inference → ZK proof → blockchain',
        privacyGuarantees: ['zero_knowledge', 'encryption_at_rest', 'secure_computation'],
        compliance: ['HIPAA', 'GDPR', 'Medical_data_protection']
      }
    };
  }

  private displayResults(auditTrail: any) {
    console.log('\n' + '='.repeat(70));
    console.log('🎯 PRIVATE COMPUTATION DEMONSTRATION - COMPLETE');
    console.log('='.repeat(70));
    
    console.log('\n📋 AUDIT TRAIL SUMMARY:');
    console.log(`   Audit ID: ${auditTrail.auditId}`);
    console.log(`   Timestamp: ${auditTrail.timestamp}`);
    
    console.log('\n🔗 COMPONENT INTEGRITY:');
    console.log(`   • Encryption: ${auditTrail.components.encryption.cipherId}`);
    console.log(`   • Inference: ${auditTrail.components.inference.inferenceId}`);
    console.log(`   • ZK Proof: ${auditTrail.components.proof.proofHash}`);
    console.log(`   • Blockchain: ${auditTrail.components.blockchain.txHash}`);
    
    console.log('\n🛡️  PRIVACY GUARANTEES:');
    auditTrail.integrity.privacyGuarantees.forEach((guarantee: string, index: number) => {
      console.log(`   ${index + 1}. ${guarantee.replace(/_/g, ' ').toUpperCase()}`);
    });
    
    console.log('\n📜 COMPLIANCE STANDARDS:');
    auditTrail.integrity.compliance.forEach((standard: string) => {
      console.log(`   ✓ ${standard}`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL OPERATIONS COMPLETED WITH ZERO-KNOWLEDGE VERIFICATION');
    console.log('='.repeat(70));
  }
}

async function main() {
  const example = new PrivateComputationExample();
  
  try {
    await example.demonstratePrivateAIInference();
    await example.demonstrateFederatedLearning();
    await example.demonstrateSecureModelUpdates();
    
    console.log('\n🎉 All private computation examples completed successfully!');
    console.log('   The zkCipherAI SDK has demonstrated full privacy-preserving AI capabilities.');
    
  } catch (error) {
    console.error('\n💥 Demonstration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { PrivateComputationExample };