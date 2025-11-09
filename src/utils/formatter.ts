import { Logger } from './logger';

class Formatter {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('Formatter');
  }

  formatHex(data: string | Buffer, options: { prefix?: boolean; length?: number } = {}): string {
    try {
      const buffer = typeof data === 'string' ? Buffer.from(data) : data;
      let hex = buffer.toString('hex');

      if (options.prefix) {
        hex = '0x' + hex;
      }

      if (options.length) {
        hex = hex.padStart(options.length, '0').substring(0, options.length);
      }

      return hex;

    } catch (error) {
      this.logger.error(`Hex formatting failed: ${error.message}`);
      throw new Error(`FormatError: ${error.message}`);
    }
  }

  formatAddress(address: string, options: { prefix?: boolean; checksum?: boolean } = {}): string {
    try {
      let formatted = address;

      if (options.prefix && !formatted.startsWith('0x')) {
        formatted = '0x' + formatted;
      }

      if (options.checksum) {
        formatted = this.toChecksumAddress(formatted);
      }

      return formatted;

    } catch (error) {
      this.logger.error(`Address formatting failed: ${error.message}`);
      throw new Error(`FormatError: ${error.message}`);
    }
  }

  formatAmount(amount: number | string, decimals: number = 18): string {
    try {
      const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      
      if (isNaN(numericAmount)) {
        throw new Error('Invalid amount');
      }

      const formatted = (numericAmount / Math.pow(10, decimals)).toFixed(decimals);
      return this.removeTrailingZeros(formatted);

    } catch (error) {
      this.logger.error(`Amount formatting failed: ${error.message}`);
      throw new Error(`FormatError: ${error.message}`);
    }
  }

  formatTimestamp(timestamp: number | string, format: 'iso' | 'human' | 'relative' = 'iso'): string {
    try {
      const numericTimestamp = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
      const date = new Date(numericTimestamp);

      switch (format) {
        case 'iso':
          return date.toISOString();
        
        case 'human':
          return date.toLocaleString();
        
        case 'relative':
          return this.formatRelativeTime(date);
        
        default:
          return date.toISOString();
      }

    } catch (error) {
      this.logger.error(`Timestamp formatting failed: ${error.message}`);
      throw new Error(`FormatError: ${error.message}`);
    }
  }

  formatDataSize(bytes: number, decimals: number = 2): string {
    try {
      if (bytes === 0) return '0 Bytes';

      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

      const i = Math.floor(Math.log(bytes) / Math.log(k));

      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];

    } catch (error) {
      this.logger.error(`Data size formatting failed: ${error.message}`);
      throw new Error(`FormatError: ${error.message}`);
    }
  }

  formatProofData(proofData: any, options: { compact?: boolean; includePublicSignals?: boolean } = {}): any {
    try {
      if (options.compact) {
        return {
          proofHash: proofData.proofHash,
          circuitId: proofData.circuitId,
          timestamp: proofData.timestamp
        };
      }

      const formatted: any = {
        proofHash: proofData.proofHash,
        circuitId: proofData.circuitId,
        generationTime: proofData.generationTime + 'ms',
        timestamp: this.formatTimestamp(proofData.timestamp, 'iso')
      };

      if (options.includePublicSignals && proofData.publicSignals) {
        formatted.publicSignals = this.formatPublicSignals(proofData.publicSignals);
      }

      if (proofData.compressionRatio) {
        formatted.compressionRatio = proofData.compressionRatio.toFixed(3) + 'x';
      }

      if (proofData.trustScore) {
        formatted.trustScore = (proofData.trustScore * 100).toFixed(1) + '%';
      }

      return formatted;

    } catch (error) {
      this.logger.error(`Proof data formatting failed: ${error.message}`);
      throw new Error(`FormatError: ${error.message}`);
    }
  }

  formatEncryptionResult(encryptionResult: any, options: { includeData?: boolean } = {}): any {
    try {
      const formatted: any = {
        cipherId: encryptionResult.cipherId,
        encryptionTime: encryptionResult.encryptionTime + 'ms',
        algorithm: encryptionResult.metadata?.algorithm,
        timestamp: this.formatTimestamp(encryptionResult.timestamp, 'iso')
      };

      if (encryptionResult.compressionStats) {
        formatted.compression = {
          originalSize: this.formatDataSize(encryptionResult.compressionStats.originalSize),
          compressedSize: this.formatDataSize(encryptionResult.compressionStats.compressedSize),
          ratio: encryptionResult.compressionStats.ratio.toFixed(2) + 'x'
        };
      }

      if (options.includeData) {
        formatted.encryptedData = encryptionResult.encryptedData.substring(0, 64) + '...';
        formatted.iv = encryptionResult.iv;
        formatted.authTag = encryptionResult.authTag;
      }

      return formatted;

    } catch (error) {
      this.logger.error(`Encryption result formatting failed: ${error.message}`);
      throw new Error(`FormatError: ${error.message}`);
    }
  }

  formatTransaction(transaction: any, options: { includeMetadata?: boolean } = {}): any {
    try {
      const formatted: any = {
        signature: transaction.signature?.substring(0, 16) + '...',
        slot: transaction.slot?.toLocaleString(),
        status: this.formatTransactionStatus(transaction.status),
        timestamp: this.formatTimestamp(transaction.timestamp, 'human')
      };

      if (transaction.confirmations !== undefined) {
        formatted.confirmations = transaction.confirmations;
      }

      if (options.includeMetadata && transaction.metadata) {
        formatted.metadata = transaction.metadata;
      }

      return formatted;

    } catch (error) {
      this.logger.error(`Transaction formatting failed: ${error.message}`);
      throw new Error(`FormatError: ${error.message}`);
    }
  }

  formatAIInferenceResult(inferenceResult: any, options: { includePrivacy?: boolean } = {}): any {
    try {
      const formatted: any = {
        inferenceId: inferenceResult.inferenceId,
        processingTime: inferenceResult.processingTime + 'ms',
        confidence: inferenceResult.confidence ? (inferenceResult.confidence * 100).toFixed(1) + '%' : 'N/A'
      };

      if (options.includePrivacy && inferenceResult.privacyMetrics) {
        formatted.privacy = {
          inputExposure: inferenceResult.privacyMetrics.inputExposure,
          intermediateState: inferenceResult.privacyMetrics.intermediateState,
          outputLinkability: inferenceResult.privacyMetrics.outputLinkability
        };
      }

      return formatted;

    } catch (error) {
      this.logger.error(`AI inference result formatting failed: ${error.message}`);
      throw new Error(`FormatError: ${error.message}`);
    }
  }

  formatJSON(data: any, options: { indent?: number; sortKeys?: boolean } = {}): string {
    try {
      const indent = options.indent ?? 2;
      const replacer = options.sortKeys ? this.createSortedReplacer() : null;

      return JSON.stringify(data, replacer, indent);

    } catch (error) {
      this.logger.error(`JSON formatting failed: ${error.message}`);
      throw new Error(`FormatError: ${error.message}`);
    }
  }

  formatCSV(data: any[], headers?: string[]): string {
    try {
      if (data.length === 0) {
        return '';
      }

      const actualHeaders = headers || Object.keys(data[0]);
      const csvLines: string[] = [];

      csvLines.push(actualHeaders.join(','));

      data.forEach(row => {
        const values = actualHeaders.map(header => {
          const value = row[header];
          return this.escapeCSVValue(value);
        });
        csvLines.push(values.join(','));
      });

      return csvLines.join('\n');

    } catch (error) {
      this.logger.error(`CSV formatting failed: ${error.message}`);
      throw new Error(`FormatError: ${error.message}`);
    }
  }

  formatPercentage(value: number, decimals: number = 1): string {
    try {
      return (value * 100).toFixed(decimals) + '%';
    } catch (error) {
      this.logger.error(`Percentage formatting failed: ${error.message}`);
      throw new Error(`FormatError: ${error.message}`);
    }
  }

  formatDuration(milliseconds: number): string {
    try {
      const seconds = Math.floor(milliseconds / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
      } else if (seconds > 0) {
        return `${seconds}s`;
      } else {
        return `${milliseconds}ms`;
      }
    } catch (error) {
      this.logger.error(`Duration formatting failed: ${error.message}`);
      throw new Error(`FormatError: ${error.message}`);
    }
  }

  private toChecksumAddress(address: string): string {
    if (!address.startsWith('0x')) {
      address = '0x' + address;
    }

    const addressHash = this.simpleHash(address.toLowerCase().substring(2));
    let checksumAddress = '0x';

    for (let i = 0; i < 40; i++) {
      if (parseInt(addressHash[i], 16) > 7) {
        checksumAddress += address[i + 2].toUpperCase();
      } else {
        checksumAddress += address[i + 2];
      }
    }

    return checksumAddress;
  }

  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(40, '0');
  }

  private removeTrailingZeros(value: string): string {
    return value.replace(/\.?0+$/, '');
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else {
      return 'just now';
    }
  }

  private formatPublicSignals(publicSignals: any): any {
    const formatted: any = {};

    for (const [key, value] of Object.entries(publicSignals)) {
      if (typeof value === 'boolean') {
        formatted[key] = value ? '✓' : '✗';
      } else if (typeof value === 'number') {
        if (key.includes('Time') || key.includes('timestamp')) {
          formatted[key] = this.formatTimestamp(value as number, 'human');
        } else if (key.includes('Score') || key.includes('confidence')) {
          formatted[key] = this.formatPercentage(value as number);
        } else {
          formatted[key] = value;
        }
      } else {
        formatted[key] = value;
      }
    }

    return formatted;
  }

  private formatTransactionStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': '⏳ Pending',
      'confirmed': '✅ Confirmed',
      'failed': '❌ Failed'
    };

    return statusMap[status] || status;
  }

  private createSortedReplacer(): (key: string, value: any) => any {
    return (key: string, value: any) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return Object.keys(value).sort().reduce((sorted: any, key) => {
          sorted[key] = value[key];
          return sorted;
        }, {});
      }
      return value;
    };
  }

  private escapeCSVValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);
    
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return '"' + stringValue.replace(/"/g, '""') + '"';
    }
    
    return stringValue;
  }

  validateHex(hex: string): boolean {
    return /^(0x)?[0-9a-fA-F]+$/.test(hex);
  }

  validateAddress(address: string): boolean {
    return /^(0x)?[0-9a-fA-F]{40}$/.test(address);
  }

  validateProofHash(hash: string): boolean {
    return /^proof_[0-9a-f]{12}$/.test(hash);
  }

  validateCipherId(cipherId: string): boolean {
    return /^zk_[0-9a-f]{8}_[0-9a-f]{8}_[0-9a-f]{6}$/.test(cipherId);
  }

  truncate(text: string, maxLength: number, ellipsis: string = '...'): string {
    if (text.length <= maxLength) {
      return text;
    }

    return text.substring(0, maxLength - ellipsis.length) + ellipsis;
  }

  capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  camelToKebab(camelCase: string): string {
    return camelCase.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  kebabToCamel(kebabCase: string): string {
    return kebabCase.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }
}

export { Formatter };