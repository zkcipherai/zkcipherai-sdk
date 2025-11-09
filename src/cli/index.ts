#!/usr/bin/env node

import { Command } from 'commander';
import { decryptEffect } from './decryptEffect';
import { 
  encryptAction, 
  decryptAction, 
  generateProofAction, 
  verifyProofAction,
  syncAIModelAction,
  solanaVerifyAction,
  initProjectAction,
  statusAction
} from './actions';
import { Logger } from '../utils/logger';

class zkCipherCLI {
  private program: Command;
  private logger: Logger;

  constructor() {
    this.program = new Command();
    this.logger = new Logger('CLI');
    this.setupCLI();
  }

  private setupCLI(): void {
    this.program
      .name('zkcipher')
      .description('🧠 zkCipherAI SDK - Privacy × Encryption × Artificial Intelligence × Solana')
      .version('1.0.0', '-v, --version', 'Display SDK version')
      .option('--debug', 'Enable debug mode')
      .option('--silent', 'Suppress all output except results')
      .hook('preAction', (thisCommand, actionCommand) => {
        const options = thisCommand.opts();
        if (!options.silent) {
          decryptEffect();
        }
        if (options.debug) {
          process.env.DEBUG = 'true';
          this.logger.debug('Debug mode enabled');
        }
      });

    this.setupCommands();
  }

  private setupCommands(): void {
    this.program
      .command('init')
      .description('Initialize a new zkCipherAI project')
      .option('-d, --dir <directory>', 'Project directory', './zkcipher-project')
      .option('--template <template>', 'Project template (basic|advanced|enterprise)', 'basic')
      .action(initProjectAction);

    this.program
      .command('encrypt')
      .description('Encrypt data with zero-knowledge proofs')
      .requiredOption('-d, --data <data>', 'Data to encrypt (string or file path)')
      .option('-o, --output <file>', 'Output file for encrypted data')
      .option('--level <level>', 'Encryption level (basic|medium|high|maximum)', 'high')
      .option('--compress', 'Enable compression', true)
      .action(encryptAction);

    this.program
      .command('decrypt')
      .description('Decrypt previously encrypted data')
      .requiredOption('-i, --input <file>', 'Input file with encrypted data')
      .requiredOption('-k, --key <keyId>', 'Decryption key ID')
      .option('--iv <iv>', 'Initialization vector (hex)')
      .option('--tag <tag>', 'Authentication tag (hex)')
      .action(decryptAction);

    this.program
      .command('proof')
      .description('Generate zero-knowledge proofs')
      .requiredOption('-d, --data <data>', 'Data to prove')
      .option('-t, --type <type>', 'Proof type (inference|encryption|model_update|privacy)', 'inference')
      .option('-o, --output <file>', 'Output file for proof')
      .option('--batch', 'Enable batch proof generation')
      .action(generateProofAction);

    this.program
      .command('verify')
      .description('Verify zero-knowledge proofs')
      .requiredOption('-p, --proof <file>', 'Proof file to verify')
      .option('--on-chain', 'Verify proof on Solana blockchain')
      .option('--tx <transaction>', 'Solana transaction hash for on-chain verification')
      .action(verifyProofAction);

    this.program
      .command('sync-ai')
      .description('Synchronize AI models with privacy')
      .requiredOption('-m, --model <modelId>', 'AI model identifier')
      .option('--weights <file>', 'Model weights file')
      .option('--privacy <level>', 'Privacy level (basic|medium|high|maximum)', 'high')
      .option('--federated', 'Use federated learning approach')
      .action(syncAIModelAction);

    this.program
      .command('solana-verify')
      .description('Verify proofs on Solana blockchain')
      .requiredOption('-p, --proof <proofHash>', 'Proof hash to verify')
      .option('--network <network>', 'Solana network (mainnet|devnet|testnet)', 'devnet')
      .option('--rpc <url>', 'Custom RPC endpoint')
      .action(solanaVerifyAction);

    this.program
      .command('status')
      .description('Check zkCipherAI system status')
      .option('--components', 'Show detailed component status')
      .option('--metrics', 'Show performance metrics')
      .action(statusAction);

    this.program
      .command('keygen')
      .description('Generate encryption keys')
      .option('--type <type>', 'Key type (session|master|ephemeral)', 'session')
      .option('--lifetime <ms>', 'Key lifetime in milliseconds', '3600000')
      .option('--output <file>', 'Output file for generated key')
      .action(this.keygenAction.bind(this));

    this.program
      .command('health')
      .description('Run comprehensive health check')
      .option('--full', 'Run full diagnostic check')
      .option('--fix', 'Attempt to fix detected issues')
      .action(this.healthAction.bind(this));

    this.setupHelp();
  }

  private setupHelp(): void {
    this.program.addHelpText('after', `

Examples:
  $ zkcipher init --template advanced
  $ zkcipher encrypt --data "sensitive information" --level maximum
  $ zkcipher proof --data inference_result.json --type inference
  $ zkcipher solana-verify --proof proof_abc123 --network mainnet

Environment Variables:
  ZKCIPHER_RPC_URL      Solana RPC endpoint
  ZKCIPHER_LOG_LEVEL    Log level (debug, info, warn, error)
  ZKCIPHER_KEYSTORE     Path to key storage directory
    `);
  }

  private async keygenAction(options: any): Promise<void> {
    const { KeyVault } = await import('../cipher/keyVault');
    const keyVault = new KeyVault();
    
    try {
      this.logger.info('Generating encryption key...');
      
      const sessionKey = await keyVault.generateSessionKey({
        keyLifetime: parseInt(options.lifetime),
        purpose: options.type
      });

      const keyInfo = {
        keyId: sessionKey.keyId,
        type: options.type,
        generated: new Date().toISOString(),
        expires: new Date(sessionKey.expiresAt).toISOString(),
        usageLimit: sessionKey.usageLimit,
        derivationPath: sessionKey.derivationPath
      };

      if (options.output) {
        const fs = await import('fs');
        fs.writeFileSync(options.output, JSON.stringify(keyInfo, null, 2));
        this.logger.success(`Key saved to: ${options.output}`);
      } else {
        console.log(JSON.stringify(keyInfo, null, 2));
      }

      this.logger.success(`Key generated: ${sessionKey.keyId}`);

    } catch (error) {
      this.logger.error(`Key generation failed: ${error.message}`);
      process.exit(1);
    }
  }

  private async healthAction(options: any): Promise<void> {
    const { zkCipherClient } = await import('../sdk/zkCipherClient');
    const client = new zkCipherClient();
    
    try {
      this.logger.info('Running health check...');
      
      const health = await client.healthCheck();
      
      if (health.overallHealthy) {
        this.logger.success('System health: EXCELLENT');
      } else {
        this.logger.warn('System health: DEGRADED');
      }

      console.log('\nComponent Status:');
      Object.entries(health.components).forEach(([component, status]) => {
        const icon = status.healthy ? '✅' : '❌';
        console.log(`  ${icon} ${component}: ${status.healthy ? 'HEALTHY' : 'DEGRADED'}`);
        if (!status.healthy && status.message) {
          console.log(`     ${status.message}`);
        }
      });

      if (options.full) {
        console.log('\nDetailed Metrics:');
        console.log(JSON.stringify(health.metrics, null, 2));
      }

      if (options.fix && !health.overallHealthy) {
        this.logger.info('Attempting to fix issues...');
        await client.repairSystem();
        this.logger.success('Repair operations completed');
      }

    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      process.exit(1);
    }
  }

  async run(argv: string[]): Promise<void> {
    try {
      await this.program.parseAsync(argv);
    } catch (error) {
      this.logger.error(`CLI execution failed: ${error.message}`);
      process.exit(1);
    }
  }
}

const cli = new zkCipherCLI();
cli.run(process.argv).catch(console.error);

export { zkCipherCLI };