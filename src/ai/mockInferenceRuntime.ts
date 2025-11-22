// Core runtime for simulated encrypted inference

export interface EncryptedTensor {
  id: string;
  shape: number[];
  payload: string;
  metadata?: Record<string, unknown>;
}

export interface ModelProfile {
  name: string;
  family: string;
  version: string;
  maxTokens: number;
}

export interface InferenceRequest {
  tensor: EncryptedTensor;
  requestedModel?: string;
}

export interface InferenceStepLog {
  step: string;
  stage: "cipher" | "ai" | "zk";
  message: string;
  at: Date;
}

export interface InferenceResult {
  id: string;
  model: ModelProfile;
  input: EncryptedTensor;
  cipherOutput: string;
  score: number;
  latencyMs: number;
  steps: InferenceStepLog[];
  createdAt: Date;
}

const MODEL_REGISTRY: ModelProfile[] = [
  {
    name: "zkCipherNet-1.3B",
    family: "cipher-net",
    version: "v0.1.0",
    maxTokens: 2048
  },
  {
    name: "zkRiskNet-900M", 
    family: "risk-net",
    version: "v0.2.1",
    maxTokens: 1024
  },
  {
    name: "zkGuard-400M",
    family: "guard-net",
    version: "v0.3.4",
    maxTokens: 512
  }
];

function hashStringToNumber(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

export class MockInferenceRuntime {
  private stats = {
    lastRunId: "",
    avgLatencyMs: 0,
    totalRuns: 0,
    modelUsage: {} as Record<string, number>
  };

  selectModel(input: EncryptedTensor): ModelProfile {
    const seed = hashStringToNumber(input.id + input.payload.length);
    const random = seededRandom(seed);
    const modelIndex = Math.floor(random() * MODEL_REGISTRY.length);
    return MODEL_REGISTRY[modelIndex];
  }

  async run(request: InferenceRequest): Promise<InferenceResult> {
    const startTime = Date.now();
    const steps: InferenceStepLog[] = [];
    
    const model = request.requestedModel 
      ? MODEL_REGISTRY.find(m => m.name === request.requestedModel) || this.selectModel(request.tensor)
      : this.selectModel(request.tensor);

    steps.push({
      step: "model_selection",
      stage: "system",
      message: `Selected model: ${model.name}`,
      at: new Date()
    });

    await this.simulateLatency(20, 40);
    steps.push({
      step: "tensor_normalization", 
      stage: "cipher",
      message: `Normalized shape: [${request.tensor.shape.join(', ')}]`,
      at: new Date()
    });

    await this.simulateLatency(30, 60);
    steps.push({
      step: "model_loading",
      stage: "ai", 
      message: `Loaded ${model.name} into secure enclave`,
      at: new Date()
    });

    await this.simulateLatency(80, 120);
    steps.push({
      step: "encrypted_inference",
      stage: "ai",
      message: "Executed forward pass on encrypted data",
      at: new Date()
    });

    await this.simulateLatency(40, 80);
    steps.push({
      step: "proof_generation",
      stage: "zk", 
      message: "Generated zero-knowledge proof stub",
      at: new Date()
    });

    const latencyMs = Date.now() - startTime;
    const seed = hashStringToNumber(request.tensor.id + request.tensor.payload.length);
    const random = seededRandom(seed);
    
    const cipherOutput = this.generateCipherOutput(request.tensor, random);
    const score = random();

    const result: InferenceResult = {
      id: `inf_${Date.now()}_${hashStringToNumber(request.tensor.id)}`,
      model,
      input: request.tensor,
      cipherOutput,
      score,
      latencyMs,
      steps,
      createdAt: new Date()
    };

    this.updateStats(result);
    return result;
  }

  getLastStats() {
    return this.stats.totalRuns > 0 ? this.stats : null;
  }

  private async simulateLatency(min: number, max: number): Promise<void> {
    const delay = min + Math.random() * (max - min);
    await new Promise(res => setTimeout(res, delay));
  }

  private generateCipherOutput(tensor: EncryptedTensor, random: () => number): string {
    const hash = hashStringToNumber(tensor.id + tensor.payload);
    const hexString = hash.toString(16).padStart(16, '0').toUpperCase();
    return `0x${hexString.slice(0,8)}...${hexString.slice(8)}`;
  }

  private updateStats(result: InferenceResult): void {
    this.stats.lastRunId = result.id;
    this.stats.totalRuns++;
    this.stats.avgLatencyMs = 
      ((this.stats.avgLatencyMs * (this.stats.totalRuns - 1)) + result.latencyMs) / this.stats.totalRuns;
    
    const modelName = result.model.name;
    this.stats.modelUsage[modelName] = (this.stats.modelUsage[modelName] || 0) + 1;
  }
}