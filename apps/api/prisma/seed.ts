import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create plans
  const plans = [
    {
      name: 'Free',
      slug: 'free',
      description: 'Plano gratuito para testes',
      price: 0,
      cycle: 'monthly',
      maxStores: 1,
      maxTvs: 1,
      maxMedia: 50,
      maxStorageMb: 500,
      sortOrder: 0,
    },
    {
      name: 'Starter',
      slug: 'starter',
      description: 'Plano inicial para pequenos negócios',
      price: 29.9,
      cycle: 'monthly',
      maxStores: 2,
      maxTvs: 5,
      maxMedia: 200,
      maxStorageMb: 2000,
      recommended: true,
      sortOrder: 1,
    },
    {
      name: 'Professional',
      slug: 'professional',
      description: 'Plano profissional para médias empresas',
      price: 79.9,
      cycle: 'monthly',
      maxStores: 5,
      maxTvs: 20,
      maxMedia: 1000,
      maxStorageMb: 10000,
      sortOrder: 2,
    },
    {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Plano enterprise para grandes redes',
      price: 199.9,
      cycle: 'monthly',
      maxStores: 999,
      maxTvs: 999,
      maxMedia: 9999,
      maxStorageMb: 50000,
      sortOrder: 3,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }
  console.log('✅ Plans created');

  // 2. Create SUPER_ADMIN user (no tenant)
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@adegasignage.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminPasswordHash = await argon2.hash(adminPassword);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
      tenantId: '00000000-0000-0000-0000-000000000000',
    },
  });
  console.log('✅ SUPER_ADMIN user created');

  // 3. Create sample tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'adega-exemplo' },
    update: {},
    create: {
      name: 'Adega Exemplo',
      slug: 'adega-exemplo',
      document: '00.000.000/0001-00',
      email: 'contato@adegaexemplo.com.br',
      phone: '(11) 99999-9999',
      status: 'ACTIVE',
      planType: 'professional',
      maxStores: 5,
      maxTvs: 20,
      maxMedia: 1000,
      maxStorageMb: 10000,
    },
  });
  console.log('✅ Sample tenant created');

  // 4. Create ADMIN user for the tenant
  const adminTenantEmail = 'admin@adegaexemplo.com.br';
  const adminTenantPasswordHash = await argon2.hash('Adega@123');
  const tenantAdminUser = await prisma.user.upsert({
    where: { email: adminTenantEmail },
    update: {},
    create: {
      email: adminTenantEmail,
      passwordHash: adminTenantPasswordHash,
      name: 'Administrador',
      role: 'ADMIN',
      isActive: true,
      phone: '(11) 98888-8888',
      tenantId: tenant.id,
    },
  });
  console.log('✅ Tenant admin user created');

  // 5. Create sample store
  const storeCode = generateCode();
  const store = await prisma.store.create({
    data: {
      name: 'Adega Exemplo - Matriz',
      code: storeCode,
      document: '00.000.000/0001-00',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      phone: '(11) 3333-3333',
      managerName: 'Carlos Silva',
      managerPhone: '(11) 97777-7777',
      openingTime: '08:00',
      closingTime: '22:00',
      latitude: -23.561684,
      longitude: -46.656139,
      status: 'ACTIVE',
      tenantId: tenant.id,
    },
  });

  // Link store to admin user
  await prisma.userStore.create({
    data: {
      userId: tenantAdminUser.id,
      storeId: store.id,
    },
  });
  console.log('✅ Sample store created');

  // 6. Create sample TV
  const tvPairingCode = generateCode();
  const tvToken = generateToken();

  await prisma.tv.create({
    data: {
      name: 'TV Matriz - Salão Principal',
      pairingCode: tvPairingCode,
      description: 'TV localizada no salão principal da matriz',
      model: 'LG 55" OLED',
      resolution: '1920x1080',
      orientation: 'HORIZONTAL',
      status: 'OFFLINE',
      volume: 50,
      autoRotate: true,
      rotateInterval: 15,
      token: tvToken,
      storeId: store.id,
      tenantId: tenant.id,
    },
  });
  console.log('✅ Sample TV created');

  // 7. Create sample media assets
  const mediaAssets = [
    {
      name: 'Logo Adega Exemplo',
      type: 'IMAGE' as const,
      mimeType: 'image/png',
      size: 24576,
      url: 'https://placehold.co/400x200/7c3aed/ffffff.png?text=Logo+Adega',
      thumbnailUrl: 'https://placehold.co/200x100/7c3aed/ffffff.png?text=Logo',
      status: 'READY' as const,
      folder: '/logos',
      tags: 'logo,principal',
    },
    {
      name: 'Promoção Semanal',
      type: 'IMAGE' as const,
      mimeType: 'image/jpeg',
      size: 51200,
      url: 'https://placehold.co/1920x1080/e11d48/ffffff.jpg?text=Promocao+Semanal',
      thumbnailUrl: 'https://placehold.co/320x180/e11d48/ffffff.jpg?text=Promo',
      status: 'READY' as const,
      folder: '/promocoes',
      tags: 'promocao,semanal',
    },
    {
      name: 'Vídeo Institucional',
      type: 'VIDEO' as const,
      mimeType: 'video/mp4',
      size: 52428800,
      duration: 120,
      width: 1920,
      height: 1080,
      url: 'https://placehold.co/1920x1080/1e40af/ffffff.mp4',
      thumbnailUrl: 'https://placehold.co/320x180/1e40af/ffffff.jpg?text=Video',
      status: 'READY' as const,
      folder: '/institucional',
      tags: 'institucional,apresentacao',
    },
    {
      name: 'Cardápio Digital',
      type: 'URL' as const,
      mimeType: 'text/html',
      size: 0,
      url: 'https://adegaexemplo.com.br/cardapio',
      status: 'READY' as const,
      folder: '/urls',
      tags: 'cardapio,digital',
    },
  ];

  for (const media of mediaAssets) {
    await prisma.mediaAsset.create({
      data: {
        ...media,
        tenantId: tenant.id,
        uploadedById: tenantAdminUser.id,
      },
    });
  }
  console.log('✅ Sample media assets created');

  // 8. Create AsaasConfig
  await prisma.asaasConfig.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      apiKey: '',
      environment: 'sandbox',
      enabled: false,
    },
  });
  console.log('✅ AsaasConfig created');

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📋 Credenciais de acesso:');
  console.log(`   Super Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`   Tenant Admin: ${adminTenantEmail} / Adega@123`);
  console.log(`   TV Pairing Code: ${tvPairingCode}`);
  console.log(`   Store Code: ${storeCode}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
