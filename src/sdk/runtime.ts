import { Logger } from '../utils/logger';
import { KeyVault } from '../cipher/keyVault';
import { CipherEncryptor } from '../cipher/encryptor';
import { CipherDecryptor } from '../cipher/decryptor';
import { ProofGenerator } from '../proof/generator';
import { ProofVerifier } from '../proof/verifier';
import { ModelSync } from '../ai/modelSync';
import { SolanaClient } from '../solana/client';
import { ConfigLoader, ZkCipherConfig } from '../config/config';

interface RuntimeConfig {
  environment: 'development' | 'staging' | 'production';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  performanceMonitoring: boolean;
  cacheEnabled: boolean;
  security: {
    keyRotation: boolean;
    sessionTimeout: number;
    maxConcurrentOperations: number;
  };
}

interface RuntimeMetrics {
  uptime: number;
  memoryUsage: number;
  activeOperations: number;
  totalOperations: number;
  errorRate: number;
  performance: any;
}

class Runtime {
  private logger: Logger;
  private config: ZkCipherConfig;
  private components: Map<string, any>;
  private metrics: RuntimeMetrics;
  private startTime: number;
  private isInitialized: boolean;

  constructor(config: Partial<RuntimeConfig> = {}) {
    this.logger = new Logger('Runtime');
    
    // Load unified configuration
    this.config = ConfigLoader.load();
    
    // Merge with runtime-specific config
    this.mergeRuntimeConfig(config);
    
    this.components = new Map();
    this.metrics = this.initializeMetrics();
    this.startTime = Date.now();
    this.isInitialized = false;
    
    this.logger.info('Runtime initialized with unified configuration');
  }

  private mergeRuntimeConfig(runtimeConfig: Partial<RuntimeConfig>): void {
    // Update log level if provided
    if (runtimeConfig.logLevel) {
      this.config.logLevel = runtimeConfig.logLevel;
    }

    // Merge security settings
    if (runtimeConfig.security) {
      this.config.security = {
        ...this.config.security,
        ...runtimeConfig.security
      };
    }

    // Merge other runtime-specific settings
    if (runtimeConfig.performanceMonitoring !== undefined) {
      this.config.performanceMonitoring = runtimeConfig.performanceMonitoring;
    }

    if (runtimeConfig.cacheEnabled !== undefined) {
      this.config.cacheEnabled = runtimeConfig.cacheEnabled;
    }
  }

  private initializeConfig(config: Partial<RuntimeConfig>): RuntimeConfig {
    return {
      environment: 'development',
      logLevel: 'info',
      performanceMonitoring: true,
      cacheEnabled: true,
      security: {
        keyRotation: true,
        sessionTimeout: 3600000,
        maxConcurrentOperations: 100,
        ...config.security
      },
      ...config
    };
  }

  private initializeMetrics(): RuntimeMetrics {
    return {
      uptime: 0,
      memoryUsage: 0,
      activeOperations: 0,
      totalOperations: 0,
      errorRate: 0,
      performance: {
        encryption: { count: 0, averageTime: 0 },
        decryption: { count: 0, averageTime: 0 },
        proofGeneration: { count: 0, averageTime: 0 },
        proofVerification: { count: 0, averageTime: 0 }
      }
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Runtime already initialized');
      return;
    }

    this.logger.info('Initializing zkCipherAI Runtime Environment');

    try {
      await this.initializeCoreComponents();
      await this.initializeSecurityInfrastructure();
      await this.initializePerformanceMonitoring();

      this.isInitialized = true;
      this.startTime = Date.now();

      this.logger.success('Runtime initialization completed successfully');
      this.logRuntimeStatus();

    } catch (error) {
      this.logger.error(`Runtime initialization failed: ${error.message}`);
      throw new Error(`RuntimeInitializationError: ${error.message}`);
    }
  }

  private async initializeCoreComponents(): Promise<void> {
    this.logger.debug('Initializing core components');

    this.components.set('keyVault', new KeyVault());
    this.components.set('encryptor', new CipherEncryptor());
    this.components.set('decryptor', new CipherDecryptor());
    this.components.set('proofGenerator', new ProofGenerator());
    this.components.set('proofVerifier', new ProofVerifier());
    this.components.set('modelSync', new ModelSync());
    this.components.set('solanaClient', new SolanaClient());

    this.logger.debug('Core components initialized');
  }

  private async initializeSecurityInfrastructure(): Promise<void> {
    this.logger.debug('Initializing security infrastructure');

    const keyVault = this.components.get('keyVault') as KeyVault;
    
    if (this.config.security.keyRotation) {
      await keyVault.rotateMasterKey();
      this.logger.debug('Master key rotation completed');
    }

    this.logger.debug('Security infrastructure initialized');
  }

  private async initializePerformanceMonitoring(): Promise<void> {
    if (!this.config.performanceMonitoring) {
      return;
    }

    this.logger.debug('Initializing performance monitoring');

    setInterval(() => {
      this.updateRuntimeMetrics();
    }, 30000);

    this.logger.debug('Performance monitoring initialized');
  }

  /**
   * Get network configuration
   */
  getNetwork(): ZkCipherConfig['network'] {
    return this.config.network;
  }

  /**
   * Get cipher engine settings
   */
  getCipherSettings(): ZkCipherConfig['security']['encryption'] & ZkCipherConfig['cipherEngine'] {
    return {
      ...this.config.security.encryption,
      ...this.config.cipherEngine
    };
  }

  /**
   * Get AI model configuration
   */
  getModel(): ZkCipherConfig['ai']['model'] {
    return this.config.ai.model;
  }

  /**
   * Get complete configuration
   */
  getConfig(): ZkCipherConfig {
    return this.config;
  }

  getComponent<T>(componentName: string): T {
    if (!this.components.has(componentName)) {
      throw new Error(`Component not found: ${componentName}`);
    }

    return this.components.get(componentName) as T;
  }

  registerComponent(componentName: string, component: any): void {
    if (this.components.has(componentName)) {
      this.logger.warn(`Overwriting existing component: ${componentName}`);
    }

    this.components.set(componentName, component);
    this.logger.debug(`Component registered: ${componentName}`);
  }

  async executeOperation<T>(
    operation: string,
    executor: () => Promise<T>,
    timeout: number = 30000
  ): Promise<T> {
    if (!this.isInitialized) {
      throw new Error('Runtime not initialized');
    }

    if (this.metrics.activeOperations >= this.config.security.maxConcurrentOperations) {
      throw new Error('Maximum concurrent operations reached');
    }

    this.metrics.activeOperations++;
    this.metrics.totalOperations++;

    const startTime = Date.now();

    try {
      const result = await this.executeWithTimeout(executor, timeout);
      
      this.updateOperationMetrics(operation, Date.now() - startTime, true);
      this.metrics.activeOperations--;

      return result;

    } catch (error) {
      this.updateOperationMetrics(operation, Date.now() - startTime, false);
      this.metrics.activeOperations--;
      
      this.logger.error(`Operation failed: ${operation} - ${error.message}`);
      throw error;
    }
  }

  private async executeWithTimeout<T>(executor: () => Promise<T>, timeout: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timeout after ${timeout}ms`)), timeout);
    });

    return Promise.race([executor(), timeoutPromise]);
  }

  private updateOperationMetrics(operation: string, duration: number, success: boolean): void {
    if (!this.config.performanceMonitoring) {
      return;
    }

    const opMetrics = this.metrics.performance[operation];
    if (opMetrics) {
      opMetrics.count++;
      opMetrics.averageTime = (opMetrics.averageTime * 0.9) + (duration * 0.1);
    }

    if (!success) {
      this.metrics.errorRate = (this.metrics.errorRate * 0.9) + 0.1;
    }
  }

  private updateRuntimeMetrics(): void {
    this.metrics.uptime = Date.now() - this.startTime;
    
    if (typeof process !== 'undefined' && process.memoryUsage) {
      this.metrics.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    }

    this.logger.debug(`Runtime metrics updated - Uptime: ${Math.round(this.metrics.uptime / 1000)}s, Memory: ${this.metrics.memoryUsage.toFixed(2)}MB`);
  }

  getRuntimeStatus(): {
    initialized: boolean;
    config: ZkCipherConfig;
    metrics: RuntimeMetrics;
    components: string[];
  } {
    return {
      initialized: this.isInitialized,
      config: this.config,
      metrics: this.metrics,
      components: Array.from(this.components.keys())
    };
  }

  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      if (!this.isInitialized) {
        return {
          healthy: false,
          details: { error: 'Runtime not initialized' }
        };
      }

      const componentHealth = await this.checkComponentHealth();
      const overallHealthy = this.determineOverallHealth(componentHealth);

      return {
        healthy: overallHealthy,
        details: {
          components: componentHealth,
          metrics: this.metrics,
          uptime: this.metrics.uptime,
          config: {
            environment: this.config.environment,
            network: this.config.network.solana.cluster,
            model: this.config.ai.model.default
          }
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

  private async checkComponentHealth(): Promise<any> {
    const healthChecks: any = {};

    for (const [name, component] of this.components.entries()) {
      try {
        if (typeof component.healthCheck === 'function') {
          const health = await component.healthCheck();
          healthChecks[name] = {
            healthy: health.healthy,
            message: health.details?.error || (health.healthy ? 'OK' : 'Unhealthy')
          };
        } else {
          healthChecks[name] = { healthy: true, message: 'No health check available' };
        }
      } catch (error) {
        healthChecks[name] = {
          healthy: false,
          message: `Health check failed: ${error.message}`
        };
      }
    }

    return healthChecks;
  }

  private determineOverallHealth(componentHealth: any): boolean {
    const criticalComponents = ['keyVault', 'encryptor', 'decryptor', 'proofGenerator'];
    
    return criticalComponents.every(component => 
      componentHealth[component]?.healthy !== false
    );
  }

  private logRuntimeStatus(): void {
    this.logger.info('Runtime Status:');
    this.logger.info(`  Environment: ${this.config.environment}`);
    this.logger.info(`  Log Level: ${this.config.logLevel}`);
    this.logger.info(`  Performance Monitoring: ${this.config.performanceMonitoring}`);
    this.logger.info(`  Cache Enabled: ${this.config.cacheEnabled}`);
    this.logger.info(`  Components: ${this.components.size}`);
    this.logger.info(`  Security: Key Rotation=${this.config.security.keyRotation}, Max Operations=${this.config.security.maxConcurrentOperations}`);
    this.logger.info(`  Network: ${this.config.network.solana.cluster}`);
    this.logger.info(`  AI Model: ${this.config.ai.model.default}`);
  }

  updateConfig(newConfig: Partial<ZkCipherConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Runtime configuration updated');

    if (newConfig.logLevel) {
      this.logger.setLevel(newConfig.logLevel);
    }
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down runtime environment');

    this.isInitialized = false;

    this.components.forEach((component, name) => {
      if (typeof component.shutdown === 'function') {
        try {
          component.shutdown();
          this.logger.debug(`Component shutdown: ${name}`);
        } catch (error) {
          this.logger.warn(`Component shutdown failed: ${name} - ${error.message}`);
        }
      }
    });

    this.components.clear();
    this.metrics.activeOperations = 0;

    this.logger.info('Runtime shutdown completed');
  }

  clearCache(): void {
    this.logger.info('Clearing runtime cache');

    this.components.forEach((component, name) => {
      if (typeof component.clearCache === 'function') {
        try {
          component.clearCache();
          this.logger.debug(`Cache cleared: ${name}`);
        } catch (error) {
          this.logger.warn(`Cache clear failed: ${name} - ${error.message}`);
        }
      }
    });

    this.logger.info('Runtime cache cleared');
  }

  getRuntimeMetrics(): RuntimeMetrics {
    return { ...this.metrics };
  }

  isRuntimeInitialized(): boolean {
    return this.isInitialized;
  }

  async emergencyShutdown(): Promise<void> {
    this.logger.warn('Initiating emergency runtime shutdown');

    this.isInitialized = false;
    this.metrics.activeOperations = 0;
    this.components.clear();

    this.logger.warn('Emergency runtime shutdown completed');
  }
}

export { Runtime, RuntimeConfig, RuntimeMetrics };