import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface ErrorEntry {
  id: string;
  timestamp: string;
  source: 'backend' | 'frontend-web' | 'frontend-admin';
  type: string;
  message: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  request?: {
    method?: string;
    url?: string;
    ip?: string;
    userId?: string;
  };
}

@Injectable()
export class FileLoggerService {
  private readonly logDir: string;
  private readonly logFile: string;
  private readonly writeQueue: ErrorEntry[] = [];
  private isWriting = false;

  constructor() {
    this.logDir = process.env.ERROR_LOG_DIR || path.join(process.cwd(), 'logs');
    this.logFile = path.join(this.logDir, 'errors.json');
    this.ensureLogDir();
  }

  private ensureLogDir() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
      if (!fs.existsSync(this.logFile)) {
        fs.writeFileSync(this.logFile, JSON.stringify({ errors: [] }, null, 2));
      }
    } catch (err) {
      console.error('[FileLogger] Failed to initialize log directory:', err);
    }
  }

  logError(entry: Omit<ErrorEntry, 'id' | 'timestamp'>) {
    const fullEntry: ErrorEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.writeQueue.push(fullEntry);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isWriting || this.writeQueue.length === 0) return;

    this.isWriting = true;

    while (this.writeQueue.length > 0) {
      const entry = this.writeQueue.shift()!;
      try {
        await this.appendToFile(entry);
      } catch (err) {
        console.error('[FileLogger] Failed to write error:', err);
        // Re-queue on failure
        this.writeQueue.unshift(entry);
        break;
      }
    }

    this.isWriting = false;
  }

  private appendToFile(entry: ErrorEntry): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        let data: { errors: ErrorEntry[] };

        const raw = fs.readFileSync(this.logFile, 'utf-8');
        try {
          data = JSON.parse(raw);
          if (!Array.isArray(data.errors)) {
            data = { errors: [] };
          }
        } catch {
          data = { errors: [] };
        }

        data.errors.push(entry);

        // Keep only the last 1000 errors to prevent file from growing too large
        if (data.errors.length > 1000) {
          data.errors = data.errors.slice(-1000);
        }

        fs.writeFileSync(this.logFile, JSON.stringify(data, null, 2));
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }
}
