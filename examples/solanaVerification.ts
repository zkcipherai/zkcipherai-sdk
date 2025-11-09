import { SolanaClient } from '../src/solana/client';
import { zkCipherClient } from '../src/sdk/zkCipherClient';
import { ProofGenerator } from '../src/proof/generator';
import { ProofVerifier } from '../src/proof/verifier';
import { ModelSync } from '../src/ai/modelSync';

class SolanaVerificationExample {
  private solanaClient: SolanaClient;
  private zkClient: zkCipherClient;
  private proofGenerator: ProofGenerator;
  private proofVerifier: ProofVerifier;
  private modelSync: ModelSync;

  constructor() {
    this.solanaClient = new SolanaClient();
    this.zkClient = new zkCipherClient();
    this.proofGenerator = new ProofGenerator();
    this.proofVerifier = new ProofVerifier();
    this.modelSync = new ModelSync();
  }

  async demonstrateSolanaVerificationWorkflow() {
    console.log('\n🔗 Starting Solana Verification Workflow Demonstration\n');

    try {
      console.log('🌐 Step 1: Establishing Solana Network Connection...');
      const networkStatus = await this.checkSolanaNetwork();
      this.displayNetworkStatus(networkStatus);

      console.log('\n📝 Step 2: Generating Verifiable AI Computation...');
      const computationProof = await this.createVerifiableComputation();
      console.log(`   ✅ Computation proof generated: ${computationProof.proofHash}`);

      console.log('\n💎 Step 3: Submitting to Solana Blockchain...');
      const blockchainRecord = await this.submitToBlockchain(computationProof);
      this.displayBlockchainSubmission(blockchainRecord);

      console.log('\n🔍 Step 4: Real-time Verification Monitoring...');
      const verificationResult = await this.monitorVerification(blockchainRecord.txHash);
      this.displayVerificationStatus(verificationResult);

      console.log('\n📊 Step 5: Blockchain Analytics and Proof...');
      const analytics = await this.generateBlockchainAnalytics(blockchainRecord, verificationResult);
      this.displayAnalytics(analytics);

      console.log('\n🔄 Step 6: Multi-Transaction Proof Chain...');
      const proofChain = await this.createProofChain();
      this.displayProofChain(proofChain);

      console.log('\n🎯 Step 7: Final Verification Integrity Check...');
      const integrityCheck = await this.performIntegrityCheck(proofChain);
      this.displayIntegrityResults(integrityCheck);

      console.log('\n✅ Solana Verification Workflow Completed Successfully!');

    } catch (error) {
      console.error('\n💥 Solana verification failed:', error);
      throw error;
    }
  }

  async demonstrateBatchVerifications() {
    console.log('\n📦 Starting Batch Verification Demonstration\n');

    const batchOperations = [
      { type: 'ai_inference', model: 'llama-3-zk', data: 'batch_data_1' },
      { type: 'model_update', model: 'clip-zk', data: 'batch_data_2' },
      { type: 'privacy_proof', model: 'whisper-zk', data: 'batch_data_3' },
      { type: 'computation', model: 'dalle-zk', data: 'batch_data_4' },
      { type: 'training', model: 'stable-diffusion-zk', data: 'batch_data_5' }
    ];

    console.log(`🔄 Processing ${batchOperations.length} batch operations...`);

    const batchResults = await this.processBatchOperations(batchOperations);
    this.displayBatchResults(batchResults);

    console.log('\n🔗 Creating batch proof aggregation...');
    const aggregatedProof = await this.createAggregatedProof(batchResults);
    this.displayAggregatedProof(aggregatedProof);

    console.log('\n✅ Batch Verification Demonstration Completed!');
  }

  async demonstrateSmartContractIntegration() {
    console.log('\n🤖 Starting Smart Contract Integration Demonstration\n');

    console.log('📄 Step 1: Deploying Verification Smart Contract...');
    const contractDeployment = await this.deployVerificationContract();
    console.log(`   ✅ Contract deployed: ${contractDeployment.contractAddress}`);

    console.log('\n🔐 Step 2: Configuring Contract Security Parameters...');
    const securityConfig = await this.configureContractSecurity(contractDeployment.contractAddress);
    this.displaySecurityConfiguration(securityConfig);

    console.log('\n📤 Step 3: Submitting Proofs to Smart Contract...');
    const contractInteractions = await this.interactWithVerificationContract(contractDeployment.contractAddress);
    this.displayContractInteractions(contractInteractions);

    console.log('\n📈 Step 4: Contract State Verification...');
    const contractState = await this.verifyContractState(contractDeployment.contractAddress);
    this.displayContractState(contractState);

    console.log('\n✅ Smart Contract Integration Completed Successfully!');
  }

  private async checkSolanaNetwork() {
    const networkInfo = await this.solanaClient.getNetworkStatus();
    const recentBlocks = await this.solanaClient.getRecentBlockhashes();
    const validatorInfo = await this.solanaClient.getValidatorInfo();

    return {
      network: networkInfo,
      recentBlocks: recentBlocks.slice(0, 5),
      validators: validatorInfo,
      connectionHealthy: networkInfo.slot > 0,
      finality: networkInfo.absoluteSlot - networkInfo.slot < 10
    };
  }

  private async createVerifiableComputation() {
    const computationData = {
      modelId: 'solana-verified-ai',
      operation: 'complex_inference',
      input: 'Encrypted financial analysis data',
      parameters: {
        layers: 24,
        attentionHeads: 16,
        contextLength: 8192
      },
      timestamp: Date.now(),
      requirements: {
        privacy: 'zero_knowledge',
        verification: 'on_chain',
        performance: 'real_time'
      }
    };

    const proof = await this.proofGenerator.generateZKProof(computationData, 'solana_verification');
    
    const enhancedProof = {
      ...proof,
      solanaMetadata: {
        expectedSlot: await this.solanaClient.getCurrentSlot() + 10,
        priorityFee: 0.0001,
        computeUnits: 200000,
        version: 'zkCipherAI-v1.0.0'
      }
    };

    return enhancedProof;
  }

  private async submitToBlockchain(proof: any) {
    const transactionPayload = {
      proofHash: proof.proofHash,
      publicSignals: proof.publicSignals,
      circuitId: proof.circuitId,
      metadata: {
        type: 'ai_computation_verification',
        model: 'solana-verified-ai',
        timestamp: proof.timestamp,
        version: proof.solanaMetadata.version
      },
      performance: {
        computeUnits: proof.solanaMetadata.computeUnits,
        priorityFee: proof.solanaMetadata.priorityFee
      }
    };

    console.log('   📤 Submitting transaction to Solana...');
    const submission = await this.solanaClient.submitTransaction(transactionPayload);

    console.log('   ⏳ Waiting for confirmation...');
    const confirmation = await this.waitForTransactionConfirmation(subscription.txHash);

    const onChainVerification = await this.solanaClient.verifyProofOnChain(
      submission.txHash,
      proof.proofHash
    );

    return {
      txHash: submission.txHash,
      slot: submission.slot,
      confirmation: confirmation.status,
      confirmations: confirmation.confirmations,
      onChainVerified: onChainVerification.onChain,
      verifiedBlock: onChainVerification.verifiedBlock,
      submissionTime: submission.timestamp,
      confirmationTime: confirmation.timestamp
    };
  }

  private async monitorVerification(txHash: string) {
    const monitoringStart = Date.now();
    const maxMonitoringTime = 60000;
    const checkInterval = 2000;

    let verificationStatus = {
      onChain: false,
      confirmed: false,
      final: false,
      checks: 0,
      lastBlock: 0
    };

    while (Date.now() - monitoringStart < maxMonitoringTime) {
      try {
        const txStatus = await this.solanaClient.fetchTransactionStatus(txHash);
        const chainVerification = await this.solanaClient.verifyProofOnChain(txHash, '');

        verificationStatus = {
          onChain: chainVerification.onChain,
          confirmed: txStatus.status === 'confirmed',
          final: txStatus.confirmations >= 32,
          checks: verificationStatus.checks + 1,
          lastBlock: txStatus.slot
        };

        if (verificationStatus.final) {
          break;
        }

        await new Promise(resolve => setTimeout(resolve, checkInterval));
      } catch (error) {
        console.log(`   ⚠️  Monitoring check ${verificationStatus.checks + 1} failed: ${error.message}`);
      }
    }

    return {
      ...verificationStatus,
      monitoringDuration: Date.now() - monitoringStart,
      monitoringChecks: verificationStatus.checks
    };
  }

  private async generateBlockchainAnalytics(submission: any, verification: any) {
    const currentSlot = await this.solanaClient.getCurrentSlot();
    const blockTime = await this.solanaClient.getAverageBlockTime();

    const confirmationDelay = submission.confirmationTime - submission.submissionTime;
    const blocksToFinality = currentSlot - submission.slot;

    const performanceScore = this.calculatePerformanceScore(confirmationDelay, verification.monitoringChecks);
    const securityScore = this.calculateSecurityScore(blocksToFinality, verification.final);
    const reliabilityScore = this.calculateReliabilityScore(verification);

    return {
      transaction: {
        hash: submission.txHash,
        slot: submission.slot,
        confirmationDelay,
        blocksToFinality
      },
      verification: {
        onChain: verification.onChain,
        confirmed: verification.confirmed,
        final: verification.final,
        checks: verification.checks
      },
      performance: {
        score: performanceScore,
        level: this.getPerformanceLevel(performanceScore),
        metrics: {
          confirmationDelay,
          monitoringChecks: verification.monitoringChecks,
          monitoringDuration: verification.monitoringDuration
        }
      },
      security: {
        score: securityScore,
        level: this.getSecurityLevel(securityScore),
        finality: verification.final,
        blocksSinceSubmission: blocksToFinality
      },
      reliability: {
        score: reliabilityScore,
        level: this.getReliabilityLevel(reliabilityScore),
        uptime: 0.999,
        consistency: 0.995
      }
    };
  }

  private async createProofChain() {
    const chainOperations = [
      { type: 'model_init', data: 'Initial model deployment' },
      { type: 'training_round', data: 'Federated learning round 1' },
      { type: 'training_round', data: 'Federated learning round 2' },
      { type: 'model_update', data: 'Aggregated model update' },
      { type: 'inference', data: 'Production inference verification' }
    ];

    const chainLinks = [];
    let previousProofHash = '';

    for (const operation of chainOperations) {
      const proofData = {
        operation: operation.type,
        data: operation.data,
        previousProof: previousProofHash,
        timestamp: Date.now(),
        sequence: chainLinks.length + 1
      };

      const proof = await this.proofGenerator.generateZKProof(proofData, 'proof_chain');
      const submission = await this.solanaClient.submitTransaction({
        proofHash: proof.proofHash,
        publicSignals: proof.publicSignals,
        circuitId: proof.circuitId,
        metadata: {
          type: 'proof_chain_link',
          sequence: proofData.sequence,
          previousProof: previousProofHash
        }
      });

      chainLinks.push({
        sequence: proofData.sequence,
        operation: operation.type,
        proofHash: proof.proofHash,
        txHash: submission.txHash,
        slot: submission.slot,
        timestamp: proof.timestamp
      });

      previousProofHash = proof.proofHash;
      await this.waitForTransactionConfirmation(subscription.txHash);
    }

    return {
      chainId: `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      links: chainLinks,
      rootProof: chainLinks[0].proofHash,
      latestProof: chainLinks[chainLinks.length - 1].proofHash,
      totalOperations: chainLinks.length,
      startTime: chainLinks[0].timestamp,
      endTime: chainLinks[chainLinks.length - 1].timestamp
    };
  }

  private async performIntegrityCheck(proofChain: any) {
    const integrityChecks = [];

    for (const link of proofChain.links) {
      const txStatus = await this.solanaClient.fetchTransactionStatus(link.txHash);
      const proofVerification = await this.proofVerifier.verifyProof({
        proofHash: link.proofHash,
        circuitId: 'proof_chain',
        publicSignals: { sequence: link.sequence },
        timestamp: link.timestamp
      });

      const chainIntegrity = link.sequence === 1 || 
        proofChain.links[link.sequence - 2].proofHash === 
        (link.publicSignals?.previousProof || '');

      integrityChecks.push({
        sequence: link.sequence,
        txConfirmed: txStatus.status === 'confirmed',
        proofVerified: proofVerification.isVerified,
        chainIntegrity,
        slot: link.slot,
        verificationTime: proofVerification.verificationTime
      });
    }

    const allTransactionsConfirmed = integrityChecks.every(check => check.txConfirmed);
    const allProofsVerified = integrityChecks.every(check => proofVerified);
    const chainIntegrityMaintained = integrityChecks.every(check => check.chainIntegrity);

    return {
      checks: integrityChecks,
      summary: {
        allTransactionsConfirmed,
        allProofsVerified,
        chainIntegrityMaintained,
        totalChecks: integrityChecks.length,
        successfulChecks: integrityChecks.filter(check => 
          check.txConfirmed && check.proofVerified && check.chainIntegrity
        ).length
      },
      integrityScore: this.calculateIntegrityScore(integrityChecks)
    };
  }

  private async processBatchOperations(operations: any[]) {
    const batchPromises = operations.map(async (operation, index) => {
      const proofData = {
        batchId: `batch_${Date.now()}`,
        operation: operation.type,
        model: operation.model,
        data: operation.data,
        sequence: index + 1,
        timestamp: Date.now()
      };

      const proof = await this.proofGenerator.generateZKProof(proofData, 'batch_operation');
      const submission = await this.solanaClient.submitTransaction({
        proofHash: proof.proofHash,
        publicSignals: proof.publicSignals,
        circuitId: proof.circuitId,
        metadata: {
          type: 'batch_operation',
          batchId: proofData.batchId,
          sequence: proofData.sequence
        }
      });

      await this.waitForTransactionConfirmation(subscription.txHash);

      return {
        sequence: proofData.sequence,
        operation: operation.type,
        proofHash: proof.proofHash,
        txHash: submission.txHash,
        slot: submission.slot,
        status: 'completed'
      };
    });

    return await Promise.all(batchPromises);
  }

  private async createAggregatedProof(batchResults: any[]) {
    const aggregationData = {
      batchId: `aggregated_${Date.now()}`,
      operations: batchResults.map(result => ({
        proofHash: result.proofHash,
        txHash: result.txHash,
        sequence: result.sequence
      })),
      totalOperations: batchResults.length,
      timestamp: Date.now()
    };

    const aggregatedProof = await this.proofGenerator.generateZKProof(aggregationData, 'batch_aggregation');
    const aggregationSubmission = await this.solanaClient.submitTransaction({
      proofHash: aggregatedProof.proofHash,
      publicSignals: aggregatedProof.publicSignals,
      circuitId: aggregatedProof.circuitId,
      metadata: {
        type: 'batch_aggregation',
        batchId: aggregationData.batchId,
        totalOperations: aggregationData.totalOperations
      }
    });

    await this.waitForTransactionConfirmation(aggregationSubmission.txHash);

    return {
      aggregationProof: aggregatedProof,
      submission: aggregationSubmission,
      batchResults: batchResults,
      verification: await this.solanaClient.verifyProofOnChain(
        aggregationSubmission.txHash,
        aggregatedProof.proofHash
      )
    };
  }

  private async deployVerificationContract() {
    const contractCode = {
      name: 'ZKCipherVerification',
      version: '1.0.0',
      instructions: [
        'verify_proof',
        'store_verification',
        'check_consistency',
        'update_security_params'
      ],
      security: {
        proof_verification: true,
        state_consistency: true,
        access_control: true
      }
    };

    const deploymentResult = await this.solanaClient.deploySmartContract(contractCode);
    
    return {
      contractAddress: deploymentResult.contractAddress,
      deploymentTx: deploymentResult.txHash,
      programId: deploymentResult.programId,
      deployer: deploymentResult.deployer,
      timestamp: deploymentResult.timestamp
    };
  }

  private async configureContractSecurity(contractAddress: string) {
    const securityParams = {
      minVerificationScore: 0.8,
      maxProofAge: 86400,
      requiredConfirmations: 1,
      allowedCircuits: ['ai_cipher_complete', 'proof_chain', 'batch_aggregation'],
      securityLevel: 'high'
    };

    const configResult = await this.solanaClient.configureContract(
      contractAddress,
      securityParams
    );

    return {
      contractAddress,
      securityParams,
      configTx: configResult.txHash,
      oldParams: configResult.previousParams,
      newParams: configResult.newParams
    };
  }

  private async interactWithVerificationContract(contractAddress: string) {
    const testProofs = [
      { type: 'inference', proofHash: 'proof_test_inference_1' },
      { type: 'training', proofHash: 'proof_test_training_1' },
      { type: 'update', proofHash: 'proof_test_update_1' }
    ];

    const interactions = [];

    for (const testProof of testProofs) {
      const interaction = await this.solanaClient.interactWithContract(
        contractAddress,
        'verify_proof',
        {
          proofHash: testProof.proofHash,
          proofType: testProof.type,
          timestamp: Date.now()
        }
      );

      interactions.push({
        proofType: testProof.type,
        proofHash: testProof.proofHash,
        interactionTx: interaction.txHash,
        result: interaction.result,
        gasUsed: interaction.gasUsed
      });

      await this.waitForTransactionConfirmation(interaction.txHash);
    }

    return interactions;
  }

  private async verifyContractState(contractAddress: string) {
    const contractState = await this.solanaClient.getContractState(contractAddress);
    const verificationCount = await this.solanaClient.getContractVerificationCount(contractAddress);
    const securityState = await this.solanaClient.getContractSecurityState(contractAddress);

    return {
      contractAddress,
      state: contractState,
      verifications: verificationCount,
      security: securityState,
      health: this.assessContractHealth(contractState, verificationCount, securityState)
    };
  }

  private async waitForTransactionConfirmation(txHash: string, timeout: number = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const status = await this.solanaClient.fetchTransactionStatus(txHash);
      
      if (status.status === 'confirmed') {
        return status;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Transaction ${txHash} not confirmed within ${timeout}ms`);
  }

  private calculatePerformanceScore(confirmationDelay: number, monitoringChecks: number): number {
    const delayScore = Math.max(0, 1 - (confirmationDelay / 30000));
    const efficiencyScore = Math.max(0, 1 - (monitoringChecks / 20));
    return (delayScore * 0.7 + efficiencyScore * 0.3);
  }

  private calculateSecurityScore(blocksToFinality: number, isFinal: boolean): number {
    const finalityScore = isFinal ? 1.0 : Math.max(0, 1 - (blocksToFinality / 100));
    return finalityScore;
  }

  private calculateReliabilityScore(verification: any): number {
    const successRate = verification.checks > 0 ? 
      (verification.onChain ? 1.0 : 0.5) : 0.0;
    return successRate;
  }

  private calculateIntegrityScore(integrityChecks: any[]): number {
    const totalChecks = integrityChecks.length;
    const successfulChecks = integrityChecks.filter(check => 
      check.txConfirmed && check.proofVerified && check.chainIntegrity
    ).length;
    
    return totalChecks > 0 ? successfulChecks / totalChecks : 0;
  }

  private getPerformanceLevel(score: number): string {
    if (score >= 0.9) return 'excellent';
    if (score >= 0.8) return 'good';
    if (score >= 0.7) return 'acceptable';
    return 'poor';
  }

  private getSecurityLevel(score: number): string {
    if (score >= 0.95) return 'maximum';
    if (score >= 0.85) return 'high';
    if (score >= 0.75) return 'medium';
    return 'basic';
  }

  private getReliabilityLevel(score: number): string {
    if (score >= 0.99) return 'excellent';
    if (score >= 0.95) return 'high';
    if (score >= 0.90) return 'good';
    return 'moderate';
  }

  private assessContractHealth(state: any, verifications: any, security: any): string {
    if (!state.initialized) return 'uninitialized';
    if (security.securityLevel === 'high' && verifications.successRate > 0.95) return 'healthy';
    if (verifications.successRate > 0.8) return 'degraded';
    return 'unhealthy';
  }

  private displayNetworkStatus(status: any) {
    console.log(`   ✅ Network: ${status.network.networkName}`);
    console.log(`   📊 Slot: ${status.network.slot}, Finality: ${status.finality ? 'Healthy' : 'Degraded'}`);
    console.log(`   🔗 Connection: ${status.connectionHealthy ? 'Stable' : 'Unstable'}`);
    console.log(`   🛡️  Validators: ${status.validators.active}/${status.validators.total} active`);
  }

  private displayBlockchainSubmission(submission: any) {
    console.log(`   ✅ Transaction: ${submission.txHash}`);
    console.log(`   📦 Slot: ${submission.slot}, Confirmations: ${submission.confirmations}`);
    console.log(`   🕒 Submission: ${new Date(submission.submissionTime).toISOString()}`);
    console.log(`   🔍 On-chain: ${submission.onChainVerified ? 'Verified' : 'Pending'}`);
  }

  private displayVerificationStatus(verification: any) {
    console.log(`   ✅ On-chain: ${verification.onChain ? 'Yes' : 'No'}`);
    console.log(`   🔒 Confirmed: ${verification.confirmed ? 'Yes' : 'No'}`);
    console.log(`   🎯 Final: ${verification.final ? 'Yes' : 'No'}`);
    console.log(`   📊 Checks: ${verification.checks}, Duration: ${verification.monitoringDuration}ms`);
  }

  private displayAnalytics(analytics: any) {
    console.log(`   📈 Performance: ${analytics.performance.score.toFixed(3)} (${analytics.performance.level})`);
    console.log(`   🛡️  Security: ${analytics.security.score.toFixed(3)} (${analytics.security.level})`);
    console.log(`   🔄 Reliability: ${analytics.reliability.score.toFixed(3)} (${analytics.reliability.level})`);
    console.log(`   ⚡ Confirmation Delay: ${analytics.transaction.confirmationDelay}ms`);
    console.log(`   🧱 Blocks to Finality: ${analytics.transaction.blocksToFinality}`);
  }

  private displayProofChain(chain: any) {
    console.log(`   🔗 Chain ID: ${chain.chainId}`);
    console.log(`   📊 Operations: ${chain.totalOperations}`);
    console.log(`   🕒 Duration: ${chain.endTime - chain.startTime}ms`);
    console.log(`   🎯 Root: ${chain.rootProof.substring(0, 16)}...`);
    console.log(`   📍 Latest: ${chain.latestProof.substring(0, 16)}...`);
  }

  private displayIntegrityResults(integrity: any) {
    console.log(`   ✅ Transactions: ${integrity.summary.allTransactionsConfirmed ? 'All Confirmed' : 'Some Pending'}`);
    console.log(`   🧾 Proofs: ${integrity.summary.allProofsVerified ? 'All Verified' : 'Some Failed'}`);
    console.log(`   🔗 Chain: ${integrity.summary.chainIntegrityMaintained ? 'Integrity Maintained' : 'Broken'}`);
    console.log(`   📊 Integrity Score: ${integrity.integrityScore.toFixed(3)}`);
    console.log(`   🎯 Successful Checks: ${integrity.summary.successfulChecks}/${integrity.summary.totalChecks}`);
  }

  private displayBatchResults(results: any) {
    console.log(`   📦 Processed: ${results.length} operations`);
    results.forEach((result: any) => {
      console.log(`      ${result.sequence}. ${result.operation}: ${result.proofHash.substring(0, 12)}...`);
    });
  }

  private displayAggregatedProof(aggregated: any) {
    console.log(`   🎯 Aggregation Proof: ${aggregated.aggregationProof.proofHash}`);
    console.log(`   📊 Total Operations: ${aggregated.batchResults.length}`);
    console.log(`   🔗 Transaction: ${aggregated.subscription.txHash}`);
    console.log(`   ✅ On-chain: ${aggregated.verification.onChain ? 'Verified' : 'Pending'}`);
  }

  private displaySecurityConfiguration(config: any) {
    console.log(`   🛡️  Contract: ${config.contractAddress}`);
    console.log(`   📝 Configuration TX: ${config.configTx}`);
    console.log(`   ⚙️  Security Level: ${config.securityParams.securityLevel}`);
    console.log(`   🎯 Min Score: ${config.securityParams.minVerificationScore}`);
    console.log(`   📋 Allowed Circuits: ${config.securityParams.allowedCircuits.length}`);
  }

  private displayContractInteractions(interactions: any) {
    console.log(`   🤖 Interactions: ${interactions.length} verification attempts`);
    interactions.forEach((interaction: any) => {
      console.log(`      ${interaction.proofType}: ${interaction.result ? 'Success' : 'Failed'} (${interaction.gasUsed} gas)`);
    });
  }

  private displayContractState(state: any) {
    console.log(`   📊 Contract State: ${state.state.initialized ? 'Initialized' : 'Uninitialized'}`);
    console.log(`   🔍 Verifications: ${state.verifications.total} total, ${state.verifications.successful} successful`);
    console.log(`   🛡️  Security: ${state.security.securityLevel}, Score: ${state.security.securityScore}`);
    console.log(`   ❤️  Health: ${state.health}`);
  }
}

async function main() {
  const example = new SolanaVerificationExample();
  
  try {
    await example.demonstrateSolanaVerificationWorkflow();
    await example.demonstrateBatchVerifications();
    await example.demonstrateSmartContractIntegration();
    
    console.log('\n🎉 All Solana verification examples completed successfully!');
    console.log('   The zkCipherAI SDK has demonstrated full blockchain integration capabilities.');
    
  } catch (error) {
    console.error('\n💥 Solana verification demonstration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { SolanaVerificationExample };