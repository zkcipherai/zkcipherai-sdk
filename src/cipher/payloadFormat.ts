
// Secure encrypted payload specification and utilities

export interface EncryptedPayload {
  version: string;
  timestamp: number;
  ephemeralKey: string;
  payload: string;
  integrityHash: string;
  meta: {
    encoding: string;
    entropy: number;
    securityLevel: string;
  };
}

export interface PayloadValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class PayloadFormat {
  private static readonly VERSION = 'zkCAI-enc-v0.1';
  private static readonly SUPPORTED_VERSIONS = ['zkCAI-enc-v0.1'];
  private static readonly MIN_ENTROPY = 128;
  private static readonly MAX_PAYLOAD_SIZE = 10 * 1024 * 1024; 

  // Build standardized encrypted payload
  static buildEncryptedPayload(
    ciphertext: string, 
    ephemeralKey: string, 
    entropy: number = 256
  ): EncryptedPayload {
    
    if (!ciphertext || !ephemeralKey) {
      throw new Error('Ciphertext and ephemeral key are required');
    }

    if (ciphertext.length > PayloadFormat.MAX_PAYLOAD_SIZE) {
      throw new Error(`Payload exceeds maximum size of ${PayloadFormat.MAX_PAYLOAD_SIZE} bytes`);
    }

    const timestamp = Date.now();
    const integrityHash = this.computeIntegrityHash(ciphertext + ephemeralKey + timestamp);
    const securityLevel = this.determineSecurityLevel(entropy);

    console.log(`   Building encrypted payload`);
    console.log(`   Version: ${this.VERSION}`);
    console.log(`   Security level: ${securityLevel}`);
    console.log(`   Integrity hash: ${integrityHash.substring(0, 16)}...`);

    const payload: EncryptedPayload = {
      version: this.VERSION,
      timestamp,
      ephemeralKey,
      payload: ciphertext,
      integrityHash,
      meta: {
        encoding: 'base64',
        entropy,
        securityLevel
      }
    };

    return payload;
  }

  // Validate payload structure and integrity
  static validatePayload(payload: any): PayloadValidationResult {
    const result: PayloadValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check required fields
    const requiredFields = ['version', 'timestamp', 'ephemeralKey', 'payload', 'integrityHash', 'meta'];
    for (const field of requiredFields) {
      if (!(field in payload)) {
        result.errors.push(`Missing required field: ${field}`);
        result.isValid = false;
      }
    }

    if (!result.isValid) {
      return result;
    }

    // Validate version
    if (!this.SUPPORTED_VERSIONS.includes(payload.version)) {
      result.errors.push(`Unsupported version: ${payload.version}`);
      result.isValid = false;
    }

    // Validate timestamp (not in future, not too old)
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    if (payload.timestamp > now + 300000) { 
      result.errors.push('Timestamp is in the future');
      result.isValid = false;
    }
    
    if (payload.timestamp < oneDayAgo) {
      result.warnings.push('Payload timestamp is more than 24 hours old');
    }

    // Validate entropy
    if (payload.meta.entropy < this.MIN_ENTROPY) {
      result.warnings.push(`Low entropy: ${payload.meta.entropy} bits (minimum: ${this.MIN_ENTROPY})`);
    }

    // Validate payload size
    if (typeof payload.payload === 'string' && payload.payload.length > this.MAX_PAYLOAD_SIZE) {
      result.errors.push(`Payload size exceeds maximum limit of ${this.MAX_PAYLOAD_SIZE} bytes`);
      result.isValid = false;
    }

    // Validate integrity hash
    const expectedHash = this.computeIntegrityHash(
      payload.payload + payload.ephemeralKey + payload.timestamp
    );
    
    if (payload.integrityHash !== expectedHash) {
      result.errors.push('Integrity hash validation failed');
      result.isValid = false;
    }

    // Validate metadata structure
    if (payload.meta) {
      if (!payload.meta.encoding || !payload.meta.entropy || !payload.meta.securityLevel) {
        result.errors.push('Incomplete metadata');
        result.isValid = false;
      }
    }

    if (result.isValid) {
      console.log(` Payload validation passed`);
      if (result.warnings.length > 0) {
        console.log(`   Warnings: ${result.warnings.join(', ')}`);
      }
    } else {
      console.log(` Payload validation failed: ${result.errors.join(', ')}`);
    }

    return result;
  }

  //Compute deterministic pseudo hash for integrity checking

  static computeIntegrityHash(input: string): string {
    if(!input) return '';

    let hash = 0;
    for ( let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5 ) - hash) + char;
        hash = hash & hash;
    }

    const hexHash = Math.abs(hash).toString(16).padStart(16, '0');
    return `zkh_${hexHash}_${input.length.toString(16)}`;
  }

  // Estimare entropy based on key characteristics

  static estimateEnergy(input: string): number {
    if(!input) return 0;

    const charFrequency = new Map();
    for ( const char of input ) {
        charFrequency.set(char, (charFrequency.get(char) || 0) + 1);
    }

    let entropy = 0;
    const length = input.length;

    for ( const count of charFrequency.values()) {
        const probability = count / length;
        entropy -= probability * Math.log2(probability);
    }

    return Math.floor(entropy * length);
  }

  // Determine security level based on entropy

  private static determineSecurityLevel(entropy: number): string {
    if ( entropy >= 256 ) return 'HIGH';
    if ( entropy>= 192) return 'MEDIUM_HIGH';
    if ( entropy >= 128) return 'MEDIUM';
    if ( entropy >= 64) return 'LOW';
    return 'VERY_LOW';
  }

  // Get payload metadata for inspection
  static inspectPayload(payload: EncryptedPayload): any {
    if ( !this.validatePayload(payload).isValid) {
        throw new Error('Cannot inspect invalid payload');
    }

    const age = Date.now() - payload.timestamp;
    const ageMinutes = Math.floor( age / ( 60 * 1000));
    const ageHours = Math.floor(age / ( 60 * 60 * 1000));

    return {
        version: payload.version,
        age: {
            milliseconds: age,
            minutes: ageMinutes,
            hours: ageHours
        },
        security: {
            level: payload.meta.securityLevel,
            entropy: payload.meta.entropy,
            encoding: payload.meta.encoding
        },
        size: {
            payload: payload.payload.length,
            total: JSON.stringify(payload).length
        },
        ephemeralKey: {
            length: payload.ephemeralKey.length,
            preview: payload.ephemeralKey.substring(0, 8) + '...'
        }
    };
  }

  static createTestPayload(): EncryptedPayload {
    const testKey = 'test_ephemeral_key_256bit_length';
    const testData = 'Test encrypted data payload';
    const entropy = this.estimateEntropy(testKey);

    return this.buildEncryptedPayload(btoa(testData), testKey, entropy);
  }

  // validate ephemeral key format and strength
  static validateEphemeralKey(key: string): boolean {
    if (!key || key.length < 16) return false;

    const entropy = this.estimateEntropy(key);
    return entropy >= this.MIN_ENTROPY;
  }

  // Extract metadata without full validation 
  static getPayloadMetadata(payload: any): any {
    return {
        version: payload.version,
        timestamp: payload.timestamp,
        securityLevel: payload.meta?.securityLevel,
        entropy: payload.meta?.entropy,
        size: payload.meta?.length
    };
  }
}

// Export main functions 
export const buildEncryptedPayload = PayloadFormat.buildEncryptedPayload;
export const validatePayload = PayloadFormat.validatePayload;
export const computeIntegrityHash = PayloadFormat.computeIntegrityHash;
export const estimateEnergy = PayloadFormat.estimateEnergy;
export const inspectPayload = PayloadFormat.inspectPayload;
export const createTestPayload = PayloadFormat.createTestPayload;
export const validateEphemeralKey = PayloadFormat.validateEphemeralKey;
export const getPayloadMetadata = PayloadFormat.getPayloadMetadata;

export { PayloadFormat };

export default PayloadFormat;
