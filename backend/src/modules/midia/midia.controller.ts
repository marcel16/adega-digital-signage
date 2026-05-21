import {
  Controller, Get, Post, Body, Param, Put, Delete, Query,
  UseGuards, UseInterceptors, UploadedFile, Res, Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { MidiaService } from './midia.service';
import { CreateMidiaDto } from './dto/create-midia.dto';
import { UpdateMidiaDto } from './dto/update-midia.dto';
import { MidiaFilterDto } from './dto/midia-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Mídias')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('midias')
export class MidiaController {
  constructor(private midiaService: MidiaService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Fazer upload de mídia' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        nome: { type: 'string' },
        descricao: { type: 'string' },
        tags: { type: 'string' },
        pasta: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata: CreateMidiaDto,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) throw new Error('Arquivo não enviado');
    if (!metadata.nome) metadata.nome = file.originalname;
    return this.midiaService.upload(file, metadata, tenantId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar mídias' })
  findAll(@Query() filters: MidiaFilterDto, @TenantId() tenantId: string) {
    return this.midiaService.findAll(tenantId, filters);
  }

  @Get('storage/usage')
  @ApiOperation({ summary: 'Uso de armazenamento do tenant' })
  getStorageUsage(@TenantId() tenantId: string) {
    return this.midiaService.getStorageUsage(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter mídia por ID' })
  findById(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.midiaService.findById(id, tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar metadados da mídia' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMidiaDto,
    @TenantId() tenantId: string,
  ) {
    return this.midiaService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover mídia' })
  delete(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.midiaService.delete(id, tenantId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Baixar arquivo da mídia' })
  @Header('Content-Disposition', 'attachment')
  async download(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Res() res: Response,
  ) {
    const { buffer, mimetype, nome } = await this.midiaService.download(id, tenantId);
    res.setHeader('Content-Type', mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
    res.send(buffer);
  }
}