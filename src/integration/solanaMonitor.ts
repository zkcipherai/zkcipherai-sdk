import { Logger } from '../utils/logger';
import { SolanaClient } from '../solana/client';
import { ProofVerifier } from '../proof/verifier';
import { zkCipherClient } from '../sdk/zkCipherClient';

interface MonitorConfig {
  network: 'mainnet' | 'devnet' | 'testnet';
  rpcUrl?: string;
  pollInterval: number;
  alertThreshold: number;
  monitorProofs: boolean;
  monitorTransactions: boolean;
  monitorNetwork: boolean;
  webhookUrl?: string;
}

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  data?: any;
}

interface MonitorMetrics {
  uptime: number;
  proofsVerified: number;
  transactionsProcessed: number;
  alertsTriggered: number;
  averageResponseTime: number;
  networkHealth: number;
}

class SolanaMonitor {
  private logger: Logger;
  private solanaClient: SolanaClient;
  private proofVerifier: ProofVerifier;
  private zkClient: zkCipherClient;
  
  private config: MonitorConfig;
  private isMonitoring: boolean;
  private alerts: Alert[];
  private metrics: MonitorMetrics;
  private monitoringInterval: NodeJS.Timeout | null;
  private proofSubscriptions: Map<string, any>;
  private transactionWatchers: Map<string, any>;

  constructor(config: Partial<MonitorConfig> = {}) {
    this.logger = new Logger('SolanaMonitor');
    this.solanaClient = new SolanaClient();
    this.proofVerifier = new ProofVerifier();
    this.zkClient = new zkCipherClient();
    
    this.config = {
      network: 'devnet',
      pollInterval: 30000,
      alertThreshold: 5,
      monitorProofs: true,
      monitorTransactions: true,
      monitorNetwork: true,
      ...config
    };
    
    this.isMonitoring = false;
    this.alerts = [];
    this.metrics = this.initializeMetrics();
    this.monitoringInterval = null;
    this.proofSubscriptions = new Map();
    this.transactionWatchers = new Map();
    
    this.initializeMonitor();
  }

  private initializeMonitor(): void {
    this.logger.info('Initializing Solana Monitor');
    
    const monitorConfig = {
      network: this.config.network,
      pollInterval: this.config.pollInterval,
      features: {
        proofMonitoring: this.config.monitorProofs,
        transactionMonitoring: this.config.monitorTransactions,
        networkMonitoring: this.config.monitorNetwork
      }
    };

    this.logger.debug(`Monitor configured: ${JSON.stringify(monitorConfig)}`);
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      this.logger.warn('Monitor is already running');
      return;
    }

    this.logger.info('Starting Solana monitoring...');
    this.isMonitoring = true;

    await this.performInitialHealthCheck();

    this.monitoringInterval = setInterval(() => {
      this.monitoringCycle().catch(error => {
        this.logger.error(`Monitoring cycle failed: ${error.message}`);
        this.triggerAlert('error', `Monitoring cycle failed: ${error.message}`);
      });
    }, this.config.pollInterval);

    if (this.config.monitorProofs) {
      this.startProofMonitoring();
    }

    if (this.config.monitorTransactions) {
      this.startTransactionMonitoring();
    }

    if (this.config.monitorNetwork) {
      this.startNetworkMonitoring();
    }

    this.logger.success('Solana monitoring started successfully');
  }

  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    this.logger.info('Stopping Solana monitoring...');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.proofSubscriptions.clear();
    this.transactionWatchers.clear();

    this.logger.info('Solana monitoring stopped');
  }

  async monitorProof(proofHash: string): Promise<string> {
    const subscriptionId = `proof_${proofHash}_${Date.now()}`;
    
    this.logger.info(`Starting proof monitoring: ${proofHash}`);

    const subscription = {
      proofHash,
      startTime: Date.now(),
      status: 'pending',
      verificationAttempts: 0,
      lastChecked: 0
    };

    this.proofSubscriptions.set(subscriptionId, subscription);

    const checkProof = async () => {
      if (!this.isMonitoring) return;

      try {
        subscription.verificationAttempts++;
        subscription.lastChecked = Date.now();

        const verification = await this.solanaClient.verifyProofOnChain(proofHash, proofHash);
        
        if (verification.onChain) {
          subscription.status = 'verified';
          this.logger.info(`Proof verified on-chain: ${proofHash}`);
          this.triggerAlert('info', `Proof verified on-chain: ${proofHash}`, { proofHash, verification });
          return;
        }

        if (subscription.verificationAttempts > 10) {
          subscription.status = 'timeout';
          this.triggerAlert('warning', `Proof verification timeout: ${proofHash}`, { proofHash, attempts: subscription.verificationAttempts });
          return;
        }

        setTimeout(checkProof, 10000);
      } catch (error) {
        this.logger.error(`Proof monitoring error: ${error.message}`);
        setTimeout(checkProof, 30000);
      }
    };

    checkProof();

    return subscriptionId;
  }

  async monitorTransaction(txHash: string): Promise<string> {
    const subscriptionId = `tx_${txHash}_${Date.now()}`;
    
    this.logger.info(`Starting transaction monitoring: ${txHash}`);

    const subscription = {
      txHash,
      startTime: Date.now(),
      status: 'pending',
      confirmationChecks: 0,
      lastChecked: 0
    };

    this.transactionWatchers.set(subscriptionId, subscription);

    const checkTransaction = async () => {
      if (!this.isMonitoring) return;

      try {
        subscription.confirmationChecks++;
        subscription.lastChecked = Date.now();

        const status = await this.solanaClient.fetchTransactionStatus(txHash);
        
        if (status.status === 'confirmed') {
          subscription.status = 'confirmed';
          this.logger.info(`Transaction confirmed: ${txHash}`);
          this.triggerAlert('info', `Transaction confirmed: ${txHash}`, { txHash, status });
          this.metrics.transactionsProcessed++;
          return;
        }

        if (status.status === 'failed') {
          subscription.status = 'failed';
          this.triggerAlert('error', `Transaction failed: ${txHash}`, { txHash, status });
          return;
        }

        if (subscription.confirmationChecks > 20) {
          subscription.status = 'timeout';
          this.triggerAlert('warning', `Transaction confirmation timeout: ${txHash}`, { txHash, attempts: subscription.confirmationChecks });
          return;
        }

        setTimeout(checkTransaction, 5000);
      } catch (error) {
        this.logger.error(`Transaction monitoring error: ${error.message}`);
        setTimeout(checkTransaction, 10000);
      }
    };

    checkTransaction();

    return subscriptionId;
  }

  async getNetworkHealth(): Promise<{
    healthy: boolean;
    score: number;
    details: any;
  }> {
    try {
      const networkStatus = await this.solanaClient.getNetworkStatus();
      const recentBlocks = await this.solanaClient.getRecentBlockhashes();
      const validatorInfo = await this.solanaClient.getValidatorInfo();

      const healthScore = this.calculateNetworkHealthScore(
        networkStatus,
        recentBlocks,
        validatorInfo
      );

      return {
        healthy: healthScore >= 0.8,
        score: healthScore,
        details: {
          networkStatus,
          blockProduction: recentBlocks.length,
          validatorHealth: validatorInfo.health,
          timestamp: Date.now()
        }
      };

    } catch (error) {
      this.logger.error(`Network health check failed: ${error.message}`);
      return {
        healthy: false,
        score: 0,
        details: { error: error.message }
      };
    }
  }

  getMonitorStatus(): any {
    return {
      monitoring: this.isMonitoring,
      config: this.config,
      metrics: this.metrics,
      activeSubscriptions: {
        proofs: this.proofSubscriptions.size,
        transactions: this.transactionWatchers.size
      },
      recentAlerts: this.alerts.slice(-10)
    };
  }

  getAlerts(since?: number): Alert[] {
    return since ? this.alerts.filter(alert => alert.timestamp >= since) : [...this.alerts];
  }

  clearAlerts(): void {
    const count = this.alerts.length;
    this.alerts = [];
    this.logger.info(`Cleared ${count} alerts`);
  }

  private async performInitialHealthCheck(): Promise<void> {
    this.logger.info('Performing initial health check...');

    try {
      const networkHealth = await this.getNetworkHealth();
      if (!networkHealth.healthy) {
        this.triggerAlert('warning', 'Network health check failed initially', networkHealth.details);
      }

      const clientHealth = await this.solanaClient.healthCheck();
      if (!clientHealth.healthy) {
        this.triggerAlert('error', 'Solana client health check failed', clientHealth.details);
      }

      this.logger.info('Initial health check completed');
    } catch (error) {
      this.triggerAlert('error', `Initial health check failed: ${error.message}`);
    }
  }

  private async monitoringCycle(): Promise<void> {
    const cycleStart = Date.now();
    
    try {
      this.logger.debug('Starting monitoring cycle');

      if (this.config.monitorNetwork) {
        await this.checkNetworkHealth();
      }

      if (this.config.monitorProofs) {
        await this.checkProofSubscriptions();
      }

      if (this.config.monitorTransactions) {
        await this.checkTransactionWatchers();
      }

      this.updateMetrics(cycleStart);
      
      this.logger.debug('Monitoring cycle completed');

    } catch (error) {
      this.logger.error(`Monitoring cycle error: ${error.message}`);
      this.triggerAlert('error', `Monitoring cycle error: ${error.message}`);
    }
  }

  private async checkNetworkHealth(): Promise<void> {
    const health = await this.getNetworkHealth();
    
    if (!health.healthy) {
      this.triggerAlert('warning', 'Network health degraded', health.details);
    }

    this.metrics.networkHealth = health.score;
  }

  private async checkProofSubscriptions(): Promise<void> {
    for (const [subscriptionId, subscription] of this.proofSubscriptions.entries()) {
      if (subscription.status === 'pending' && Date.now() - subscription.lastChecked > 60000) {
        this.logger.debug(`Checking proof subscription: ${subscriptionId}`);
        
        try {
          const verification = await this.solanaClient.verifyProofOnChain(
            subscription.proofHash,
            subscription.proofHash
          );

          if (verification.onChain) {
            subscription.status = 'verified';
            this.metrics.proofsVerified++;
            this.triggerAlert('info', `Proof verified: ${subscription.proofHash}`);
          }
        } catch (error) {
          this.logger.warn(`Proof subscription check failed: ${error.message}`);
        }
      }
    }
  }

  private async checkTransactionWatchers(): Promise<void> {
    for (const [watcherId, watcher] of this.transactionWatchers.entries()) {
      if (watcher.status === 'pending' && Date.now() - watcher.lastChecked > 30000) {
        this.logger.debug(`Checking transaction watcher: ${watcherId}`);
        
        try {
          const status = await this.solanaClient.fetchTransactionStatus(watcher.txHash);

          if (status.status === 'confirmed') {
            watcher.status = 'confirmed';
            this.metrics.transactionsProcessed++;
            this.triggerAlert('info', `Transaction confirmed: ${watcher.txHash}`);
          } else if (status.status === 'failed') {
            watcher.status = 'failed';
            this.triggerAlert('error', `Transaction failed: ${watcher.txHash}`);
          }
        } catch (error) {
          this.logger.warn(`Transaction watcher check failed: ${error.message}`);
        }
      }
    }
  }

  private startProofMonitoring(): void {
    this.logger.info('Proof monitoring started');
  }

  private startTransactionMonitoring(): void {
    this.logger.info('Transaction monitoring started');
  }

  private startNetworkMonitoring(): void {
    this.logger.info('Network monitoring started');
  }

  private calculateNetworkHealthScore(
    networkStatus: any,
    recentBlocks: any[],
    validatorInfo: any
  ): number {
    let score = 0.7;

    if (networkStatus.slot > 0) score += 0.1;
    if (recentBlocks.length >= 5) score += 0.1;
    if (validatorInfo.health === 'healthy') score += 0.1;

    return Math.min(1.0, score);
  }

  private triggerAlert(type: 'error' | 'warning' | 'info', message: string, data?: any): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type,
      message,
      timestamp: Date.now(),
      data
    };

    this.alerts.push(alert);
    this.metrics.alertsTriggered++;

    this.logger[type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'info'](`Alert: ${message}`);

    if (this.config.webhookUrl && type !== 'info') {
      this.sendWebhookAlert(alert).catch(error => {
        this.logger.error(`Webhook alert failed: ${error.message}`);
      });
    }

    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-500);
    }
  }

  private async sendWebhookAlert(alert: Alert): Promise<void> {
    if (!this.config.webhookUrl) return;

    const webhookData = {
      monitor: 'solana_monitor',
      alert: {
        id: alert.id,
        type: alert.type,
        message: alert.message,
        timestamp: alert.timestamp,
        data: alert.data
      },
      metrics: this.metrics
    };

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.debug('Webhook alert sent successfully');
    } catch (error) {
      throw new Error(`Webhook send failed: ${error.message}`);
    }
  }

  private updateMetrics(cycleStart: number): void {
    const responseTime = Date.now() - cycleStart;
    
    this.metrics.averageResponseTime = (
      this.metrics.averageResponseTime * 0.9 + responseTime * 0.1
    );

    this.metrics.uptime = Date.now() - this.metrics.startTime;
  }

  private initializeMetrics(): MonitorMetrics {
    return {
      uptime: 0,
      proofsVerified: 0,
      transactionsProcessed: 0,
      alertsTriggered: 0,
      averageResponseTime: 0,
      networkHealth: 1.0,
      startTime: Date.now()
    };
  }

  async emergencyShutdown(): Promise<void> {
    this.logger.warn('Initiating emergency shutdown');
    
    await this.stopMonitoring();
    
    this.proofSubscriptions.clear();
    this.transactionWatchers.clear();
    this.alerts = [];
    
    this.triggerAlert('error', 'Emergency shutdown initiated');
    
    this.logger.warn('Emergency shutdown completed');
  }

  async generateReport(startTime: number, endTime: number = Date.now()): Promise<any> {
    const relevantAlerts = this.alerts.filter(
      alert => alert.timestamp >= startTime && alert.timestamp <= endTime
    );

    const errorAlerts = relevantAlerts.filter(alert => alert.type === 'error');
    const warningAlerts = relevantAlerts.filter(alert => alert.type === 'warning');

    const proofSubscriptionsInPeriod = Array.from(this.proofSubscriptions.values()).filter(
      sub => sub.startTime >= startTime && sub.startTime <= endTime
    );

    const transactionWatchersInPeriod = Array.from(this.transactionWatchers.values()).filter(
      watcher => watcher.startTime >= startTime && watcher.startTime <= endTime
    );

    return {
      period: {
        start: new Date(startTime).toISOString(),
        end: new Date(endTime).toISOString(),
        duration: endTime - startTime
      },
      alerts: {
        total: relevantAlerts.length,
        errors: errorAlerts.length,
        warnings: warningAlerts.length,
        breakdown: this.analyzeAlertPatterns(relevantAlerts)
      },
      monitoring: {
        proofSubscriptions: proofSubscriptionsInPeriod.length,
        transactionWatchers: transactionWatchersInPeriod.length,
        successRate: this.calculateSuccessRate(proofSubscriptionsInPeriod, transactionWatchersInPeriod)
      },
      recommendations: this.generateReportRecommendations(
        errorAlerts,
        warningAlerts,
        proofSubscriptionsInPeriod,
        transactionWatchersInPeriod
      )
    };
  }

  private analyzeAlertPatterns(alerts: Alert[]): any {
    const patterns = {
      timeBased: this.analyzeTimeBasedPatterns(alerts),
      typeBased: this.analyzeTypeBasedPatterns(alerts),
      frequency: alerts.length / ((alerts[alerts.length - 1]?.timestamp || Date.now()) - (alerts[0]?.timestamp || Date.now())) * 1000
    };

    return patterns;
  }

  private analyzeTimeBasedPatterns(alerts: Alert[]): any {
    const hourlyCounts: { [hour: number]: number } = {};
    
    alerts.forEach(alert => {
      const hour = new Date(alert.timestamp).getHours();
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    });

    return hourlyCounts;
  }

  private analyzeTypeBasedPatterns(alerts: Alert[]): any {
    const types: { [type: string]: number } = {};
    
    alerts.forEach(alert => {
      types[alert.type] = (types[alert.type] || 0) + 1;
    });

    return types;
  }

  private calculateSuccessRate(proofSubscriptions: any[], transactionWatchers: any[]): number {
    const total = proofSubscriptions.length + transactionWatchers.length;
    if (total === 0) return 1.0;

    const successful = 
      proofSubscriptions.filter(sub => sub.status === 'verified').length +
      transactionWatchers.filter(watcher => watcher.status === 'confirmed').length;

    return successful / total;
  }

  private generateReportRecommendations(
    errorAlerts: Alert[],
    warningAlerts: Alert[],
    proofSubscriptions: any[],
    transactionWatchers: any[]
  ): string[] {
    const recommendations = [];

    if (errorAlerts.length > 10) {
      recommendations.push('Investigate frequent error alerts to identify root causes');
    }

    if (warningAlerts.length > 20) {
      recommendations.push('Review warning patterns and consider adjusting alert thresholds');
    }

    const proofSuccessRate = proofSubscriptions.length > 0 ? 
      proofSubscriptions.filter(sub => sub.status === 'verified').length / proofSubscriptions.length : 1.0;
    
    if (proofSuccessRate < 0.8) {
      recommendations.push('Improve proof verification success rate by optimizing submission timing');
    }

    const txSuccessRate = transactionWatchers.length > 0 ? 
      transactionWatchers.filter(watcher => watcher.status === 'confirmed').length / transactionWatchers.length : 1.0;
    
    if (txSuccessRate < 0.9) {
      recommendations.push('Monitor transaction failure rates and adjust gas fees if needed');
    }

    if (recommendations.length === 0) {
      recommendations.push('Current monitoring performance meets expected standards');
    }

    return recommendations;
  }

  setWebhook(url: string): void {
    this.config.webhookUrl = url;
    this.logger.info(`Webhook URL set: ${url}`);
  }

  updateConfig(newConfig: Partial<MonitorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Monitor configuration updated');

    if (this.isMonitoring) {
      this.logger.info('Restarting monitoring with new configuration...');
      this.stopMonitoring().then(() => this.startMonitoring());
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const networkHealth = await this.getNetworkHealth();
      const activeSubscriptions = this.proofSubscriptions.size + this.transactionWatchers.size;

      const healthy = networkHealth.healthy && this.isMonitoring;

      return {
        healthy,
        details: {
          monitoring: this.isMonitoring,
          networkHealth: networkHealth.healthy,
          activeSubscriptions,
          recentAlerts: this.alerts.slice(-5).length,
          metrics: this.metrics
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
}

export { SolanaMonitor, MonitorConfig, Alert, MonitorMetrics };