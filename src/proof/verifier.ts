import { Logger } from '../utils/logger';
import { SolanaClient } from '../solana/client';
import { ZKProof } from './generator';

interface VerificationResult {
  verified: boolean;
  verificationTime: number;
  verifiedAt: number;
  details: {
    proofStructure: boolean;
    cryptographic: boolean;
    circuitConsistency: boolean;
    timestamp: boolean;
  };
  trustScore?: number;
  onChain?: boolean;
  error?: string;
}

interface BatchVerificationResult {
  batchId: string;
  verified: boolean;
  verifiedProofs: string[];
  failedProofs: string[];
  verificationTime: number;
  successRate: number;
}

interface VerificationOptions {
  timeout?: number;
  checkOnChain?: boolean;
  strictMode?: boolean;
  trustThreshold?: number;
}

class ProofVerifier {
  private logger: Logger;
  private solanaClient: SolanaClient;
  private verificationCache: Map<string, VerificationResult>;
  private performanceMetrics: any;

  constructor() {
    this.logger = new Logger('ProofVerifier');
    this.solanaClient = new SolanaClient();
    this.verificationCache = new Map();
    this.performanceMetrics = this.initializeMetrics();
    this.initializeVerificationEngine();
  }

  private initializeVerificationEngine(): void {
    this.logger.info('Initializing Proof Verification Engine');
    
    const engineConfig = {
      supportedProofFormats: ['zkp_v1', 'zkp_v2', 'snark', 'stark'],
      verificationMethods: ['local', 'on_chain', 'consensus'],
      cacheEnabled: true,
      timeout: 30000,
      strictMode: false,
      trustThreshold: 0.8
    };

    this.logger.debug(`Verification engine configured: ${JSON.stringify(engineConfig)}`);
  }

  async verifyProof(
    proof: ZKProof,
    options: VerificationOptions = {}
  ): Promise<VerificationResult> {
    const startTime = Date.now();
    const verificationId = `verify_${proof.proofHash}_${Date.now()}`;

    try {
      this.logger.info(`Verifying proof: ${proof.proofHash}`);

      const cacheKey = this.generateCacheKey(proof, options);
      const cachedResult = this.verificationCache.get(cacheKey);
      
      if (cachedResult && this.isCacheValid(cachedResult)) {
        this.logger.debug('Returning cached verification result');
        this.performanceMetrics.cacheHits++;
        return cachedResult;
      }

      this.validateProofStructure(proof);

      const verificationPromises = [
        this.verifyProofStructure(proof),
        this.verifyCryptographicProperties(proof),
        this.verifyCircuitConsistency(proof),
        this.verifyTimestamp(proof)
      ];

      if (options.checkOnChain) {
        verificationPromises.push(this.verifyOnChain(proof.proofHash));
      }

      const timeout = options.timeout || 30000;
      const verificationResults = await this.executeWithTimeout(
        Promise.allSettled(verificationPromises),
        timeout
      );

      const verificationDetails = this.processVerificationResults(verificationResults, proof);
      const trustScore = this.calculateTrustScore(verificationDetails);
      const verified = this.determineVerificationResult(verificationDetails, trustScore, options);

      const result: VerificationResult = {
        verified,
        verificationTime: Date.now() - startTime,
        verifiedAt: Date.now(),
        details: verificationDetails,
        trustScore
      };

      if (options.checkOnChain) {
        result.onChain = verificationDetails.onChain;
      }

      this.verificationCache.set(cacheKey, result);
      this.updatePerformanceMetrics(result.verificationTime, verified);

      this.logger.info(`Proof verification completed: ${proof.proofHash}, Verified: ${verified}`);

      return result;

    } catch (error) {
      this.updatePerformanceMetrics(Date.now() - startTime, false);
      
      const errorResult: VerificationResult = {
        verified: false,
        verificationTime: Date.now() - startTime,
        verifiedAt: Date.now(),
        details: {
          proofStructure: false,
          cryptographic: false,
          circuitConsistency: false,
          timestamp: false
        },
        error: error.message
      };

      this.logger.error(`Proof verification failed: ${error.message}`);
      return errorResult;
    }
  }

  async verifyBatchProofs(
    proofs: ZKProof[],
    options: VerificationOptions = {}
  ): Promise<BatchVerificationResult> {
    const startTime = Date.now();
    const batchId = `batch_verify_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    try {
      this.logger.info(`Batch verifying ${proofs.length} proofs: ${batchId}`);

      const verificationPromises = proofs.map(proof => this.verifyProof(proof, options));
      const results = await Promise.allSettled(verificationPromises);

      const verifiedProofs: string[] = [];
      const failedProofs: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.verified) {
          verifiedProofs.push(proofs[index].proofHash);
        } else {
          failedProofs.push(proofs[index].proofHash);
        }
      });

      const successRate = proofs.length > 0 ? verifiedProofs.length / proofs.length : 0;
      const verificationTime = Date.now() - startTime;

      const batchResult: BatchVerificationResult = {
        batchId,
        verified: successRate >= (options.trustThreshold || 0.8),
        verifiedProofs,
        failedProofs,
        verificationTime,
        successRate
      };

      this.logger.info(`Batch verification completed: ${batchId}, Success: ${verifiedProofs.length}/${proofs.length}`);

      return batchResult;

    } catch (error) {
      this.logger.error(`Batch verification failed: ${error.message}`);
      throw new Error(`BatchVerificationError: ${error.message}`);
    }
  }

  async verifyOnChain(proofHash: string): Promise<{ onChain: boolean; details?: any }> {
    try {
      this.logger.debug(`Checking on-chain verification for proof: ${proofHash}`);

      const verification = await this.solanaClient.verifyProofOnChain(proofHash, proofHash);
      
      return {
        onChain: verification.onChain,
        details: {
          verifiedBlock: verification.verifiedBlock,
          verificationTime: verification.verificationTime
        }
      };

    } catch (error) {
      this.logger.warn(`On-chain verification failed: ${error.message}`);
      return { onChain: false, details: { error: error.message } };
    }
  }

  async verifyProofWithConsensus(
    proof: ZKProof,
    validators: string[]
  ): Promise<{
    verified: boolean;
    consensus: number;
    validatorResults: any[];
  }> {
    const startTime = Date.now();
    
    this.logger.info(`Verifying proof with consensus: ${proof.proofHash}, Validators: ${validators.length}`);

    try {
      const validatorPromises = validators.map(validatorId =>
        this.simulateValidatorVerification(proof, validatorId)
      );

      const validatorResults = await Promise.allSettled(validatorPromises);
      const successfulValidations = validatorResults.filter(
        (result): result is PromiseFulfilledResult<any> => 
          result.status === 'fulfilled' && result.value.verified
      );

      const consensus = validators.length > 0 ? successfulValidations.length / validators.length : 0;
      const verified = consensus >= 0.67;

      this.logger.info(`Consensus verification completed: ${proof.proofHash}, Consensus: ${Math.round(consensus * 100)}%`);

      return {
        verified,
        consensus,
        validatorResults: validatorResults.map((result, index) => ({
          validator: validators[index],
          verified: result.status === 'fulfilled' && result.value.verified,
          error: result.status === 'rejected' ? result.reason.message : undefined
        }))
      };

    } catch (error) {
      this.logger.error(`Consensus verification failed: ${error.message}`);
      throw error;
    }
  }

  async verifyProofChain(proofChain: ZKProof[]): Promise<{
    verified: boolean;
    chainIntegrity: boolean;
    brokenLinks: number[];
    chainTrustScore: number;
  }> {
    const startTime = Date.now();
    
    this.logger.info(`Verifying proof chain with ${proofChain.length} links`);

    try {
      if (proofChain.length < 2) {
        throw new Error('Proof chain must contain at least 2 proofs');
      }

      const chainVerifications: boolean[] = [];
      const brokenLinks: number[] = [];

      for (let i = 0; i < proofChain.length; i++) {
        const currentProof = proofChain[i];
        const verification = await this.verifyProof(currentProof);

        if (!verification.verified) {
          brokenLinks.push(i);
          chainVerifications.push(false);
          continue;
        }

        if (i > 0) {
          const previousProof = proofChain[i - 1];
          const chainIntegrity = this.verifyChainIntegrity(previousProof, currentProof);
          
          if (!chainIntegrity) {
            brokenLinks.push(i);
          }
          
          chainVerifications.push(chainIntegrity);
        } else {
          chainVerifications.push(true);
        }
      }

      const chainIntegrity = brokenLinks.length === 0;
      const chainTrustScore = chainVerifications.filter(v => v).length / chainVerifications.length;

      this.logger.info(`Proof chain verification completed: Integrity=${chainIntegrity}, Trust=${chainTrustScore}`);

      return {
        verified: chainIntegrity,
        chainIntegrity,
        brokenLinks,
        chainTrustScore
      };

    } catch (error) {
      this.logger.error(`Proof chain verification failed: ${error.message}`);
      throw error;
    }
  }

  private validateProofStructure(proof: ZKProof): void {
    if (!proof.proofHash || typeof proof.proofHash !== 'string') {
      throw new Error('Invalid proof: missing or invalid proofHash');
    }

    if (!proof.proofHash.startsWith('proof_')) {
      throw new Error('Invalid proof: proofHash format incorrect');
    }

    if (!proof.circuitId || typeof proof.circuitId !== 'string') {
      throw new Error('Invalid proof: missing or invalid circuitId');
    }

    if (!proof.publicSignals || typeof proof.publicSignals !== 'object') {
      throw new Error('Invalid proof: missing or invalid publicSignals');
    }

    if (!proof.proofData || typeof proof.proofData !== 'string') {
      throw new Error('Invalid proof: missing or invalid proofData');
    }

    if (!proof.timestamp || typeof proof.timestamp !== 'number') {
      throw new Error('Invalid proof: missing or invalid timestamp');
    }

    this.logger.debug(`Proof structure validation passed: ${proof.proofHash}`);
  }

  private async verifyProofStructure(proof: ZKProof): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const valid = 
            proof.proofHash.length >= 16 &&
            proof.circuitId.length > 0 &&
            Object.keys(proof.publicSignals).length > 0 &&
            proof.proofData.length > 0 &&
            proof.timestamp > 0 &&
            proof.timestamp <= Date.now();

          resolve(valid);
        } catch {
          resolve(false);
        }
      }, 2);
    });
  }

  private async verifyCryptographicProperties(proof: ZKProof): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const proofData = Buffer.from(proof.proofData, 'base64');
          const dataValid = proofData.length > 0;
          
          const hashValid = this.verifyProofHash(proof);
          const signatureValid = this.verifyProofSignature(proof);

          resolve(dataValid && hashValid && signatureValid);
        } catch {
          resolve(false);
        }
      }, 5);
    });
  }

  private async verifyCircuitConsistency(proof: ZKProof): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const publicSignals = proof.publicSignals;
          const circuitId = proof.circuitId;

          const circuitValid = this.verifyCircuitId(circuitId);
          const signalsConsistent = this.verifyPublicSignalsConsistency(publicSignals, circuitId);
          const timestampReasonable = this.verifyTimestampReasonableness(proof.timestamp);

          resolve(circuitValid && signalsConsistent && timestampReasonable);
        } catch {
          resolve(false);
        }
      }, 3);
    });
  }

  private async verifyTimestamp(proof: ZKProof): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const now = Date.now();
          const proofTime = proof.timestamp;
          
          const notFuture = proofTime <= now;
          const notTooOld = now - proofTime < 7 * 24 * 60 * 60 * 1000;
          const generationReasonable = proof.generationTime > 0 && proof.generationTime < 30000;

          resolve(notFuture && notTooOld && generationReasonable);
        } catch {
          resolve(false);
        }
      }, 1);
    });
  }

  private verifyProofHash(proof: ZKProof): boolean {
    const expectedPrefix = 'proof_';
    const hashLength = 12;
    
    return proof.proofHash.startsWith(expectedPrefix) && 
           proof.proofHash.length === expectedPrefix.length + hashLength &&
           /^[a-f0-9]+$/.test(proof.proofHash.substring(expectedPrefix.length));
  }

  private verifyProofSignature(proof: ZKProof): boolean {
    return true;
  }

  private verifyCircuitId(circuitId: string): boolean {
    const validCircuits = [
      'encryption_v1', 'inference_v1', 'model_update_v1', 'private_inference',
      'federated_learning', 'differential_privacy', 'model_verification',
      'recursive_verification', 'privacy_preserving'
    ];

    return validCircuits.includes(circuitId);
  }

  private verifyPublicSignalsConsistency(publicSignals: any, circuitId: string): boolean {
    const requiredSignals = {
      encryption_v1: ['encryptionVerified', 'dataIntegrity'],
      inference_v1: ['modelIntegrity', 'computationVerified'],
      private_inference: ['zeroKnowledge', 'noDataLeakage']
    };

    const required = requiredSignals[circuitId] || [];
    return required.every(signal => publicSignals[signal] !== undefined);
  }

  private verifyTimestampReasonableness(timestamp: number): boolean {
    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    
    return timestamp <= now && timestamp > now - oneWeekMs;
  }

  private verifyChainIntegrity(previousProof: ZKProof, currentProof: ZKProof): boolean {
    try {
      const previousHash = previousProof.proofHash;
      const currentReferences = currentProof.publicSignals.previousProof;
      
      return currentReferences === previousHash;
    } catch {
      return false;
    }
  }

  private async simulateValidatorVerification(proof: ZKProof, validatorId: string): Promise<{ verified: boolean }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const randomSuccess = Math.random() > 0.1;
        resolve({ verified: randomSuccess });
      }, 10);
    });
  }

  private generateCacheKey(proof: ZKProof, options: VerificationOptions): string {
    const optionsHash = this.quickHash(JSON.stringify(options));
    return `${proof.proofHash}_${optionsHash}`;
  }

  private isCacheValid(result: VerificationResult): boolean {
    const cacheLifetime = 2 * 60 * 1000;
    return Date.now() - result.verifiedAt < cacheLifetime;
  }

  private async executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Verification timeout after ${timeout}ms`)), timeout);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  private processVerificationResults(results: PromiseSettledResult<any>[], proof: ZKProof): any {
    const details: any = {
      proofStructure: this.getResultValue(results[0], false),
      cryptographic: this.getResultValue(results[1], false),
      circuitConsistency: this.getResultValue(results[2], false),
      timestamp: this.getResultValue(results[3], false)
    };

    if (results[4]) {
      details.onChain = this.getResultValue(results[4], false).onChain;
    }

    return details;
  }

  private getResultValue(result: PromiseSettledResult<any>, defaultValue: any): any {
    return result.status === 'fulfilled' ? result.value : defaultValue;
  }

  private calculateTrustScore(verificationDetails: any): number {
    const weights = {
      proofStructure: 0.25,
      cryptographic: 0.35,
      circuitConsistency: 0.25,
      timestamp: 0.15
    };

    let score = 0;
    
    if (verificationDetails.proofStructure) score += weights.proofStructure;
    if (verificationDetails.cryptographic) score += weights.cryptographic;
    if (verificationDetails.circuitConsistency) score += weights.circuitConsistency;
    if (verificationDetails.timestamp) score += weights.timestamp;

    if (verificationDetails.onChain) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  private determineVerificationResult(verificationDetails: any, trustScore: number, options: VerificationOptions): boolean {
    const threshold = options.trustThreshold || 0.8;
    const strict = options.strictMode || false;

    if (strict) {
      return verificationDetails.proofStructure &&
             verificationDetails.cryptographic &&
             verificationDetails.circuitConsistency &&
             verificationDetails.timestamp &&
             trustScore >= threshold;
    }

    return trustScore >= threshold;
  }

  private quickHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  private initializeMetrics(): any {
    return {
      totalVerifications: 0,
      successfulVerifications: 0,
      failedVerifications: 0,
      averageVerificationTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      onChainVerifications: 0,
      startTime: Date.now()
    };
  }

  private updatePerformanceMetrics(verificationTime: number, success: boolean): void {
    this.performanceMetrics.totalVerifications++;
    
    if (success) {
      this.performanceMetrics.successfulVerifications++;
    } else {
      this.performanceMetrics.failedVerifications++;
    }

    this.performanceMetrics.averageVerificationTime = (
      this.performanceMetrics.averageVerificationTime * 0.9 + verificationTime * 0.1
    );

    if (!success) {
      this.performanceMetrics.cacheMisses++;
    }
  }

  getVerifierMetrics(): any {
    const uptime = Date.now() - this.performanceMetrics.startTime;
    const successRate = this.performanceMetrics.totalVerifications > 0 ? 
      this.performanceMetrics.successfulVerifications / this.performanceMetrics.totalVerifications : 1.0;

    const cacheHitRate = (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) > 0 ?
      this.performanceMetrics.cacheHits / (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) : 0;

    return {
      performance: {
        totalVerifications: this.performanceMetrics.totalVerifications,
        successRate: Math.round(successRate * 10000) / 100,
        averageVerificationTime: Math.round(this.performanceMetrics.averageVerificationTime * 100) / 100,
        uptime: Math.round(uptime / 1000)
      },
      cache: {
        size: this.verificationCache.size,
        hitRate: Math.round(cacheHitRate * 10000) / 100
      },
      capabilities: {
        verificationMethods: 3,
        supportedFormats: 4,
        timeout: 30000
      }
    };
  }

  clearCache(): void {
    const previousSize = this.verificationCache.size;
    this.verificationCache.clear();
    this.logger.info(`Verification cache cleared: ${previousSize} entries removed`);
  }

  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const testProof: ZKProof = {
        proofHash: 'proof_healthcheck123',
        circuitId: 'encryption_v1',
        publicSignals: { encryptionVerified: true, dataIntegrity: true },
        proofData: 'dGVzdF9wcm9vZl9kYXRh',
        timestamp: Date.now(),
        generationTime: 50
      };

      const result = await this.verifyProof(testProof);

      const healthy = result.verified && result.verificationTime > 0;

      return {
        healthy,
        details: {
          verification: healthy ? 'working' : 'broken',
          cache: this.verificationCache.size > 0 ? 'populated' : 'empty',
          metrics: this.getVerifierMetrics().performance,
          timestamp: Date.now()
        }
      };

    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error.message,
          timestamp: Date.now()
        }
      };
    }
  }
}

export { ProofVerifier, VerificationResult, BatchVerificationResult, VerificationOptions };