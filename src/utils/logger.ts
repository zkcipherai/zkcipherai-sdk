export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  colors: boolean;
  timestamps: boolean;
  module: string;
  pulseAnimation: boolean;
}

class Logger {
  private config: LoggerConfig;
  private pulseInterval: NodeJS.Timeout | null;
  private pulseFrames: string[];
  private pulseFrameIndex: number;

  constructor(module: string, config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: 'info',
      colors: true,
      timestamps: true,
      module,
      pulseAnimation: true,
      ...config
    };

    this.pulseInterval = null;
    this.pulseFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.pulseFrameIndex = 0;

    this.initializePulseAnimation();
  }

  private initializePulseAnimation(): void {
    if (this.config.pulseAnimation && typeof process !== 'undefined' && process.stdout) {
      this.pulseInterval = setInterval(() => {
        this.pulseFrameIndex = (this.pulseFrameIndex + 1) % this.pulseFrames.length;
      }, 80);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      this.log('debug', message, args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      this.log('info', message, args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      this.log('warn', message, args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      this.log('error', message, args);
    }
  }

  success(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      this.log('success', message, args);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  private log(level: LogLevel, message: string, args: any[]): void {
    const timestamp = this.config.timestamps ? this.getTimestamp() : '';
    const module = this.colorize(`[${this.config.module}]`, 'module');
    const levelFormatted = this.formatLevel(level);
    const messageFormatted = this.colorize(message, level);

    let logLine = '';

    if (this.config.timestamps) {
      logLine += `${timestamp} `;
    }

    if (this.config.pulseAnimation && level === 'info') {
      const pulseFrame = this.pulseFrames[this.pulseFrameIndex];
      logLine += `${this.colorize(pulseFrame, 'pulse')} `;
    }

    logLine += `${module} ${levelFormatted} ${messageFormatted}`;

    if (args.length > 0) {
      const formattedArgs = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
      );
      logLine += ` ${formattedArgs.join(' ')}`;
    }

    this.writeToConsole(level, logLine);
  }

  private formatLevel(level: LogLevel): string {
    const levelConfig = {
      debug: { symbol: '⚡', color: 'gray' },
      info: { symbol: 'ℹ️', color: 'cyan' },
      warn: { symbol: '⚠️', color: 'yellow' },
      error: { symbol: '❌', color: 'red' },
      success: { symbol: '✅', color: 'green' }
    };

    const config = levelConfig[level] || levelConfig.info;
    return this.colorize(`${config.symbol} ${level.toUpperCase()}`, config.color as any);
  }

  private colorize(text: string, style: 'debug' | 'info' | 'warn' | 'error' | 'success' | 'module' | 'pulse' | 'gray' | 'cyan' | 'yellow' | 'red' | 'green'): string {
    if (!this.config.colors) {
      return text;
    }

    const colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      dim: '\x1b[2m',
      
      // Colors
      black: '\x1b[30m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      gray: '\x1b[90m',

      // Background
      bgBlack: '\x1b[40m',
      bgRed: '\x1b[41m',
      bgGreen: '\x1b[42m',
      bgYellow: '\x1b[43m',
      bgBlue: '\x1b[44m',
      bgMagenta: '\x1b[45m',
      bgCyan: '\x1b[46m',
      bgWhite: '\x1b[47m'
    };

    const styleConfig = {
      debug: colors.gray,
      info: colors.cyan,
      warn: colors.yellow,
      error: colors.red,
      success: colors.green,
      module: colors.magenta + colors.bright,
      pulse: colors.cyan + colors.bright,
      gray: colors.gray,
      cyan: colors.cyan,
      yellow: colors.yellow,
      red: colors.red,
      green: colors.green
    };

    const colorCode = styleConfig[style] || colors.reset;
    return `${colorCode}${text}${colors.reset}`;
  }

  private getTimestamp(): string {
    const now = new Date();
    const timeString = now.toISOString().replace('T', ' ').substring(0, 19);
    return this.colorize(timeString, 'gray');
  }

  private writeToConsole(level: LogLevel, message: string): void {
    const consoleMethod = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error,
      success: console.log
    }[level] || console.log;

    consoleMethod(message);
  }

  startDecryptAnimation(message: string = "Cipher Stream Online: zkCipherAI Engine Ready"): void {
    if (!this.config.colors || !this.config.pulseAnimation) {
      console.log(`🔐 ${message}`);
      return;
    }

    this.animateDecryption(message);
  }

  private animateDecryption(message: string): void {
    const frames = this.generateDecryptFrames(message);
    let frameIndex = 0;

    const animationInterval = setInterval(() => {
      process.stdout.write('\r' + frames[frameIndex]);
      frameIndex = (frameIndex + 1) % frames.length;
    }, 100);

    setTimeout(() => {
      clearInterval(animationInterval);
      process.stdout.write('\r' + ' '.repeat(process.stdout.columns || 80) + '\r');
      console.log(this.colorize('🔐 ' + message, 'success'));
    }, 2000);
  }

  private generateDecryptFrames(message: string): string[] {
    const frames: string[] = [];
    const chars = "01█▓▒░█▓▒░█▓▒░";
    
    for (let i = 0; i < 20; i++) {
      let frame = '';
      for (let j = 0; j < message.length; j++) {
        if (j < i) {
          frame += this.colorize(message[j], 'cyan');
        } else {
          const randomChar = chars[Math.floor(Math.random() * chars.length)];
          frame += this.colorize(randomChar, 'green');
        }
      }
      frames.push(frame);
    }

    return frames;
  }

  pulse(message: string, duration: number = 3000): Promise<void> {
    return new Promise((resolve) => {
      if (!this.config.pulseAnimation) {
        console.log(this.colorize('⏳ ' + message, 'info'));
        setTimeout(resolve, duration);
        return;
      }

      const startTime = Date.now();
      const pulseInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const pulseFrame = this.pulseFrames[this.pulseFrameIndex];
        
        const progressBar = this.createProgressBar(progress, 20);
        process.stdout.write(`\r${pulseFrame} ${message} ${progressBar}`);
      }, 80);

      setTimeout(() => {
        clearInterval(pulseInterval);
        process.stdout.write('\r' + ' '.repeat(process.stdout.columns || 80) + '\r');
        console.log(this.colorize('✅ ' + message + ' completed', 'success'));
        resolve();
      }, duration);
    });
  }

  private createProgressBar(progress: number, length: number): string {
    const completed = Math.floor(progress * length);
    const remaining = length - completed;
    
    const completedBar = this.colorize('█'.repeat(completed), 'green');
    const remainingBar = this.colorize('░'.repeat(remaining), 'gray');
    
    const percentage = Math.floor(progress * 100);
    return `[${completedBar}${remainingBar}] ${percentage.toString().padStart(3)}%`;
  }

  table(data: any[], columns?: string[]): void {
    if (data.length === 0) {
      this.info('No data to display');
      return;
    }

    const columnNames = columns || Object.keys(data[0]);
    const columnWidths: { [key: string]: number } = {};

    columnNames.forEach(col => {
      columnWidths[col] = Math.max(
        col.length,
        ...data.map(row => String(row[col] || '').length)
      );
    });

    const header = columnNames.map(col => 
      this.colorize(col.padEnd(columnWidths[col]), 'module')
    ).join(' | ');

    const separator = columnNames.map(col => 
      '─'.repeat(columnWidths[col])
    ).join('─┼─');

    console.log(header);
    console.log(separator);

    data.forEach(row => {
      const rowData = columnNames.map(col => 
        String(row[col] || '').padEnd(columnWidths[col])
      ).join(' | ');
      console.log(rowData);
    });
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
    this.info(`Log level set to: ${level}`);
  }

  enableColors(): void {
    this.config.colors = true;
  }

  disableColors(): void {
    this.config.colors = false;
  }

  enableTimestamps(): void {
    this.config.timestamps = true;
  }

  disableTimestamps(): void {
    this.config.timestamps = false;
  }

  enablePulseAnimation(): void {
    this.config.pulseAnimation = true;
    this.initializePulseAnimation();
  }

  disablePulseAnimation(): void {
    this.config.pulseAnimation = false;
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = null;
    }
  }

  createChildLogger(module: string): Logger {
    return new Logger(`${this.config.module}:${module}`, this.config);
  }

  destroy(): void {
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = null;
    }
  }
}

export { Logger, LogLevel, LoggerConfig };