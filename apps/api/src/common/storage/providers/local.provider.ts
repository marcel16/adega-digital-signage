import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuid } from 'uuid';
import { StorageProvider } from '../storage.service';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly basePath: string;

  constructor() {
    this.basePath = process.env.UPLOAD_DIR || path.join(process.cwd(), 'storage', 'uploads');
    this.ensureBasePath();
  }

  private async ensureBasePath(): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create upload directory', error);
    }
  }

  private getFullPath(key: string): string {
    return path.join(this.basePath, key);
  }

  async upload(file: Express.Multer.File, filePath?: string): Promise<string> {
    const ext = path.extname(file.originalname);
    const fileName = filePath || `${uuid()}${ext}`;
    const fullPath = this.getFullPath(fileName);

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, file.buffer);
    this.logger.log(`File uploaded: ${fileName}`);
    return fileName;
  }

  async download(key: string): Promise<Buffer> {
    const fullPath = this.getFullPath(key);
    return fs.readFile(fullPath);
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.getFullPath(key);
    try {
      await fs.unlink(fullPath);
      this.logger.log(`File deleted: ${key}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  getUrl(key: string): string {
    return `/storage/uploads/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = this.getFullPath(key);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
