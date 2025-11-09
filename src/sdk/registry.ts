import { Logger } from '../utils/logger';

interface ComponentInfo {
  name: string;
  type: string;
  version: string;
  status: 'registered' | 'initialized' | 'active' | 'degraded' | 'failed';
  dependencies: string[];
  metadata: any;
}

interface RegistryConfig {
  autoInitialize: boolean;
  dependencyChecking: boolean;
  healthCheckInterval: number;
  maxRetries: number;
}

class ComponentRegistry {
  private logger: Logger;
  private config: RegistryConfig;
  private components: Map<string, ComponentInfo>;
  private componentInstances: Map<string, any>;
  private dependencies: Map<string, string[]>;
  private healthCheckInterval: NodeJS.Timeout | null;

  constructor(config: Partial<RegistryConfig> = {}) {
    this.logger = new Logger('ComponentRegistry');
    this.config = this.initializeConfig(config);
    this.components = new Map();
    this.componentInstances = new Map();
    this.dependencies = new Map();
    this.healthCheckInterval = null;

    this.initializeRegistry();
  }

  private initializeConfig(config: Partial<RegistryConfig>): RegistryConfig {
    return {
      autoInitialize: true,
      dependencyChecking: true,
      healthCheckInterval: 60000,
      maxRetries: 3,
      ...config
    };
  }

  private initializeRegistry(): void {
    this.logger.info('Initializing Component Registry');

    if (this.config.healthCheckInterval > 0) {
      this.startHealthMonitoring();
    }

    this.logger.debug('Component Registry initialized');
  }

  registerComponent(
    name: string,
    type: string,
    instance: any,
    dependencies: string[] = [],
    metadata: any = {}
  ): void {
    if (this.components.has(name)) {
      throw new Error(`Component already registered: ${name}`);
    }

    this.logger.info(`Registering component: ${name} (${type})`);

    const componentInfo: ComponentInfo = {
      name,
      type,
      version: metadata.version || '1.0.0',
      status: 'registered',
      dependencies,
      metadata
    };

    this.components.set(name, componentInfo);
    this.componentInstances.set(name, instance);
    this.dependencies.set(name, dependencies);

    if (this.config.autoInitialize) {
      this.initializeComponent(name).catch(error => {
        this.logger.error(`Auto-initialization failed for ${name}: ${error.message}`);
      });
    }

    this.logger.debug(`Component registered: ${name}`);
  }

  async initializeComponent(name: string): Promise<void> {
    const component = this.components.get(name);
    if (!component) {
      throw new Error(`Component not found: ${name}`);
    }

    if (component.status === 'initialized' || component.status === 'active') {
      this.logger.debug(`Component already initialized: ${name}`);
      return;
    }

    this.logger.info(`Initializing component: ${name}`);

    if (this.config.dependencyChecking) {
      await this.initializeDependencies(name);
    }

    const instance = this.componentInstances.get(name);
    
    if (instance && typeof instance.initialize === 'function') {
      try {
        await instance.initialize();
        component.status = 'initialized';
        this.logger.debug(`Component initialized: ${name}`);
      } catch (error) {
        component.status = 'failed';
        this.logger.error(`Component initialization failed: ${name} - ${error.message}`);
        throw error;
      }
    } else {
      component.status = 'active';
      this.logger.debug(`Component marked as active (no initialization required): ${name}`);
    }
  }

  private async initializeDependencies(componentName: string): Promise<void> {
    const dependencies = this.dependencies.get(componentName) || [];
    
    for (const depName of dependencies) {
      const depComponent = this.components.get(depName);
      
      if (!depComponent) {
        throw new Error(`Dependency not found: ${depName} for component ${componentName}`);
      }

      if (depComponent.status === 'registered') {
        await this.initializeComponent(depName);
      }

      if (depComponent.status !== 'initialized' && depComponent.status !== 'active') {
        throw new Error(`Dependency not ready: ${depName} (status: ${depComponent.status})`);
      }
    }

    this.logger.debug(`Dependencies initialized for: ${componentName}`);
  }

  getComponent<T>(name: string): T {
    const instance = this.componentInstances.get(name);
    
    if (!instance) {
      throw new Error(`Component not found: ${name}`);
    }

    const component = this.components.get(name);
    if (component && (component.status === 'failed' || component.status === 'degraded')) {
      this.logger.warn(`Accessing component in degraded state: ${name}`);
    }

    return instance as T;
  }

  getComponentInfo(name: string): ComponentInfo | null {
    return this.components.get(name) || null;
  }

  getAllComponents(): ComponentInfo[] {
    return Array.from(this.components.values());
  }

  getComponentsByType(type: string): ComponentInfo[] {
    return Array.from(this.components.values()).filter(
      component => component.type === type
    );
  }

  getDependencyGraph(): any {
    const graph: any = {};

    this.components.forEach((component, name) => {
      graph[name] = {
        dependencies: this.dependencies.get(name) || [],
        dependents: this.getDependents(name)
      };
    });

    return graph;
  }

  private getDependents(componentName: string): string[] {
    const dependents: string[] = [];

    this.components.forEach((component, name) => {
      const dependencies = this.dependencies.get(name) || [];
      if (dependencies.includes(componentName)) {
        dependents.push(name);
      }
    });

    return dependents;
  }

  async healthCheck(): Promise<{ healthy: boolean; components: any }> {
    const componentHealth: any = {};
    let allHealthy = true;

    for (const [name, component] of this.components.entries()) {
      const instance = this.componentInstances.get(name);
      
      let healthy = false;
      let message = 'No health check available';

      if (instance && typeof instance.healthCheck === 'function') {
        try {
          const health = await instance.healthCheck();
          healthy = health.healthy;
          message = health.details?.message || (healthy ? 'Healthy' : 'Unhealthy');
          
          if (!healthy) {
            allHealthy = false;
            component.status = 'degraded';
          } else {
            component.status = component.status === 'registered' ? 'active' : component.status;
          }
        } catch (error) {
          healthy = false;
          message = `Health check failed: ${error.message}`;
          component.status = 'failed';
          allHealthy = false;
        }
      } else {
        healthy = component.status !== 'failed';
        message = component.status;
      }

      componentHealth[name] = { healthy, message, status: component.status };
    }

    return {
      healthy: allHealthy,
      components: componentHealth
    };
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.healthCheck();
        this.logger.debug('Periodic health check completed');
      } catch (error) {
        this.logger.error(`Periodic health check failed: ${error.message}`);
      }
    }, this.config.healthCheckInterval);

    this.logger.debug(`Health monitoring started (interval: ${this.config.healthCheckInterval}ms)`);
  }

  updateComponentStatus(name: string, status: ComponentInfo['status']): void {
    const component = this.components.get(name);
    
    if (component) {
      const oldStatus = component.status;
      component.status = status;
      
      this.logger.debug(`Component status updated: ${name} ${oldStatus} -> ${status}`);
    }
  }

  async repairComponent(name: string): Promise<{ repaired: boolean; message: string }> {
    const component = this.components.get(name);
    
    if (!component) {
      return { repaired: false, message: `Component not found: ${name}` };
    }

    this.logger.info(`Attempting to repair component: ${name}`);

    try {
      const instance = this.componentInstances.get(name);
      
      if (instance && typeof instance.repair === 'function') {
        await instance.repair();
      } else if (instance && typeof instance.initialize === 'function') {
        await instance.initialize();
      } else {
        return { repaired: false, message: 'No repair method available' };
      }

      component.status = 'active';
      this.logger.info(`Component repaired: ${name}`);

      return { repaired: true, message: 'Component repaired successfully' };

    } catch (error) {
      this.logger.error(`Component repair failed: ${name} - ${error.message}`);
      return { repaired: false, message: `Repair failed: ${error.message}` };
    }
  }

  unregisterComponent(name: string): boolean {
    const component = this.components.get(name);
    
    if (!component) {
      return false;
    }

    const dependents = this.getDependents(name);
    if (dependents.length > 0) {
      throw new Error(`Cannot unregister component with dependents: ${name} (dependents: ${dependents.join(', ')})`);
    }

    const instance = this.componentInstances.get(name);
    
    if (instance && typeof instance.shutdown === 'function') {
      try {
        instance.shutdown();
      } catch (error) {
        this.logger.warn(`Component shutdown failed during unregister: ${name} - ${error.message}`);
      }
    }

    this.components.delete(name);
    this.componentInstances.delete(name);
    this.dependencies.delete(name);

    this.logger.info(`Component unregistered: ${name}`);

    return true;
  }

  getRegistryMetrics(): any {
    const componentsByStatus: any = {};
    
    this.components.forEach(component => {
      componentsByStatus[component.status] = (componentsByStatus[component.status] || 0) + 1;
    });

    return {
      totalComponents: this.components.size,
      componentsByStatus,
      componentsByType: this.getComponentsByTypeCount(),
      dependencyDepth: this.calculateDependencyDepth(),
      health: this.calculateOverallHealth()
    };
  }

  private getComponentsByTypeCount(): any {
    const counts: any = {};
    
    this.components.forEach(component => {
      counts[component.type] = (counts[component.type] || 0) + 1;
    });

    return counts;
  }

  private calculateDependencyDepth(): number {
    let maxDepth = 0;

    this.components.forEach((_, name) => {
      const depth = this.calculateComponentDepth(name);
      maxDepth = Math.max(maxDepth, depth);
    });

    return maxDepth;
  }

  private calculateComponentDepth(componentName: string, visited: Set<string> = new Set()): number {
    if (visited.has(componentName)) {
      return 0;
    }

    visited.add(componentName);

    const dependencies = this.dependencies.get(componentName) || [];
    
    if (dependencies.length === 0) {
      return 1;
    }

    const depths = dependencies.map(dep => this.calculateComponentDepth(dep, new Set(visited)));
    return Math.max(...depths) + 1;
  }

  private calculateOverallHealth(): string {
    const statuses = Array.from(this.components.values()).map(c => c.status);
    
    if (statuses.includes('failed')) {
      return 'degraded';
    } else if (statuses.includes('degraded')) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }

  updateConfig(newConfig: Partial<RegistryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Registry configuration updated');

    if (this.healthCheckInterval && newConfig.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.startHealthMonitoring();
    }
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down component registry');

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    for (const [name, instance] of this.componentInstances.entries()) {
      if (typeof instance.shutdown === 'function') {
        try {
          await instance.shutdown();
          this.logger.debug(`Component shutdown: ${name}`);
        } catch (error) {
          this.logger.warn(`Component shutdown failed: ${name} - ${error.message}`);
        }
      }
    }

    this.components.clear();
    this.componentInstances.clear();
    this.dependencies.clear();

    this.logger.info('Component registry shutdown completed');
  }

  clearRegistry(): void {
    this.logger.info('Clearing component registry');

    this.components.clear();
    this.componentInstances.clear();
    this.dependencies.clear();

    this.logger.info('Component registry cleared');
  }

  exportRegistryState(): any {
    return {
      config: this.config,
      components: this.getAllComponents(),
      dependencyGraph: this.getDependencyGraph(),
      metrics: this.getRegistryMetrics()
    };
  }

  importRegistryState(state: any): void {
    this.logger.info('Importing registry state');

    this.config = state.config;
    this.components.clear();
    this.componentInstances.clear();
    this.dependencies.clear();

    state.components.forEach((component: ComponentInfo) => {
      this.components.set(component.name, component);
    });

    this.logger.info('Registry state imported');
  }
}

export { ComponentRegistry, ComponentInfo, RegistryConfig };