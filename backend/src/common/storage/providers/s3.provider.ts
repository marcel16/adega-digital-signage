import { Injectable, Logger } from '@nestjs/common';
import { StorageProvider } from '../storage.service';

@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly logger = new Logger(S3StorageProvider.name);
  private client: any;

  constructor() {
    this.logger.log('S3 provider inicializado (placeholder - implementar com @aws-sdk/client-s3)');
  }

  async upload(key: string, buffer: Buffer, mimetype: string): Promise<string> {
    throw new Error('S3 não implementado. Configure STORAGE_DRIVER=local');
  }

  async download(key: string): Promise<Buffer> {
    throw new Error('S3 não implementado');
  }

  async delete(key: string): Promise<void> {
    throw new Error('S3 não implementado');
  }

  getUrl(key: string): string {
    return `/storage/midias/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    return false;
  }
}