import { Block, Cell } from '../data/types';

class GameLogger {
    private static instance: GameLogger;
    private readonly LOG_KEY = 'game_logs';

    private constructor() {
        this.clearLogs();
    }

    public static getInstance(): GameLogger {
        if (!GameLogger.instance) {
            GameLogger.instance = new GameLogger();
        }
        return GameLogger.instance;
    }

    public clearLogs(): void {
        try {
            localStorage.setItem(this.LOG_KEY, '');
        } catch (error) {
      // swallow
        }
    }

    public logBlocks(blocks: any[]): void {
        try {
            const timestamp = new Date().toISOString();
            const logEntry = `[${timestamp}] Generated blocks:\n${blocks.map(block => 
                `  - ${block.name} (${block.difficulty}):\n    ${block.matrix.map((row: Cell[]) => row.join(' ')).join('\n    ')}`
            ).join('\n')}\n\n`;
            
            const currentLogs = localStorage.getItem(this.LOG_KEY) || '';
            localStorage.setItem(this.LOG_KEY, currentLogs + logEntry);
        } catch (error) {
      // swallow
        }
    }

    public getLogs(): string {
        return localStorage.getItem(this.LOG_KEY) || '';
    }

  public async sendClientLog(_event: string, _data?: any) { /* disabled */ }
}

export const gameLogger = GameLogger.getInstance(); 