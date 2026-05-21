import { Injectable, Logger } from '@nestjs/common';
import { LocalStorageProvider } from './providers/local.provider';
import { S3StorageProvider } from './providers/s3.provider';

export interface StorageProvider {
  upload(file: Express.Multer.File, path: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
  exists(key: string): Promise<boolean>;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private provider: StorageProvider;

  constructor(
    private localProvider: LocalStorageProvider,
    private s3Provider: S3StorageProvider,
  ) {
    this.provider = process.env.STORAGE_DRIVER === 's3' ? this.s3Provider : this.localProvider;
    this.logger.log(`Storage provider: ${process.env.STORAGE_DRIVER || 'local'}`);
  }

  getProvider(): StorageProvider {
    return this.provider;
  }

  async upload(file: Express.Multer.File, path: string): Promise<string> {
    return this.provider.upload(file, path);
  }

  async download(key: string): Promise<Buffer> {
    return this.provider.download(key);
  }

  async delete(key: string): Promise<void> {
    return this.provider.delete(key);
  }

  getUrl(key: string): string {
    return this.provider.getUrl(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.provider.exists(key);
  }
}
