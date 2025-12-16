import { InferenceAdapter, type EncryptedPayload } from '../src/ai/inferenceAdapter';
import { ProofPipeline, type ProofInput } from '../src/proof/proofPipeline';
import crypto from 'crypto';
import { performance } from 'perf_hooks';

class PipelineBenchmark {
  private inferenceAdapter: InferenceAdapter;
  private proofPipeline: ProofPipeline;
  private results: Array<{
    inferenceId: string;
    inferenceTime: number;
    proofTime: number;
    totalTime: number;
    status: string;
    proofSize: number;
  }>;

  constructor() {
    this.inferenceAdapter = new InferenceAdapter({
      cacheEnabled: true,
      maxConcurrent: 2,
      timeoutMs: 10000
    });

    this.proofPipeline = new ProofPipeline({
      aggregationEnabled: true,
      compressionLevel: 2,
      timeoutMs: 15000
    });

    this.results = [];
  }

  private generateTestData(size: 'small' | 'medium' | 'large'): string {
    const sizes = {
      small: 100,
      medium: 1000,
      large: 5000
    };

    const words = [
      'the', 'of', 'and', 'to', 'in', 'that', 'is', 'was', 'he', 'for',
      'it', 'with', 'as', 'his', 'on', 'be', 'at', 'by', 'I', 'this',
      'had', 'not', 'are', 'but', 'from', 'or', 'have', 'an', 'they',
      'which', 'one', 'you', 'were', 'her', 'all', 'she', 'there',
      'would', 'their', 'we', 'him', 'been', 'has', 'when', 'who',
      'will', 'more', 'no', 'if', 'out', 'so', 'said', 'what', 'up'
    ];

    let text = '';
    const targetSize = sizes[size];
    
    while (text.length < targetSize) {
      const word = words[Math.floor(Math.random() * words.length)];
      text += word + ' ';
    }

    return text.substring(0, targetSize);
  }

  private async runSingleIteration(iteration: number): Promise<void> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Iteration ${iteration + 1}`);
    console.log(`${'='.repeat(60)}`);

    const size = iteration === 0 ? 'small' : iteration === 1 ? 'medium' : 'large';
    const testData = this.generateTestData(size);

    console.log(`Test data: ${size.toUpperCase()} (${testData.length} chars)`);

    const encryptionStart = performance.now();
    const encryptedPayload = InferenceAdapter.createTestPayload(testData, 'AES-256-GCM');
    const encryptionTime = performance.now() - encryptionStart;
    console.log(`Encryption: ${encryptionTime.toFixed(2)}ms`);

    const inferenceStart = performance.now();
    const inferenceResult = await this.inferenceAdapter.runEncryptedInference(encryptedPayload, {
      modelId: iteration === 2 ? 'mixtral-8x7b' : 'llama-3-70b'
    });
    const inferenceTime = performance.now() - inferenceStart;

    if (inferenceResult.status !== 'SUCCESS') {
      console.error(`Inference failed: ${inferenceResult.inferenceId}`);
      this.results.push({
        inferenceId: inferenceResult.inferenceId,
        inferenceTime,
        proofTime: 0,
        totalTime: inferenceTime,
        status: 'INFERENCE_FAILED',
        proofSize: 0
      });
      return;
    }

    console.log(`Inference: ${inferenceTime.toFixed(2)}ms`);
    console.log(`Tokens: ${inferenceResult.metadata.inputTokens} → ${inferenceResult.metadata.outputTokens}`);
    console.log(`Throughput: ${(inferenceResult.metadata.outputTokens / (inferenceTime / 1000)).toFixed(2)} tokens/sec`);

    const proofInput: ProofInput = {
      inferenceId: inferenceResult.inferenceId,
      modelId: inferenceResult.modelId,
      inputHash: crypto.createHash('sha256').update(encryptedPayload.ciphertext).digest('hex'),
      outputHash: crypto.createHash('sha256').update(inferenceResult.encryptedOutput).digest('hex'),
      timestamp: Date.now(),
      metadata: {
        inputTokens: inferenceResult.metadata.inputTokens,
        outputTokens: inferenceResult.metadata.outputTokens,
        inferenceTimeMs: inferenceResult.inferenceTimeMs
      }
    };

    const proofStart = performance.now();
    const proofResult = await this.proofPipeline.generateProof(proofInput);
    const proofTime = performance.now() - proofStart;

    console.log(`Proof: ${proofTime.toFixed(2)}ms`);
    console.log(`Proof size: ${(proofResult.proofSizeBytes / 1024).toFixed(2)} KB`);
    console.log(`Compression: ${(proofResult.compressionRatio * 100).toFixed(2)}%`);
    console.log(`Status: ${proofResult.status}`);

    const totalTime = inferenceTime + proofTime;

    this.results.push({
      inferenceId: inferenceResult.inferenceId,
      inferenceTime,
      proofTime,
      totalTime,
      status: proofResult.status,
      proofSize: proofResult.proofSizeBytes
    });

    console.log(`Total: ${totalTime.toFixed(2)}ms`);
    console.log(`Proof/Inference ratio: ${(proofTime / inferenceTime).toFixed(2)}`);
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('BENCHMARK SUMMARY');
    console.log('='.repeat(60));

    const successful = this.results.filter(r => r.status === 'VERIFIED');
    const failed = this.results.filter(r => r.status !== 'VERIFIED');

    console.log(`\nTotal iterations: ${this.results.length}`);
    console.log(`Successful: ${successful.length}`);
    console.log(`Failed: ${failed.length}`);
    console.log(`Success rate: ${((successful.length / this.results.length) * 100).toFixed(2)}%`);

    if (successful.length > 0) {
      const avgInferenceTime = successful.reduce((sum, r) => sum + r.inferenceTime, 0) / successful.length;
      const avgProofTime = successful.reduce((sum, r) => sum + r.proofTime, 0) / successful.length;
      const avgTotalTime = successful.reduce((sum, r) => sum + r.totalTime, 0) / successful.length;
      const avgProofSize = successful.reduce((sum, r) => sum + r.proofSize, 0) / successful.length;

      console.log(`\nAverage times (successful runs):`);
      console.log(`  Inference: ${avgInferenceTime.toFixed(2)}ms`);
      console.log(`  Proof: ${avgProofTime.toFixed(2)}ms`);
      console.log(`  Total: ${avgTotalTime.toFixed(2)}ms`);
      console.log(`  Proof/Inference: ${(avgProofTime / avgInferenceTime).toFixed(2)}`);
      console.log(`  Average proof size: ${(avgProofSize / 1024).toFixed(2)} KB`);
    }

    const inferenceMetrics = this.inferenceAdapter.getMetrics();
    const proofMetrics = this.proofPipeline.getMetrics();

    console.log('\nSystem Metrics:');
    console.log(`  Total inferences: ${inferenceMetrics.totalInferences}`);
    console.log(`  Total tokens: ${inferenceMetrics.totalTokens}`);
    console.log(`  Average latency: ${inferenceMetrics.averageLatency.toFixed(2)}ms`);
    console.log(`  Cache hit rate: ${(inferenceMetrics.cacheHitRate * 100).toFixed(2)}%`);
    console.log(`  Proofs generated: ${proofMetrics.proofsGenerated}`);
    console.log(`  Total constraints: ${proofMetrics.totalConstraints.toLocaleString()}`);
    console.log(`  Proof success rate: ${(proofMetrics.successRate * 100).toFixed(2)}%`);

    console.log('\n' + '='.repeat(60));
    console.log('RECOMMENDATIONS');
    console.log('='.repeat(60));

    if (failed.length > 0) {
      console.log('1. Review failed proofs for pattern detection');
    }

    if (successful.length > 0) {
      const lastResult = successful[successful.length - 1];
      const proofRatio = lastResult.proofTime / lastResult.inferenceTime;
      
      if (proofRatio > 0.5) {
        console.log('2. Consider proof aggregation for smaller inferences');
      }
      
      if (lastResult.proofSize > 50 * 1024) {
        console.log('3. Evaluate higher compression levels for large proofs');
      }
    }

    console.log('4. Monitor cache hit rate for model loading optimization');
    console.log('5. Consider batch processing for high-throughput scenarios');
  }

  public async runBenchmark(iterations: number = 3): Promise<void> {
    console.log('Starting encrypted inference pipeline benchmark');
    console.log(`Iterations: ${iterations}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('='.repeat(60));

    const totalStart = performance.now();

    for (let i = 0; i < iterations; i++) {
      try {
        await this.runSingleIteration(i);
        
        if (i < iterations - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Error in iteration ${i + 1}:`, error);
        this.results.push({
          inferenceId: `error_${i}`,
          inferenceTime: 0,
          proofTime: 0,
          totalTime: 0,
          status: 'ERROR',
          proofSize: 0
        });
      }
    }

    const totalTime = performance.now() - totalStart;

    this.printSummary();

    console.log(`\nTotal benchmark time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`Average iteration time: ${(totalTime / iterations / 1000).toFixed(2)}s`);
    console.log('\nBenchmark completed successfully');
  }
}

async function main() {
  try {
    const benchmark = new PipelineBenchmark();
    await benchmark.runBenchmark(3);
  } catch (error) {
    console.error('Fatal error in benchmark:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { PipelineBenchmark };