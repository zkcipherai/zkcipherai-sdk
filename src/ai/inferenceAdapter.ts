import { 
  MockInferenceRuntime,
  EncryptedTensor,
  InferenceRequest, 
  InferenceResult,
  InferenceStepLog,
  ModelProfile
} from "./mockInferenceRuntime";

export interface AdapterConfig {
  network: "devnet" | "local";
  defaultModel: string;
  enableStreaming: boolean;
  maxTensorSize: number;
}

const DEFAULT_ADAPTER_CONFIG: AdapterConfig = {
  network: "devnet",
  defaultModel: "zkCipherNet-1.3B",
  enableStreaming: true,
  maxTensorSize: 64 * 1024
};

class TensorSizeExceededError extends Error {
  constructor(maxSize: number, actualSize: number) {
    super(`Tensor size ${actualSize} > ${maxSize}`);
    this.name = "TensorSizeExceededError";
  }
}

type LogLevel = "debug" | "info" | "warn" | "error";

const log = (level: LogLevel, msg: string, context?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  console.log(`[${timestamp}] [${level}] ${msg}${contextStr}`);
};

export class CipherInferenceAdapter {
  private runtime: MockInferenceRuntime;
  private config: AdapterConfig;
  private runCount: number = 0;
  private modelsSeen: Set<string> = new Set();

  constructor(config?: Partial<AdapterConfig>) {
    this.config = { ...DEFAULT_ADAPTER_CONFIG, ...config };
    this.runtime = new MockInferenceRuntime();
    log("info", "Adapter initialized", this.config);
  }

  prepareTensor(plain: string | object, opts?: { id?: string; shape?: number[]; }): EncryptedTensor {
    const id = opts?.id || `tensor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const shape = opts?.shape || [1, 128];
    
    const serialized = typeof plain === 'string' ? plain : JSON.stringify(plain);
    const serializedSize = new Blob([serialized]).size;
    
    if (serializedSize > this.config.maxTensorSize) {
      log("error", "Tensor size exceeded", { maxSize: this.config.maxTensorSize, actualSize: serializedSize });
      throw new TensorSizeExceededError(this.config.maxTensorSize, serializedSize);
    }

    const payload = this.simulateEncryption(serialized);
    
    log("debug", "Tensor prepared", { id, shape: shape.join('x') });
    
    return {
      id,
      shape,
      payload,
      metadata: {
        originalSize: serializedSize,
        preparedAt: new Date().toISOString()
      }
    };
  }

  async runEncryptedInference(request: InferenceRequest): Promise<InferenceResult> {
    this.runCount++;
    
    log("info", "Inference request received", {
      tensorId: request.tensor.id,
      requestedModel: request.requestedModel
    });

    const processedRequest: InferenceRequest = {
      ...request,
      requestedModel: request.requestedModel || this.config.defaultModel
    };

    const result = await this.runtime.run(processedRequest);
    this.modelsSeen.add(result.model.name);
    
    log("info", "Inference completed", {
      model: result.model.name,
      latencyMs: result.latencyMs,
      score: result.score.toFixed(4)
    });
    
    return result;
  }

  async *streamInference(request: InferenceRequest): AsyncGenerator<InferenceStepLog | InferenceResult> {
    if (!this.config.enableStreaming) {
      throw new Error("Streaming disabled");
    }

    log("debug", "Starting streaming inference", { tensorId: request.tensor.id });

    const inferencePromise = this.runEncryptedInference(request);
    let stepsYielded = 0;
    
    while (true) {
      const result = await inferencePromise;
      
      if (stepsYielded < result.steps.length) {
        yield result.steps[stepsYielded];
        stepsYielded++;
        await new Promise(res => setTimeout(res, 50));
      } else {
        yield result;
        break;
      }
    }
  }

  getAdapterSummary(): { totalRuns: number; modelsSeen: string[]; avgLatencyMs: number } {
    const stats = this.runtime.getLastStats();
    return {
      totalRuns: this.runCount,
      modelsSeen: Array.from(this.modelsSeen),
      avgLatencyMs: stats?.avgLatencyMs || 0
    };
  }

  private simulateEncryption(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const hexString = Math.abs(hash).toString(16).padStart(32, '0').toUpperCase();
    return `0x${hexString}`;
  }
}

export {
  EncryptedTensor,
  InferenceRequest, 
  InferenceResult,
  InferenceStepLog,
  ModelProfile
};