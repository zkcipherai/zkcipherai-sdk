import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Logger } from '../utils/logger';

/**
 * Unified Configuration Interface for zkCipherAI SDK
 */
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

/**
 * Default configuration values
 */
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

/**
 * Configuration Loader for zkCipherAI SDK
 */
export class ConfigLoader {
  private static logger = new Logger('ConfigLoader');
  private static config: ZkCipherConfig | null = null;
  private static configPaths = [
    'zkcipher.config.json',
    '.zkcipherrc',
    join(process.cwd(), 'zkcipher.config.json'),
    join(process.cwd(), '.zkcipherrc'),
    join(process.cwd(), 'config', 'zkcipher.config.json')
  ];

  /**
   * Load configuration from file or use defaults
   * Never throws - always returns valid config object
   */
  static load(): ZkCipherConfig {
    if (this.config) {
      return this.config;
    }

    try {
      const fileConfig = this.loadConfigFile();
      this.config = this.mergeConfigs(DEFAULT_CONFIG, fileConfig);
      
      this.validateConfig(this.config);
      this.logConfigLoad(this.config);
      
      return this.config;
    } catch (error) {
      this.logger.warn(`Failed to load config file, using defaults: ${error.message}`);
      this.config = DEFAULT_CONFIG;
      return this.config;
    }
  }

  /**
   * Attempt to load configuration from various file locations
   */
  private static loadConfigFile(): Partial<ZkCipherConfig> {
    for (const configPath of this.configPaths) {
      try {
        if (existsSync(configPath)) {
          this.logger.debug(`Loading config from: ${configPath}`);
          const configContent = readFileSync(configPath, 'utf8');
          const config = JSON.parse(configContent);
          
          if (this.isValidConfig(config)) {
            this.logger.info(`Configuration loaded successfully from: ${configPath}`);
            return config;
          } else {
            this.logger.warn(`Invalid configuration in: ${configPath}`);
          }
        }
      } catch (error) {
        this.logger.debug(`Failed to load config from ${configPath}: ${error.message}`);
      }
    }

    this.logger.info('No config file found, using defaults');
    return {};
  }

  /**
   * Merge user config with defaults (deep merge)
   */
  private static mergeConfigs(defaults: ZkCipherConfig, userConfig: Partial<ZkCipherConfig>): ZkCipherConfig {
    const merged = { ...defaults, ...userConfig };
    
    // Deep merge for nested objects
    if (userConfig.network) {
      merged.network = {
        ...defaults.network,
        ...userConfig.network,
        solana: {
          ...defaults.network.solana,
          ...userConfig.network?.solana
        },
        cipher: {
          ...defaults.network.cipher,
          ...userConfig.network?.cipher
        }
      };
    }

    if (userConfig.security) {
      merged.security = {
        ...defaults.security,
        ...userConfig.security,
        encryption: {
          ...defaults.security.encryption,
          ...userConfig.security?.encryption
        }
      };
    }

    if (userConfig.ai) {
      merged.ai = {
        ...defaults.ai,
        ...userConfig.ai,
        model: {
          ...defaults.ai.model,
          ...userConfig.ai?.model
        },
        inference: {
          ...defaults.ai.inference,
          ...userConfig.ai?.inference
        }
      };
    }

    if (userConfig.cipherEngine) {
      merged.cipherEngine = {
        ...defaults.cipherEngine,
        ...userConfig.cipherEngine
      };
    }

    return merged;
  }

  /**
   * Basic configuration validation
   */
  private static isValidConfig(config: any): boolean {
    if (typeof config !== 'object' || config === null) {
      return false;
    }

    // Validate required top-level fields
    if (config.environment && !['development', 'staging', 'production'].includes(config.environment)) {
      return false;
    }

    if (config.logLevel && !['debug', 'info', 'warn', 'error'].includes(config.logLevel)) {
      return false;
    }

    return true;
  }

  /**
   * Enhanced validation with warnings
   */
  private static validateConfig(config: ZkCipherConfig): void {
    // Environment-specific validations
    if (config.environment === 'production') {
      if (config.network.solana.cluster !== 'mainnet-beta') {
        this.logger.warn('Production environment should use mainnet-beta cluster');
      }
      
      if (config.security.maxConcurrentOperations > 1000) {
        this.logger.warn('High maxConcurrentOperations in production may cause performance issues');
      }
    }

    // Security validations
    if (config.security.sessionTimeout < 300000) { // 5 minutes
      this.logger.warn('Very short session timeout may impact user experience');
    }

    // Performance validations
    if (!config.cacheEnabled && config.performanceMonitoring) {
      this.logger.warn('Performance monitoring enabled but cache disabled');
    }
  }

  /**
   * Log configuration load event
   */
  private static logConfigLoad(config: ZkCipherConfig): void {
    this.logger.info(`Configuration loaded - Environment: ${config.environment}, Log Level: ${config.logLevel}`);
    this.logger.debug(`Network: ${config.network.solana.cluster}, AI Model: ${config.ai.model.default}`);
    
    if (config.environment === 'development') {
      this.logger.debug('Development mode - enhanced logging and debugging enabled');
    }
  }

  /**
   * Get current configuration (reloads if not already loaded)
   */
  static getConfig(): ZkCipherConfig {
    return this.load();
  }

  /**
   * Clear cached configuration (for testing)
   */
  static clearCache(): void {
    this.config = null;
    this.logger.debug('Configuration cache cleared');
  }
}

// Export default instance
export const config = ConfigLoader.load();