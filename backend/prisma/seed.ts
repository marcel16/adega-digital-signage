import { PrismaClient, UserRole, TenantStatus, TvStatus, MidiaType, MidiaStatus, CampanhaStatus, PlanoStatus, DiaSemana, PlaylistTipo } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  const hashedPassword = await argon2.hash('Admin@123456');

  // Planos
  const planos = [
    {
      nome: 'Gratuito',
      slug: 'gratuito',
      descricao: 'Para testar a plataforma',
      valor: 0,
      ciclo: 'monthly',
      maxEstabelecimentos: 1,
      maxTvs: 1,
      maxMidias: 10,
      maxArmazenamentoMb: 100,
      recursos: JSON.stringify(['1 estabelecimento', '1 TV', '10 mídias', '100MB armazenamento']),
      status: PlanoStatus.active,
      ordem: 1,
      destaque: false,
    },
    {
      nome: 'Profissional',
      slug: 'profissional',
      descricao: 'Para pequenos negócios',
      valor: 49.90,
      ciclo: 'monthly',
      maxEstabelecimentos: 3,
      maxTvs: 5,
      maxMidias: 100,
      maxArmazenamentoMb: 1000,
      recursos: JSON.stringify(['3 estabelecimentos', '5 TVs', '100 mídias', '1GB armazenamento', 'Agendamento', 'Campanhas']),
      status: PlanoStatus.active,
      ordem: 2,
      destaque: true,
    },
    {
      nome: 'Enterprise',
      slug: 'enterprise',
      descricao: 'Para redes de estabelecimentos',
      valor: 199.90,
      ciclo: 'monthly',
      maxEstabelecimentos: 999,
      maxTvs: 999,
      maxMidias: 9999,
      maxArmazenamentoMb: 10000,
      recursos: JSON.stringify(['Estabelecimentos ilimitados', 'TVs ilimitadas', 'Mídias ilimitadas', '10GB armazenamento', 'Prioridade máxima', 'Suporte VIP']),
      status: PlanoStatus.active,
      ordem: 3,
      destaque: false,
    },
  ];

  for (const plano of planos) {
    await prisma.plano.upsert({
      where: { slug: plano.slug },
      update: plano,
      create: plano,
    });
  }

  // Super Admin
  const superAdmin = await prisma.usuario.upsert({
    where: { email: 'admin@adegasignage.com' },
    update: {},
    create: {
      email: 'admin@adegasignage.com',
      passwordHash: hashedPassword,
      nome: 'Super Admin',
      role: UserRole.super_admin,
      tenantId: '00000000-0000-0000-0000-000000000000',
    },
  });

  // Tenant de exemplo
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'adega-exemplo' },
    update: {},
    create: {
      nome: 'Adega Exemplo',
      slug: 'adega-exemplo',
      documento: '00.000.000/0001-00',
      email: 'contato@adegaexemplo.com',
      telefone: '(11) 99999-8888',
      status: TenantStatus.active,
      planoTipo: 'profissional',
      maxEstabelecimentos: 3,
      maxTvs: 5,
      maxMidias: 100,
      maxArmazenamentoMb: 1000,
    },
  });

  // Admin do tenant
  const tenantAdmin = await prisma.usuario.upsert({
    where: { email: 'admin@adegaexemplo.com' },
    update: {},
    create: {
      email: 'admin@adegaexemplo.com',
      passwordHash: hashedPassword,
      nome: 'Admin Adega',
      role: UserRole.admin,
      tenantId: tenant.id,
      telefone: '(11) 99999-8888',
    },
  });

  // Estabelecimento
  const estabelecimento = await prisma.estabelecimento.upsert({
    where: { slug: 'adega-matriz' },
    update: {},
    create: {
      nome: 'Adega Matriz',
      slug: 'adega-matriz',
      documento: '00.000.000/0001-00',
      endereco: 'Rua das Adegas, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01000-000',
      telefone: '(11) 99999-8888',
      tenantId: tenant.id,
    },
  });

  // TVs
  const tv = await prisma.tv.upsert({
    where: { identificador: 'TV-001' },
    update: {},
    create: {
      nome: 'TV Balcão',
      identificador: 'TV-001',
      descricao: 'TV principal do balcão',
      modelo: 'Samsung 50"',
      resolucao: '1920x1080',
      status: TvStatus.online,
      estabelecimentoId: estabelecimento.id,
      tenantId: tenant.id,
    },
  });

  // Assinatura e fatura
  await prisma.assinatura.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      planoTipo: 'profissional',
      status: 'active',
      dataInicio: new Date(),
      valor: 49.90,
      ciclo: 'monthly',
    },
  });

  console.log('✅ Seed concluído!');
  console.log('📧 admin@adegasignage.com / Admin@123456');
  console.log('📧 admin@adegaexemplo.com / Admin@123456');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });