import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Logger } from '../utils/logger';

export interface ZkCipherConfig {
  environment: 'development' | 'staging' | 'production';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  performanceMonitoring: boolean;
  cacheEnabled: boolean;
  network: {
    solana: {
      cluster: 'mainnet-beta' | 'devnet' | 'testnet';
      rpcUrl: string;
      commitment: 'processed' | 'confirmed' | 'finalized';
    };
    cipher: {
      endpoint: string;
      timeout: number;
      retryAttempts: number;
    };
  };
  security: {
    keyRotation: boolean;
    sessionTimeout: number;
    maxConcurrentOperations: number;
    encryption: {
      algorithm: 'aes-256-gcm';
      keyLength: number;
      ivLength: number;
      tagLength: number;
    };
  };
  ai: {
    model: {
      default: string;
      version: string;
      cacheSize: number;
    };
    inference: {
      timeout: number;
      maxTokens: number;
    };
  };
  cipherEngine: {
    version: string;
    payloadFormat: 'v0.1';
    compression: boolean;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export type LogCallback = (message: string) => void;

const DEFAULT_CONFIG: ZkCipherConfig = {
  environment: 'development',
  logLevel: 'info',
  performanceMonitoring: true,
  cacheEnabled: true,
  network: {
    solana: {
      cluster: 'devnet',
      rpcUrl: 'https://api.devnet.solana.com',
      commitment: 'confirmed'
    },
    cipher: {
      endpoint: 'https://cipher.zkcipher.ai/api/v1',
      timeout: 30000,
      retryAttempts: 3
    }
  },
  security: {
    keyRotation: true,
    sessionTimeout: 3600000,
    maxConcurrentOperations: 100,
    encryption: {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
      tagLength: 16
    }
  },
  ai: {
    model: {
      default: 'zkcipher-default',
      version: '1.0.0',
      cacheSize: 1000
    },
    inference: {
      timeout: 60000,
      maxTokens: 4096
    }
  },
  cipherEngine: {
    version: 'v0.1',
    payloadFormat: 'v0.1',
    compression: true
  }
};

export class UnifiedConfigLoader {
  private config: ZkCipherConfig;
  private onLogCallback: LogCallback | null;

  constructor() {
    this.config = DEFAULT_CONFIG;
    this.onLogCallback = null;
  }

  // Set log callback for debugging
  onLog(callback: LogCallback): void {
    this.onLogCallback = callback;
    this.log('Log callback registered');
  }

  // Load configuration with proper precedence
  loadConfig(): ZkCipherConfig {
    this.log('Starting configuration load...');
    
    // Load base JSON config
    const baseConfig = this.loadEnvironmentJson();
    this.log('Loaded base environment configuration');
    
    // Overlay .env variables
    const envConfig = this.loadEnvConfig();
    const mergedWithEnv = this.mergeConfigs(baseConfig, envConfig);
    this.log('Merged environment variables');
    
    // Overlay CLI flags
    const cliConfig = this.parseCliFlags();
    const finalConfig = this.mergeConfigs(mergedWithEnv, cliConfig);
    this.log('Merged CLI flags');
    
    this.config = finalConfig;
    
    // Validate final config
    const validation = this.validateConfig(this.config);
    if (!validation.valid) {
      this.log('Configuration validation failed: ' + validation.errors.join(', '));
    } else {
      this.log('Configuration validation passed');
    }
    
    this.log(`Final config: network=${this.config.network.solana.cluster}, cipher=${this.config.security.encryption.algorithm}, model=${this.config.ai.model.default}`);
    
    return this.config;
  }

  // Simple value resolver - if override exists, return override else fallback to base
  resolveValue<T>(base: T, override: T | undefined): T {
    return override !== undefined ? override : base;
  }

  // Validate configuration
  validateConfig(config: ZkCipherConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.network) {
      errors.push('Network configuration missing');
    } else {
      if (!config.network.solana?.cluster) {
        errors.push('Solana cluster missing');
      }
      if (!config.network.cipher?.endpoint) {
        errors.push('Cipher endpoint missing');
      }
    }

    if (!config.security?.encryption?.algorithm) {
      errors.push('Cipher algorithm missing');
    }

    if (!config.ai?.model?.default) {
      errors.push('AI model missing');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Get config value by key path
  get(key: string): any {
    const keys = key.split('.');
    let value: any = this.config;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  // Reload configuration
  reload(): ZkCipherConfig {
    this.log('Reloading configuration...');
    return this.loadConfig();
  }

  // Get full config object
  getConfig(): ZkCipherConfig {
    return this.config;
  }

  // Load environment.json from config directory
  private loadEnvironmentJson(): ZkCipherConfig {
    const configPaths = [
      join(process.cwd(), 'config', 'environment.json'),
      join(process.cwd(), 'environment.json'),
      join(__dirname, '..', '..', 'config', 'environment.json')
    ];

    for (const configPath of configPaths) {
      try {
        if (existsSync(configPath)) {
          this.log(`Loading environment config from: ${configPath}`);
          const configContent = readFileSync(configPath, 'utf8');
          const config = JSON.parse(configContent);
          return this.mergeConfigs(DEFAULT_CONFIG, config);
        }
      } catch (error) {
        this.log(`Failed to load config from ${configPath}: ${error.message}`);
      }
    }

    this.log('No environment.json found, using defaults');
    return DEFAULT_CONFIG;
  }

  // Load environment variables
  private loadEnvConfig(): Partial<ZkCipherConfig> {
    const envConfig: Partial<ZkCipherConfig> = {};

    // Environment
    if (process.env.ENVIRONMENT) {
      envConfig.environment = process.env.ENVIRONMENT as any;
    }

    // Log level
    if (process.env.LOG_LEVEL) {
      envConfig.logLevel = process.env.LOG_LEVEL as any;
    }

    // Network
    if (process.env.SOLANA_CLUSTER) {
      envConfig.network = {
        solana: {
          cluster: process.env.SOLANA_CLUSTER as any,
          rpcUrl: process.env.SOLANA_RPC_URL || DEFAULT_CONFIG.network.solana.rpcUrl,
          commitment: (process.env.SOLANA_COMMITMENT as any) || DEFAULT_CONFIG.network.solana.commitment
        },
        cipher: {
          endpoint: process.env.CIPHER_ENDPOINT || DEFAULT_CONFIG.network.cipher.endpoint,
          timeout: parseInt(process.env.CIPHER_TIMEOUT || DEFAULT_CONFIG.network.cipher.timeout.toString()),
          retryAttempts: parseInt(process.env.CIPHER_RETRIES || DEFAULT_CONFIG.network.cipher.retryAttempts.toString())
        }
      };
    }

    // AI Model
    if (process.env.AI_MODEL) {
      envConfig.ai = {
        model: {
          default: process.env.AI_MODEL,
          version: process.env.AI_MODEL_VERSION || DEFAULT_CONFIG.ai.model.version,
          cacheSize: parseInt(process.env.AI_CACHE_SIZE || DEFAULT_CONFIG.ai.model.cacheSize.toString())
        },
        inference: {
          timeout: parseInt(process.env.AI_TIMEOUT || DEFAULT_CONFIG.ai.inference.timeout.toString()),
          maxTokens: parseInt(process.env.AI_MAX_TOKENS || DEFAULT_CONFIG.ai.inference.maxTokens.toString())
        }
      };
    }

    return envConfig;
  }

  // Parse CLI flags from process.argv
  private parseCliFlags(): Partial<ZkCipherConfig> {
    const cliConfig: Partial<ZkCipherConfig> = {};
    const args = process.argv.slice(2);

    for (const arg of args) {
      if (arg.startsWith('--network=')) {
        const network = arg.split('=')[1];
        if (['devnet', 'mainnet', 'testnet'].includes(network)) {
          cliConfig.network = {
            solana: {
              cluster: network as any,
              rpcUrl: DEFAULT_CONFIG.network.solana.rpcUrl,
              commitment: DEFAULT_CONFIG.network.solana.commitment
            },
            cipher: DEFAULT_CONFIG.network.cipher
          };
        }
      } else if (arg.startsWith('--cipher=')) {
        const cipher = arg.split('=')[1];
        if (['aes', 'zk'].includes(cipher)) {
          cliConfig.security = {
            ...DEFAULT_CONFIG.security,
            encryption: {
              ...DEFAULT_CONFIG.security.encryption,
              algorithm: cipher === 'zk' ? 'aes-256-gcm' : 'aes-256-gcm'
            }
          };
        }
      } else if (arg.startsWith('--model=')) {
        const model = arg.split('=')[1];
        if (['risknet', 'privnet'].includes(model)) {
          cliConfig.ai = {
            model: {
              default: model,
              version: DEFAULT_CONFIG.ai.model.version,
              cacheSize: DEFAULT_CONFIG.ai.model.cacheSize
            },
            inference: DEFAULT_CONFIG.ai.inference
          };
        }
      }
    }

    return cliConfig;
  }

  // Deep merge configuration objects
  private mergeConfigs(defaults: ZkCipherConfig, overrides: Partial<ZkCipherConfig>): ZkCipherConfig {
    const merged = { ...defaults, ...overrides };

    // Deep merge nested objects
    if (overrides.network) {
      merged.network = {
        ...defaults.network,
        ...overrides.network,
        solana: {
          ...defaults.network.solana,
          ...overrides.network.solana
        },
        cipher: {
          ...defaults.network.cipher,
          ...overrides.network.cipher
        }
      };
    }

    if (overrides.security) {
      merged.security = {
        ...defaults.security,
        ...overrides.security,
        encryption: {
          ...defaults.security.encryption,
          ...overrides.security.encryption
        }
      };
    }

    if (overrides.ai) {
      merged.ai = {
        ...defaults.ai,
        ...overrides.ai,
        model: {
          ...defaults.ai.model,
          ...overrides.ai.model
        },
        inference: {
          ...defaults.ai.inference,
          ...overrides.ai.inference
        }
      };
    }

    if (overrides.cipherEngine) {
      merged.cipherEngine = {
        ...defaults.cipherEngine,
        ...overrides.cipherEngine
      };
    }

    return merged;
  }

  // Internal logging
  private log(message: string): void {
    if (this.onLogCallback) {
      this.onLogCallback(`[UnifiedConfigLoader] ${message}`);
    }
  }
}

// Default instance
export const unifiedConfigLoader = new UnifiedConfigLoader();
export const config = unifiedConfigLoader.loadConfig();