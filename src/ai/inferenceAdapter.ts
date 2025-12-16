import crypto from 'crypto';

export interface EncryptedPayload {
  ciphertext: Buffer;
  iv: Buffer;
  authTag?: Buffer;
  encryptionMode: 'AES-256-GCM' | 'AES-256-CTR' | 'ChaCha20-Poly1305';
  keyId?: string;
}

export interface InferenceResult {
  encryptedOutput: Buffer;
  modelId: string;
  inferenceTimeMs: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  inferenceId: string;
  metadata: {
    inputTokens: number;
    outputTokens: number;
    latencyBreakdown: Record<string, number>;
  };
}

export interface ModelConfig {
  modelId: string;
  quantization: 'FP16' | 'INT8' | 'INT4' | 'NF4';
  contextLength: number;
  batchSize: number;
  maxSequenceLength: number;
  temperature?: number;
  topP?: number;
}

export interface AdapterConfig {
  models: Map<string, ModelConfig>;
  defaultModel: string;
  cacheEnabled: boolean;
  maxConcurrent: number;
  timeoutMs: number;
}

export class InferenceAdapter {
  private config: AdapterConfig;
  private modelCache: Map<string, { loadedAt: number; hits: number }>;
  private metrics: {
    totalInferences: number;
    totalTokens: number;
    averageLatency: number;
  };

  constructor(config: Partial<AdapterConfig> = {}) {
    this.config = {
      models: new Map(),
      defaultModel: 'llama-3-70b',
      cacheEnabled: true,
      maxConcurrent: 4,
      timeoutMs: 30000,
      ...config
    };

    this.modelCache = new Map();
    this.metrics = {
      totalInferences: 0,
      totalTokens: 0,
      averageLatency: 0
    };

    this.initializeDefaultModels();
  }

  private initializeDefaultModels(): void {
    const defaultModels: ModelConfig[] = [
      {
        modelId: 'llama-3-70b',
        quantization: 'INT8',
        contextLength: 8192,
        batchSize: 1,
        maxSequenceLength: 4096,
        temperature: 0.7,
        topP: 0.9
      },
      {
        modelId: 'mixtral-8x7b',
        quantization: 'NF4',
        contextLength: 32768,
        batchSize: 2,
        maxSequenceLength: 8192,
        temperature: 0.8,
        topP: 0.95
      },
      {
        modelId: 'qwen-72b',
        quantization: 'INT4',
        contextLength: 32768,
        batchSize: 1,
        maxSequenceLength: 8192
      }
    ];

    defaultModels.forEach(model => {
      this.config.models.set(model.modelId, model);
    });
  }

  private async loadModel(modelId: string): Promise<void> {
    const modelConfig = this.config.models.get(modelId);
    if (!modelConfig) {
      throw new Error(`Model ${modelId} not configured`);
    }

    console.log(`Loading model: ${modelId} (${modelConfig.quantization})`);
    console.log(`Context length: ${modelConfig.contextLength}, Batch size: ${modelConfig.batchSize}`);

    if (this.modelCache.has(modelId)) {
      const cached = this.modelCache.get(modelId)!;
      cached.hits++;
      cached.loadedAt = Date.now();
      console.log(`Model ${modelId} loaded from cache (hits: ${cached.hits})`);
      return;
    }

    await this.simulateModelLoading(modelConfig);
    
    this.modelCache.set(modelId, {
      loadedAt: Date.now(),
      hits: 1
    });

    console.log(`Model ${modelId} loaded successfully`);
  }

  private simulateModelLoading(config: ModelConfig): Promise<void> {
    return new Promise(resolve => {
      const loadTime = Math.max(100, config.contextLength / 100);
      setTimeout(resolve, loadTime);
    });
  }

  private decryptPayload(payload: EncryptedPayload, key?: Buffer): Buffer {
    if (!payload.ciphertext || payload.ciphertext.length === 0) {
      throw new Error('Empty ciphertext');
    }

    if (payload.ciphertext.length > 1024 * 1024 * 10) {
      throw new Error('Ciphertext too large (>10MB)');
    }

    const algorithm = payload.encryptionMode.split('-')[0].toLowerCase();
    const keySize = parseInt(payload.encryptionMode.split('-')[1]) / 8;
    
    const derivedKey = key || crypto.randomBytes(keySize);
    
    const decipher = crypto.createDecipheriv(
      payload.encryptionMode.toLowerCase(),
      derivedKey,
      payload.iv
    );

    if (payload.authTag) {
      decipher.setAuthTag(payload.authTag);
    }

    const decrypted = Buffer.concat([
      decipher.update(payload.ciphertext),
      decipher.final()
    ]);

    return decrypted;
  }

  private encryptOutput(data: Buffer, key?: Buffer): Buffer {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const encryptionKey = key || crypto.randomBytes(32);

    const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(data),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();
    
    return Buffer.concat([iv, authTag, encrypted]);
  }

  private simulateInference(
    input: Buffer,
    modelConfig: ModelConfig
  ): { output: Buffer; metadata: any } {
    const inputText = input.toString('utf8');
    const inputTokens = Math.ceil(inputText.length / 4);
    
    const latencyBreakdown = {
      preprocess: 5 + Math.random() * 10,
      attention: inputTokens * 0.1 + Math.random() * 20,
      feedForward: inputTokens * 0.05 + Math.random() * 15,
      postprocess: 2 + Math.random() * 5
    };

    const totalLatency = Object.values(latencyBreakdown).reduce((a, b) => a + b, 0);
    
    const outputTokens = Math.min(
      modelConfig.maxSequenceLength,
      Math.floor(inputTokens * (1.5 + Math.random() * 0.5))
    );

    const outputBuffer = crypto.randomBytes(outputTokens * 4);
    
    return {
      output: outputBuffer,
      metadata: {
        inputTokens,
        outputTokens,
        latencyBreakdown,
        totalLatency
      }
    };
  }

  public async runEncryptedInference(
    payload: EncryptedPayload,
    options: {
      modelId?: string;
      apiKey?: string;
      timeout?: number;
    } = {}
  ): Promise<InferenceResult> {
    const startTime = performance.now();
    const inferenceId = `inf_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    try {
      console.log(`Starting encrypted inference: ${inferenceId}`);
      console.log(`Payload size: ${payload.ciphertext.length} bytes`);
      console.log(`Encryption mode: ${payload.encryptionMode}`);

      const modelId = options.modelId || this.config.defaultModel;
      await this.loadModel(modelId);

      const modelConfig = this.config.models.get(modelId)!;
      
      const decryptionStart = performance.now();
      const decryptedInput = this.decryptPayload(payload);
      const decryptionTime = performance.now() - decryptionStart;
      
      console.log(`Decryption completed in ${decryptionTime.toFixed(2)}ms`);
      console.log(`Input tokens: ~${Math.ceil(decryptedInput.length / 4)}`);

      const inferenceStart = performance.now();
      const { output, metadata } = this.simulateInference(decryptedInput, modelConfig);
      const inferenceTime = performance.now() - inferenceStart;

      const encryptionStart = performance.now();
      const encryptedOutput = this.encryptOutput(output);
      const encryptionTime = performance.now() - encryptionStart;

      const totalTime = performance.now() - startTime;

      this.metrics.totalInferences++;
      this.metrics.totalTokens += metadata.inputTokens + metadata.outputTokens;
      this.metrics.averageLatency = 
        (this.metrics.averageLatency * (this.metrics.totalInferences - 1) + totalTime) / 
        this.metrics.totalInferences;

      console.log(`Inference completed in ${totalTime.toFixed(2)}ms`);
      console.log(`Throughput: ${(metadata.outputTokens / (inferenceTime / 1000)).toFixed(2)} tokens/sec`);
      console.log(`Output size: ${encryptedOutput.length} bytes`);

      return {
        encryptedOutput,
        modelId,
        inferenceTimeMs: Math.floor(totalTime),
        status: 'SUCCESS',
        inferenceId,
        metadata: {
          inputTokens: metadata.inputTokens,
          outputTokens: metadata.outputTokens,
          latencyBreakdown: {
            decryption: decryptionTime,
            inference: inferenceTime,
            encryption: encryptionTime,
            ...metadata.latencyBreakdown
          }
        }
      };

    } catch (error) {
      console.error(`Inference failed: ${error.message}`);
      
      return {
        encryptedOutput: Buffer.alloc(0),
        modelId: options.modelId || this.config.defaultModel,
        inferenceTimeMs: Math.floor(performance.now() - startTime),
        status: 'FAILED',
        inferenceId,
        metadata: {
          inputTokens: 0,
          outputTokens: 0,
          latencyBreakdown: {}
        }
      };
    }
  }

  public getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.modelCache.size,
      cacheHitRate: this.calculateCacheHitRate()
    };
  }

  private calculateCacheHitRate(): number {
    const totalHits = Array.from(this.modelCache.values())
      .reduce((sum, entry) => sum + entry.hits, 0);
    return totalHits / this.metrics.totalInferences;
  }

  public clearCache(): void {
    this.modelCache.clear();
    console.log('Model cache cleared');
  }

  public static createTestPayload(
    data: string,
    encryptionMode: EncryptedPayload['encryptionMode'] = 'AES-256-GCM'
  ): EncryptedPayload {
    const algorithm = encryptionMode.split('-')[0].toLowerCase();
    const keySize = parseInt(encryptionMode.split('-')[1]) / 8;
    
    const key = crypto.randomBytes(keySize);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(
      encryptionMode.toLowerCase(),
      key,
      iv
    );

    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final()
    ]);

    const authTag = encryptionMode.includes('GCM') || encryptionMode.includes('Poly1305') 
      ? cipher.getAuthTag() 
      : undefined;

    return {
      ciphertext: encrypted,
      iv,
      authTag,
      encryptionMode,
      keyId: 'test_key_' + crypto.randomBytes(8).toString('hex')
    };
  }
}