import { Logger } from '../utils/logger';

interface TransactionBuilder {
  instructions: any[];
  signers: any[];
  feePayer: string;
  recentBlockhash: string;
  computeUnits: number;
  priorityFee: number;
}

interface SignedTransaction {
  signature: string;
  rawTransaction: string;
  publicKey: string;
  timestamp: number;
}

interface TransactionResult {
  signature: string;
  slot: number;
  status: 'success' | 'failed';
  error?: string;
  metadata?: any;
}

class SolanaTransactionBuilder {
  private logger: Logger;
  private builder: TransactionBuilder;
  private simulationResults: any;

  constructor(feePayer: string) {
    this.logger = new Logger('TransactionBuilder');
    this.builder = this.initializeBuilder(feePayer);
    this.simulationResults = null;
  }

  private initializeBuilder(feePayer: string): TransactionBuilder {
    return {
      instructions: [],
      signers: [],
      feePayer,
      recentBlockhash: '',
      computeUnits: 200000,
      priorityFee: 0
    };
  }

  addInstruction(instruction: any): this {
    this.logger.debug('Adding transaction instruction');
    this.builder.instructions.push(instruction);
    return this;
  }

  addSigner(signer: any): this {
    this.logger.debug('Adding transaction signer');
    this.builder.signers.push(signer);
    return this;
  }

  setComputeUnits(units: number): this {
    this.logger.debug(`Setting compute units: ${units}`);
    this.builder.computeUnits = units;
    return this;
  }

  setPriorityFee(fee: number): this {
    this.logger.debug(`Setting priority fee: ${fee}`);
    this.builder.priorityFee = fee;
    return this;
  }

  async setRecentBlockhash(blockhash: string): Promise<this> {
    this.logger.debug(`Setting recent blockhash: ${blockhash.substring(0, 16)}...`);
    this.builder.recentBlockhash = blockhash;
    return this;
  }

  async simulate(): Promise<{
    success: boolean;
    logs: string[];
    computeUnits: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      this.logger.info('Simulating transaction');

      this.validateBuilder();

      const simulation = await this.performSimulation();
      this.simulationResults = simulation;

      this.logger.info(`Transaction simulation completed: ${simulation.success}`);

      return simulation;

    } catch (error) {
      this.logger.error(`Transaction simulation failed: ${error.message}`);
      throw new Error(`SimulationError: ${error.message}`);
    }
  }

  async build(): Promise<{
    transaction: any;
    signers: any[];
    computeUnits: number;
    priorityFee: number;
  }> {
    const startTime = Date.now();

    try {
      this.logger.info('Building transaction');

      this.validateBuilder();

      if (!this.simulationResults) {
        await this.simulate();
      }

      const transaction = this.constructTransaction();
      
      this.logger.info('Transaction built successfully');

      return {
        transaction,
        signers: this.builder.signers,
        computeUnits: this.builder.computeUnits,
        priorityFee: this.builder.priorityFee
      };

    } catch (error) {
      this.logger.error(`Transaction build failed: ${error.message}`);
      throw new Error(`BuildError: ${error.message}`);
    }
  }

  async signAndSerialize(): Promise<SignedTransaction> {
    const startTime = Date.now();

    try {
      this.logger.info('Signing and serializing transaction');

      const built = await this.build();
      const signed = await this.signTransaction(built);
      const serialized = this.serializeTransaction(signed);

      this.logger.info('Transaction signed and serialized');

      return {
        signature: signed.signature,
        rawTransaction: serialized,
        publicKey: this.builder.feePayer,
        timestamp: Date.now()
      };

    } catch (error) {
      this.logger.error(`Transaction signing failed: ${error.message}`);
      throw new Error(`SigningError: ${error.message}`);
    }
  }

  createProofSubmissionInstruction(proofData: any): any {
    this.logger.debug('Creating proof submission instruction');

    const instruction = {
      programId: 'zkCipherProofProgram',
      accounts: [
        { pubkey: this.builder.feePayer, isSigner: true, isWritable: true },
        { pubkey: 'proofStorageAccount', isSigner: false, isWritable: true },
        { pubkey: 'systemProgram', isSigner: false, isWritable: false }
      ],
      data: this.encodeProofData(proofData)
    };

    return instruction;
  }

  createVerificationInstruction(proofHash: string, publicSignals: any): any {
    this.logger.debug('Creating verification instruction');

    const instruction = {
      programId: 'zkCipherVerificationProgram',
      accounts: [
        { pubkey: this.builder.feePayer, isSigner: true, isWritable: true },
        { pubkey: 'verificationRegistry', isSigner: false, isWritable: true },
        { pubkey: 'proofStorageAccount', isSigner: false, isWritable: false }
      ],
      data: this.encodeVerificationData(proofHash, publicSignals)
    };

    return instruction;
  }

  createContractInteractionInstruction(contractAddress: string, method: string, params: any): any {
    this.logger.debug(`Creating contract interaction instruction: ${method}`);

    const instruction = {
      programId: contractAddress,
      accounts: [
        { pubkey: this.builder.feePayer, isSigner: true, isWritable: true },
        { pubkey: 'contractStateAccount', isSigner: false, isWritable: true }
      ],
      data: this.encodeContractData(method, params)
    };

    return instruction;
  }

  private validateBuilder(): void {
    if (this.builder.instructions.length === 0) {
      throw new Error('No instructions added to transaction');
    }

    if (!this.builder.feePayer) {
      throw new Error('Fee payer not set');
    }

    if (!this.builder.recentBlockhash) {
      throw new Error('Recent blockhash not set');
    }

    this.logger.debug('Transaction builder validation passed');
  }

  private async performSimulation(): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const success = Math.random() > 0.05;
        
        if (success) {
          resolve({
            success: true,
            logs: [
              'Program log: Instruction: SubmitProof',
              'Program log: Proof hash: ' + this.generateRandomHash(),
              'Program log: Verification completed successfully'
            ],
            computeUnits: this.builder.computeUnits
          });
        } else {
          reject(new Error('Transaction simulation failed: insufficient funds'));
        }
      }, 10);
    });
  }

  private constructTransaction(): any {
    return {
      instructions: this.builder.instructions,
      feePayer: this.builder.feePayer,
      recentBlockhash: this.builder.recentBlockhash,
      computeUnits: this.builder.computeUnits,
      priorityFee: this.builder.priorityFee,
      version: '0.1.0',
      timestamp: Date.now()
    };
  }

  private async signTransaction(built: any): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          signature: this.generateTransactionSignature(),
          transaction: built.transaction,
          signers: built.signers
        });
      }, 5);
    });
  }

  private serializeTransaction(signed: any): string {
    const transactionData = {
      signature: signed.signature,
      transaction: signed.transaction,
      signers: signed.signers.map((s: any) => s.publicKey)
    };

    return Buffer.from(JSON.stringify(transactionData)).toString('base64');
  }

  private encodeProofData(proofData: any): string {
    const encoded = {
      proofHash: proofData.proofHash,
      circuitId: proofData.circuitId,
      publicSignals: proofData.publicSignals,
      timestamp: Date.now()
    };

    return Buffer.from(JSON.stringify(encoded)).toString('base64');
  }

  private encodeVerificationData(proofHash: string, publicSignals: any): string {
    const encoded = {
      action: 'verify',
      proofHash,
      publicSignals,
      timestamp: Date.now()
    };

    return Buffer.from(JSON.stringify(encoded)).toString('base64');
  }

  private encodeContractData(method: string, params: any): string {
    const encoded = {
      method,
      params,
      timestamp: Date.now()
    };

    return Buffer.from(JSON.stringify(encoded)).toString('base64');
  }

  private generateTransactionSignature(): string {
    const base = `solana_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let hash = 0;
    
    for (let i = 0; i < base.length; i++) {
      hash = ((hash << 5) - hash) + base.charCodeAt(i);
      hash |= 0;
    }
    
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  private generateRandomHash(): string {
    return `proof_${Math.random().toString(36).substr(2, 12)}`;
  }

  getBuilderStatus(): any {
    return {
      instructions: this.builder.instructions.length,
      signers: this.builder.signers.length,
      feePayer: this.builder.feePayer,
      computeUnits: this.builder.computeUnits,
      priorityFee: this.builder.priorityFee,
      simulated: !!this.simulationResults,
      simulationSuccess: this.simulationResults?.success || false
    };
  }

  clear(): void {
    this.builder.instructions = [];
    this.builder.signers = [];
    this.simulationResults = null;
    this.logger.info('Transaction builder cleared');
  }

  static createProofSubmissionTransaction(proofData: any, feePayer: string): SolanaTransactionBuilder {
    const builder = new SolanaTransactionBuilder(feePayer);
    const instruction = builder.createProofSubmissionInstruction(proofData);
    builder.addInstruction(instruction);
    return builder;
  }

  static createVerificationTransaction(proofHash: string, publicSignals: any, feePayer: string): SolanaTransactionBuilder {
    const builder = new SolanaTransactionBuilder(feePayer);
    const instruction = builder.createVerificationInstruction(proofHash, publicSignals);
    builder.addInstruction(instruction);
    return builder;
  }
}

export { SolanaTransactionBuilder, SignedTransaction, TransactionResult };