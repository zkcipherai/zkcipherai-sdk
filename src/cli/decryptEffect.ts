import { Logger } from '../utils/logger';

const MESSAGE = "Cipher Stream Online: zkCipherAI Engine Ready";
const CHARS = "01abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-=[]{}|;:,.<>?~";
const COLORS = {
  green: '\x1b[32m',
  brightGreen: '\x1b[92m',
  cyan: '\x1b[36m',
  brightCyan: '\x1b[96m',
  reset: '\x1b[0m'
};

class DecryptEffect {
  private logger: Logger;
  private width: number;
  private height: number;
  private streams: Stream[];
  private isRunning: boolean;

  constructor() {
    this.logger = new Logger('DecryptEffect');
    this.width = process.stdout.columns || 80;
    this.height = Math.min(process.stdout.rows || 24, 30);
    this.streams = [];
    this.isRunning = false;
    this.initializeStreams();
  }

  private initializeStreams(): void {
    const streamCount = Math.floor(this.width / 3);
    
    for (let i = 0; i < streamCount; i++) {
      this.streams.push(new Stream(
        i * 3,
        Math.random() * this.height,
        Math.random() * 5 + 3
      ));
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    process.stdout.write('\x1b[?25l');
    process.stdout.write('\x1b[2J');
    process.stdout.write('\x1b[H');

    try {
      await this.runMatrixEffect();
      await this.revealMessage();
      await this.displayReadyState();
    } catch (error) {
      this.logger.error(`Decrypt effect failed: ${error.message}`);
    } finally {
      process.stdout.write('\x1b[?25h');
      this.isRunning = false;
    }
  }

  private async runMatrixEffect(): Promise<void> {
    const duration = 3000;
    const startTime = Date.now();
    
    while (Date.now() - startTime < duration) {
      this.updateStreams();
      this.renderFrame();
      await this.sleep(50);
    }
  }

  private updateStreams(): void {
    this.streams.forEach(stream => {
      stream.update();
      
      if (stream.y > this.height + stream.length) {
        stream.reset(this.width);
      }
    });
  }

  private renderFrame(): void {
    const frame: string[][] = Array.from({ length: this.height }, () => 
      Array(this.width).fill(' ')
    );

    this.streams.forEach(stream => {
      for (let i = 0; i < stream.length; i++) {
        const y = Math.floor(stream.y - i);
        if (y >= 0 && y < this.height) {
          const char = i === 0 ? this.getRandomChar() : stream.chars[i];
          const color = i === 0 ? COLORS.brightGreen : 
                       i === 1 ? COLORS.green : 
                       COLORS.cyan;
          
          frame[y][stream.x] = `${color}${char}${COLORS.reset}`;
        }
      }
    });

    this.drawFrame(frame);
  }

  private drawFrame(frame: string[][]): void {
    process.stdout.write('\x1b[H');
    
    for (let y = 0; y < this.height; y++) {
      let line = '';
      for (let x = 0; x < this.width; x++) {
        line += frame[y][x] || ' ';
      }
      console.log(line);
    }
  }

  private async revealMessage(): Promise<void> {
    const centerX = Math.floor((this.width - MESSAGE.length) / 2);
    const centerY = Math.floor(this.height / 2);
    
    const scrambledMessage = this.scrambleMessage(MESSAGE);
    
    for (let step = 0; step < 20; step++) {
      this.renderRevealStep(scrambledMessage, centerX, centerY, step);
      await this.sleep(80);
    }
    
    this.renderFinalMessage(centerX, centerY);
    await this.sleep(1000);
  }

  private scrambleMessage(message: string): string {
    return message.split('').map(char => 
      char === ' ' ? ' ' : CHARS[Math.floor(Math.random() * CHARS.length)]
    ).join('');
  }

  private renderRevealStep(scrambled: string, centerX: number, centerY: number, step: number): void {
    process.stdout.write('\x1b[H');
    
    for (let y = 0; y < this.height; y++) {
      let line = '';
      for (let x = 0; x < this.width; x++) {
        if (y === centerY && x >= centerX && x < centerX + MESSAGE.length) {
          const index = x - centerX;
          const progress = (step / 20) * MESSAGE.length;
          
          if (index < progress) {
            line += `${COLORS.brightCyan}${MESSAGE[index]}${COLORS.reset}`;
          } else {
            line += `${COLORS.green}${scrambled[index]}${COLORS.reset}`;
          }
        } else {
          line += ' ';
        }
      }
      console.log(line);
    }
  }

  private renderFinalMessage(centerX: number, centerY: number): void {
    process.stdout.write('\x1b[H');
    
    for (let y = 0; y < this.height; y++) {
      let line = '';
      for (let x = 0; x < this.width; x++) {
        if (y === centerY && x >= centerX && x < centerX + MESSAGE.length) {
          const index = x - centerX;
          line += `${COLORS.brightCyan}${MESSAGE[index]}${COLORS.reset}`;
        } else if (y === centerY + 2 && x >= centerX - 5 && x < centerX + MESSAGE.length + 5) {
          line += `${COLORS.green}═${COLORS.reset}`;
        } else {
          line += ' ';
        }
      }
      console.log(line);
    }
  }

  private async displayReadyState(): Promise<void> {
    const statusLines = [
      '┌────────────────────────────────────────┐',
      '│           zkCipherAI v1.0.0            │',
      '├────────────────────────────────────────┤',
      '│   🔐  Encryption Engine: ACTIVE        │',
      '│   🧠  AI Bridge: SYNCHRONIZED          │',
      '│   🧩  ZK Proof System: READY           │',
      '│   🌐  Solana Network: CONNECTED        │',
      '│   🛡️   Privacy Shield: MAXIMUM          │',
      '└────────────────────────────────────────┘',
      '',
      `${COLORS.brightGreen}System initialized and ready for secure operations${COLORS.reset}`,
      ''
    ];

    process.stdout.write('\x1b[H');
    
    const startY = Math.floor((this.height - statusLines.length) / 2);
    
    for (let y = 0; y < this.height; y++) {
      let line = '';
      for (let x = 0; x < this.width; x++) {
        const lineIndex = y - startY;
        if (lineIndex >= 0 && lineIndex < statusLines.length) {
          const statusLine = statusLines[lineIndex];
          const lineStartX = Math.floor((this.width - statusLine.length) / 2);
          
          if (x >= lineStartX && x < lineStartX + statusLine.length) {
            const char = statusLine[x - lineStartX];
            if (char !== ' ') {
              line += `${COLORS.cyan}${char}${COLORS.reset}`;
            } else {
              line += ' ';
            }
          } else {
            line += ' ';
          }
        } else {
          line += ' ';
        }
      }
      console.log(line);
    }

    await this.sleep(2000);
  }

  private getRandomChar(): string {
    return CHARS[Math.floor(Math.random() * CHARS.length)];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class Stream {
  x: number;
  y: number;
  length: number;
  speed: number;
  chars: string[];

  constructor(x: number, y: number, length: number) {
    this.x = x;
    this.y = y;
    this.length = length;
    this.speed = Math.random() * 0.5 + 0.2;
    this.chars = Array.from({ length }, () => 
      CHARS[Math.floor(Math.random() * CHARS.length)]
    );
  }

  update(): void {
    this.y += this.speed;
  }

  reset(width: number): void {
    this.y = -this.length;
    this.x = Math.floor(Math.random() * width);
    this.speed = Math.random() * 0.5 + 0.2;
  }
}

function decryptEffect(): void {
  const effect = new DecryptEffect();
  effect.start().catch(console.error);
}

export { decryptEffect, DecryptEffect };