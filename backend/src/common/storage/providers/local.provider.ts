import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { StorageProvider } from '../storage.service';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private basePath: string;

  constructor() {
    this.basePath = process.env.STORAGE_PATH || path.join(process.cwd(), 'storage', 'midias');
    this.ensureBasePath();
  }

  private async ensureBasePath() {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (err) {
      this.logger.error('Erro ao criar diretório storage:', err);
    }
  }

  private getFullPath(key: string): string {
    return path.join(this.basePath, key);
  }

  async upload(key: string, buffer: Buffer, mimetype: string): Promise<string> {
    const fullPath = this.getFullPath(key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);
    return this.getUrl(key);
  }

  async download(key: string): Promise<Buffer> {
    return fs.readFile(this.getFullPath(key));
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.getFullPath(key));
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  getUrl(key: string): string {
    return `/storage/midias/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.getFullPath(key));
      return true;
    } catch {
      return false;
    }
  }
}