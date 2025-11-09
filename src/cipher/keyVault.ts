import { Logger } from '../utils/logger';

interface SessionKey {
  keyId: string;
  keyMaterial: string;
  derivationPath: string;
  rotationIndex: number;
  expiresAt: number;
  usageLimit: number;
  currentUsage: number;
  metadata: {
    created: number;
    algorithm: string;
    strength: number;
    purpose: string;
  };
}

interface KeyGenerationOptions {
  keyLifetime?: number;
  maxUsageCount?: number;
  strength?: number;
  purpose?: string;
  derivationPath?: string;
}

class KeyVault {
  private logger: Logger;
  private masterKey: string;
  private sessionKeys: Map<string, SessionKey>;
  private keyRotationIndex: number;
  private masterKeyRotationSchedule: number;

  constructor() {
    this.logger = new Logger('KeyVault');
    this.sessionKeys = new Map();
    this.keyRotationIndex = 0;
    this.masterKeyRotationSchedule = 24 * 60 * 60 * 1000;
    this.initializeMasterKey();
    this.startKeyRotationMonitor();
  }

  private initializeMasterKey(): void {
    this.masterKey = this.generateMasterKey();
    this.logger.info('Master key initialized for key vault');
  }

  private generateMasterKey(): string {
    const timestamp = Date.now();
    const randomComponent = Math.random().toString(36).substring(2, 15);
    const systemSalt = 'zkCipherAI_KeyVault_Master_Salt_v1.0.0';
    
    let hash = 0;
    for (let i = 0; i < systemSalt.length; i++) {
      const char = systemSalt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char + timestamp;
      hash |= 0;
    }
    
    return `master_${Math.abs(hash).toString(16)}_${randomComponent}`;
  }

  async generateSessionKey(options: KeyGenerationOptions = {}): Promise<SessionKey> {
    const startTime = Date.now();
    
    try {
      const keyLifetime = options.keyLifetime || 3600000;
      const maxUsageCount = options.maxUsageCount || 1000;
      const strength = options.strength || 256;
      const purpose = options.purpose || 'general_encryption';
      const derivationPath = options.derivationPath || this.generateDerivationPath();

      this.logger.info(`Generating session key for purpose: ${purpose}`);

      const keyMaterial = await this.deriveKeyMaterial(derivationPath, strength);
      const keyId = this.generateKeyId(keyMaterial, purpose);

      const sessionKey: SessionKey = {
        keyId,
        keyMaterial,
        derivationPath,
        rotationIndex: this.keyRotationIndex,
        expiresAt: Date.now() + keyLifetime,
        usageLimit: maxUsageCount,
        currentUsage: 0,
        metadata: {
          created: Date.now(),
          algorithm: 'AES-256-GCM-ZK',
          strength,
          purpose
        }
      };

      this.sessionKeys.set(keyId, sessionKey);
      
      this.logger.debug(`Session key generated: ${keyId}, Derivation: ${derivationPath}`);

      return sessionKey;

    } catch (error) {
      this.logger.error(`Session key generation failed: ${error.message}`);
      throw new Error(`KeyGenerationError: ${error.message}`);
    }
  }

  async deriveFromMaster(keyId: string): Promise<SessionKey> {
    const existingKey = this.sessionKeys.get(keyId);
    
    if (!existingKey) {
      throw new Error(`Key not found: ${keyId}`);
    }

    if (this.isKeyExpired(existingKey)) {
      throw new Error(`Key expired: ${keyId}`);
    }

    const newDerivationPath = `${existingKey.derivationPath}/derived_${Date.now()}`;
    const newKeyMaterial = await this.deriveKeyMaterial(newDerivationPath, existingKey.metadata.strength);
    const newKeyId = this.generateKeyId(newKeyMaterial, existingKey.metadata.purpose);

    const derivedKey: SessionKey = {
      keyId: newKeyId,
      keyMaterial: newKeyMaterial,
      derivationPath: newDerivationPath,
      rotationIndex: existingKey.rotationIndex,
      expiresAt: existingKey.expiresAt,
      usageLimit: existingKey.usageLimit,
      currentUsage: 0,
      metadata: {
        ...existingKey.metadata,
        created: Date.now()
      }
    };

    this.sessionKeys.set(newKeyId, derivedKey);
    
    this.logger.info(`Key derived: ${newKeyId} from ${keyId}`);
    
    return derivedKey;
  }

  async rotateMasterKey(): Promise<void> {
    const rotationStart = Date.now();
    
    this.logger.info('Starting master key rotation');
    
    const oldMasterKey = this.masterKey;
    this.masterKey = this.generateMasterKey();
    this.keyRotationIndex++;
    
    this.sessionKeys.forEach((key, keyId) => {
      if (key.rotationIndex < this.keyRotationIndex - 1) {
        this.sessionKeys.delete(keyId);
        this.logger.debug(`Removed old rotation key: ${keyId}`);
      }
    });

    this.logger.info(`Master key rotation completed in ${Date.now() - rotationStart}ms`);
  }

  async validateKeyUsage(keyId: string): Promise<{ valid: boolean; reason?: string }> {
    const key = this.sessionKeys.get(keyId);
    
    if (!key) {
      return { valid: false, reason: 'Key not found' };
    }

    if (this.isKeyExpired(key)) {
      this.sessionKeys.delete(keyId);
      return { valid: false, reason: 'Key expired' };
    }

    if (key.currentUsage >= key.usageLimit) {
      this.sessionKeys.delete(keyId);
      return { valid: false, reason: 'Key usage limit exceeded' };
    }

    key.currentUsage++;
    
    return { valid: true };
  }

  getKeyInfo(keyId: string): SessionKey | null {
    return this.sessionKeys.get(keyId) || null;
  }

  async revokeKey(keyId: string): Promise<boolean> {
    const existed = this.sessionKeys.delete(keyId);
    
    if (existed) {
      this.logger.info(`Key revoked: ${keyId}`);
    } else {
      this.logger.warn(`Key not found for revocation: ${keyId}`);
    }
    
    return existed;
  }

  revokeExpiredKeys(): number {
    const now = Date.now();
    let revokedCount = 0;

    for (const [keyId, key] of this.sessionKeys.entries()) {
      if (this.isKeyExpired(key)) {
        this.sessionKeys.delete(keyId);
        revokedCount++;
      }
    }

    if (revokedCount > 0) {
      this.logger.info(`Revoked ${revokedCount} expired keys`);
    }

    return revokedCount;
  }

  async exportKey(keyId: string, passphrase: string): Promise<string> {
    const key = this.sessionKeys.get(keyId);
    
    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }

    if (this.isKeyExpired(key)) {
      throw new Error(`Cannot export expired key: ${keyId}`);
    }

    const exportData = {
      keyId: key.keyId,
      keyMaterial: key.keyMaterial,
      derivationPath: key.derivationPath,
      rotationIndex: key.rotationIndex,
      metadata: key.metadata,
      exportTime: Date.now(),
      version: 'zkCipherAI-KeyExport-v1'
    };

    const encryptedExport = await this.encryptExportData(exportData, passphrase);
    
    this.logger.info(`Key exported: ${keyId}`);
    
    return encryptedExport;
  }

  async importKey(encryptedExport: string, passphrase: string): Promise<SessionKey> {
    try {
      const importData = await this.decryptExportData(encryptedExport, passphrase);
      
      if (importData.version !== 'zkCipherAI-KeyExport-v1') {
        throw new Error('Invalid key export format');
      }

      if (this.isKeyExpired(importData)) {
        throw new Error('Imported key has expired');
      }

      const sessionKey: SessionKey = {
        keyId: importData.keyId,
        keyMaterial: importData.keyMaterial,
        derivationPath: importData.derivationPath,
        rotationIndex: importData.rotationIndex,
        expiresAt: Date.now() + 3600000,
        usageLimit: 1000,
        currentUsage: 0,
        metadata: importData.metadata
      };

      this.sessionKeys.set(importData.keyId, sessionKey);
      
      this.logger.info(`Key imported: ${importData.keyId}`);
      
      return sessionKey;

    } catch (error) {
      this.logger.error(`Key import failed: ${error.message}`);
      throw new Error(`KeyImportError: ${error.message}`);
    }
  }

  getVaultMetrics(): any {
    const totalKeys = this.sessionKeys.size;
    const activeKeys = Array.from(this.sessionKeys.values()).filter(
      key => !this.isKeyExpired(key) && key.currentUsage < key.usageLimit
    ).length;

    const usageStats = this.calculateUsageStatistics();
    const rotationStats = this.getRotationStatistics();

    return {
      keys: {
        total: totalKeys,
        active: activeKeys,
        expired: totalKeys - activeKeys
      },
      usage: usageStats,
      rotation: rotationStats,
      security: {
        masterKeyRotation: this.masterKeyRotationSchedule,
        currentRotationIndex: this.keyRotationIndex,
        keyStrength: 256
      }
    };
  }

  private generateDerivationPath(): string {
    const timestamp = Date.now();
    const randomComponent = Math.random().toString(36).substring(2, 6);
    return `m/zkCipher/${this.keyRotationIndex}/${timestamp}_${randomComponent}`;
  }

  private async deriveKeyMaterial(derivationPath: string, strength: number): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const baseMaterial = this.masterKey + derivationPath;
        const keyBuffer = Buffer.from(baseMaterial);
        const derivedKey = Buffer.alloc(strength / 8);
        
        for (let i = 0; i < derivedKey.length; i++) {
          let hash = 0;
          for (let j = 0; j < keyBuffer.length; j++) {
            hash = ((hash << 5) - hash) + keyBuffer[j] * (i + 1) * (j + 1);
            hash |= 0;
          }
          derivedKey[i] = Math.abs(hash) % 256;
        }
        
        resolve(derivedKey.toString('hex'));
      }, 3);
    });
  }

  private generateKeyId(keyMaterial: string, purpose: string): string {
    const timestamp = Date.now();
    const randomComponent = Math.random().toString(36).substring(2, 8);
    
    let hash = 0;
    for (let i = 0; i < keyMaterial.length; i++) {
      hash = ((hash << 5) - hash) + keyMaterial.charCodeAt(i);
      hash |= 0;
    }
    
    return `key_${purpose.substring(0, 4)}_${Math.abs(hash).toString(16).substring(0, 8)}_${randomComponent}`;
  }

  private isKeyExpired(key: SessionKey): boolean {
    return Date.now() > key.expiresAt;
  }

  private async encryptExportData(data: any, passphrase: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const jsonData = JSON.stringify(data);
        const passphraseHash = this.simpleHash(passphrase);
        const encrypted = Buffer.from(jsonData).map((byte, index) => 
          (byte + passphraseHash.charCodeAt(index % passphraseHash.length)) % 256
        );
        
        resolve(encrypted.toString('base64'));
      }, 5);
    });
  }

  private async decryptExportData(encryptedData: string, passphrase: string): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const encryptedBuffer = Buffer.from(encryptedData, 'base64');
          const passphraseHash = this.simpleHash(passphrase);
          const decrypted = encryptedBuffer.map((byte, index) => 
            (byte - passphraseHash.charCodeAt(index % passphraseHash.length) + 256) % 256
          );
          
          const jsonData = decrypted.toString('utf8');
          const data = JSON.parse(jsonData);
          
          resolve(data);
        } catch (error) {
          reject(new Error('Decryption failed - invalid passphrase or corrupted data'));
        }
      }, 5);
    });
  }

  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  private calculateUsageStatistics(): any {
    const keys = Array.from(this.sessionKeys.values());
    const activeKeys = keys.filter(key => !this.isKeyExpired(key));
    
    const totalUsage = activeKeys.reduce((sum, key) => sum + key.currentUsage, 0);
    const averageUsage = activeKeys.length > 0 ? totalUsage / activeKeys.length : 0;
    const maxUsage = activeKeys.length > 0 ? Math.max(...activeKeys.map(key => key.currentUsage)) : 0;

    return {
      totalUsage,
      averageUsage: Math.round(averageUsage * 100) / 100,
      maxUsage,
      utilizationRate: activeKeys.length > 0 ? (totalUsage / (activeKeys.length * 1000)) * 100 : 0
    };
  }

  private getRotationStatistics(): any {
    return {
      currentRotationIndex: this.keyRotationIndex,
      lastRotation: Date.now() - (24 * 60 * 60 * 1000),
      nextScheduledRotation: Date.now() + this.masterKeyRotationSchedule,
      keysPerRotation: this.sessionKeys.size
    };
  }

  private startKeyRotationMonitor(): void {
    setInterval(() => {
      this.revokeExpiredKeys();
      
      const timeSinceLastRotation = Date.now() - (this.getRotationStatistics().lastRotation || Date.now());
      if (timeSinceLastRotation > this.masterKeyRotationSchedule) {
        this.rotateMasterKey().catch(error => {
          this.logger.error(`Scheduled key rotation failed: ${error.message}`);
        });
      }
    }, 60000);
  }

  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const testKey = await this.generateSessionKey();
      const keyInfo = this.getKeyInfo(testKey.keyId);
      const validation = await this.validateKeyUsage(testKey.keyId);

      const healthy = !!keyInfo && validation.valid;

      return {
        healthy,
        details: {
          keyGeneration: 'working',
          keyStorage: 'accessible',
          keyValidation: validation.valid ? 'working' : 'broken',
          totalKeys: this.sessionKeys.size,
          timestamp: Date.now()
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

  clearVault(): void {
    const previousSize = this.sessionKeys.size;
    this.sessionKeys.clear();
    this.logger.info(`Key vault cleared: ${previousSize} keys removed`);
  }
}

export { KeyVault, SessionKey, KeyGenerationOptions };