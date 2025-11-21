import { randomBytes } from 'crypto';

export interface EphemeralKey {
  publicKey: string;
  privateKey: string;
  expiresAt: number;
  createdAt: number;
  keyId: string;
}

export interface KeyValidationResult {
  valid: boolean;
  reason?: string;
  key?: EphemeralKey;
}

export type LogCallback = (message: string) => void;

export class EphemeralKeyManager {
  private currentKey: EphemeralKey | null;
  private keyArchive: EphemeralKey[];
  private defaultTtl: number;
  private onLogCallback: LogCallback | null;

  constructor(defaultTtl: number = 10 * 60 * 1000) {
    this.currentKey = null;
    this.keyArchive = [];
    this.defaultTtl = defaultTtl;
    this.onLogCallback = null;
    this.log('EphemeralKeyManager initialized');
  }

  // Set log callback for lifecycle events
  onLog(callback: LogCallback): void {
    this.onLogCallback = callback;
    this.log('Log callback registered');
  }

  // Generate a new ephemeral keypair
  generateEphemeralKey(): EphemeralKey {
    const now = Date.now();
    const expiresAt = now + this.defaultTtl;
    const publicKey = this.generateKeyString(32);
    const privateKey = this.generateKeyString(64);
    const keyId = this.generateKeyId();

    const ephemeralKey: EphemeralKey = {
      publicKey,
      privateKey,
      expiresAt,
      createdAt: now,
      keyId
    };

    this.log(`New ephemeral key generated: ${keyId}`);
    this.log(`Key expires at: ${new Date(expiresAt).toISOString()}`);

    return ephemeralKey;
  }

  // Rotate the current key - generate new and archive old
  rotateKey(): EphemeralKey {
    const newKey = this.generateEphemeralKey();

    if (this.currentKey) {
      this.keyArchive.push(this.currentKey);
      this.log(`Archived previous key: ${this.currentKey.keyId}`);
      this.cleanupArchive();
    }

    this.currentKey = newKey;
    this.log(`Key rotation completed. Current key: ${newKey.keyId}`);

    return newKey;
  }

  // Get the current active key
  getCurrentKey(): EphemeralKey | null {
    if (this.currentKey && this.validateEphemeralKey(this.currentKey).valid) {
      return this.currentKey;
    }
    
    if (!this.currentKey || !this.validateEphemeralKey(this.currentKey).valid) {
      this.log('Current key invalid or missing, auto-rotating...');
      return this.rotateKey();
    }

    return this.currentKey;
  }

  // Validate an ephemeral key
  validateEphemeralKey(key: EphemeralKey | string): KeyValidationResult {
    let targetKey: EphemeralKey;

    if (typeof key === 'string') {
      const foundKey = this.findKeyById(key);
      if (!foundKey) {
        return { valid: false, reason: 'Key not found' };
      }
      targetKey = foundKey;
    } else {
      targetKey = key;
    }

    if (!this.isValidKeyStructure(targetKey)) {
      return { valid: false, reason: 'Invalid key structure' };
    }

    const now = Date.now();
    if (targetKey.expiresAt <= now) {
      return { valid: false, reason: 'Key expired' };
    }

    if (targetKey.createdAt > now) {
      return { valid: false, reason: 'Invalid creation time' };
    }

    return { valid: true, key: targetKey };
  }

  // Get key archive (read-only)
  getArchive(): ReadonlyArray<EphemeralKey> {
    return this.keyArchive;
  }

  // Get archive statistics
  getArchiveStats(): { total: number; valid: number; expired: number } {
    const now = Date.now();
    const total = this.keyArchive.length;
    const valid = this.keyArchive.filter(key => key.expiresAt > now).length;
    const expired = total - valid;
    return { total, valid, expired };
  }

  // Force cleanup of expired keys from archive
  cleanupArchive(): number {
    const now = Date.now();
    const initialLength = this.keyArchive.length;
    this.keyArchive = this.keyArchive.filter(key => key.expiresAt > now);
    const removedCount = initialLength - this.keyArchive.length;
    if (removedCount > 0) {
      this.log(`Cleaned up ${removedCount} expired keys from archive`);
    }
    return removedCount;
  }

  // Manually expire a key (for testing)
  expireKey(keyId: string): boolean {
    const key = this.findKeyById(keyId);
    if (key) {
      key.expiresAt = Date.now() - 1000;
      this.log(`Manually expired key: ${keyId}`);
      return true;
    }
    return false;
  }

  // Get manager status
  getStatus(): {
    hasCurrentKey: boolean;
    currentKeyValid: boolean;
    archiveSize: number;
    defaultTtl: number;
  } {
    const currentKeyValid = this.currentKey ? 
      this.validateEphemeralKey(this.currentKey).valid : false;

    return {
      hasCurrentKey: !!this.currentKey,
      currentKeyValid,
      archiveSize: this.keyArchive.length,
      defaultTtl: this.defaultTtl
    };
  }

  // Generate a random key string
  private generateKeyString(length: number): string {
    return randomBytes(length).toString('hex');
  }

  // Generate unique key ID
  private generateKeyId(): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(4).toString('hex');
    return `eph_${timestamp}_${random}`;
  }

  // Find key by ID in current and archive
  private findKeyById(keyId: string): EphemeralKey | null {
    if (this.currentKey && this.currentKey.keyId === keyId) {
      return this.currentKey;
    }
    return this.keyArchive.find(key => key.keyId === keyId) || null;
  }

  // Validate key structure
  private isValidKeyStructure(key: any): key is EphemeralKey {
    return (
      key &&
      typeof key.publicKey === 'string' &&
      typeof key.privateKey === 'string' &&
      typeof key.expiresAt === 'number' &&
      typeof key.createdAt === 'number' &&
      typeof key.keyId === 'string' &&
      key.publicKey.length === 64 &&
      key.privateKey.length === 128 &&
      key.expiresAt > 0 &&
      key.createdAt > 0
    );
  }

  // Internal logging with callback
  private log(message: string): void {
    if (this.onLogCallback) {
      this.onLogCallback(`[EphemeralKeyManager] ${message}`);
    }
  }
}

// Default instance export
export const defaultEphemeralManager = new EphemeralKeyManager();

// Utility functions
export const ephemeralUtils = {
  // Create a new ephemeral key manager instance
  createManager(ttlMinutes: number = 10): EphemeralKeyManager {
    return new EphemeralKeyManager(ttlMinutes * 60 * 1000);
  },

  // Quick validation of any key object
  validateKey(key: any): KeyValidationResult {
    const manager = new EphemeralKeyManager();
    return manager.validateEphemeralKey(key);
  },

  // Check if a key will expire within the next timeframe
  willExpireSoon(key: EphemeralKey, thresholdMs: number = 60000): boolean {
    const now = Date.now();
    return key.expiresAt - now <= thresholdMs;
  }
};
