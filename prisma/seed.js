const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function encryptKey(plain) {
  const key = Buffer.from('a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90', 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let enc = cipher.update(plain, 'utf8', 'hex');
  enc += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${enc}:${tag.toString('hex')}`;
}

async function main() {
  console.log('Seeding Central Dashboard database...');

  // Clear existing records cleanly
  await prisma.opportunityStageHistory.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.kpiTarget.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.pipeline.deleteMany();
  await prisma.user.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.ghlLocation.deleteMany();

  // 1. SUB-ACCOUNT 1: UAE Business Setup & Corporate
  const loc1 = await prisma.ghlLocation.create({
    data: {
      locationId: 'loc_uae_setup',
      name: 'UAE Business Setup & Corporate',
      currency: 'AED',
      timezone: 'Asia/Dubai',
      encryptedPrivateKey: encryptKey('pit-uae-secret-key-993a9f'),
      keyHint: '••••••••3a9f',
      lastSyncAt: new Date(),
      syncStatus: 'success',
    },
  });

  // Agents for Location 1
  const ahmed = await prisma.user.create({
    data: {
      locationId: loc1.locationId,
      ghlUserId: 'usr_ahmed',
      name: 'Ahmed Khan',
      email: 'ahmed@onesol.ae',
      role: 'Senior Sales Consultant',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  const sarah = await prisma.user.create({
    data: {
      locationId: loc1.locationId,
      ghlUserId: 'usr_sarah',
      name: 'Sarah Jenkins',
      email: 'sarah@onesol.ae',
      role: 'Sales Consultant',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
  });

  const john = await prisma.user.create({
    data: {
      locationId: loc1.locationId,
      ghlUserId: 'usr_john',
      name: 'John Doe',
      email: 'john@onesol.ae',
      role: 'Sales Executive',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });

  // KPI Targets for Sep 2026
  await prisma.kpiTarget.createMany({
    data: [
      { locationId: loc1.locationId, ghlUserId: ahmed.ghlUserId, periodMonth: '2026-09', revenueTarget: 150000, dealsTarget: 25 },
      { locationId: loc1.locationId, ghlUserId: sarah.ghlUserId, periodMonth: '2026-09', revenueTarget: 150000, dealsTarget: 30 },
      { locationId: loc1.locationId, ghlUserId: john.ghlUserId, periodMonth: '2026-09', revenueTarget: 100000, dealsTarget: 20 },
    ],
  });

  // Pipeline for Location 1
  const pipe1 = await prisma.pipeline.create({
    data: {
      locationId: loc1.locationId,
      ghlPipelineId: 'pipe_biz_setup',
      name: 'Business Setup (UAE)',
    },
  });

  const stageNames1 = ['New Lead', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won Deal'];
  const stages1 = [];
  for (let i = 0; i < stageNames1.length; i++) {
    const s = await prisma.pipelineStage.create({
      data: {
        locationId: loc1.locationId,
        pipelineId: pipe1.id,
        ghlStageId: `stage_biz_${i + 1}`,
        name: stageNames1[i],
        position: i,
      },
    });
    stages1.push(s);
  }

  // Create realistic batch opportunities for UAE Setup (1,842 total leads as per design)
  console.log('Generating UAE opportunities...');
  const sources = [
    { name: 'Facebook Ads', weight: 428, won: 52, revTotal: 290000 },
    { name: 'Google Search', weight: 301, won: 61, revTotal: 315000 },
    { name: 'WhatsApp Direct', weight: 284, won: 38, revTotal: 148000 },
    { name: 'Website Form', weight: 197, won: 27, revTotal: 186000 },
    { name: 'Client Referral', weight: 133, won: 24, revTotal: 157000 },
    { name: 'Instagram / Other', weight: 99, won: 12, revTotal: 92000 },
  ];

  const agentIds = [ahmed.ghlUserId, sarah.ghlUserId, john.ghlUserId];
  const now = new Date();

  // Create won opportunities
  let oppIndex = 1;
  for (const src of sources) {
    const avgRev = src.revTotal / src.won;
    for (let w = 0; w < src.won; w++) {
      const assigned = agentIds[w % agentIds.length];
      await prisma.opportunity.create({
        data: {
          locationId: loc1.locationId,
          ghlOpportunityId: `opp_won_${oppIndex++}`,
          pipelineId: pipe1.id,
          stageId: stages1[5].id, // Won Deal
          name: `Client Deal #${oppIndex} - ${src.name}`,
          status: 'won',
          monetaryValue: Math.round(avgRev + (Math.random() * 2000 - 1000)),
          source: src.name,
          assignedTo: assigned,
          createdAt: new Date(now.getTime() - Math.floor(Math.random() * 20 * 86400000)),
          wonAt: new Date(now.getTime() - Math.floor(Math.random() * 5 * 86400000)),
        },
      });
    }

    // Create open opportunities for this source
    const openCount = src.weight - src.won;
    for (let o = 0; o < Math.min(openCount, 80); o++) {
      const stagePick = stages1[Math.floor(Math.random() * 5)]; // Stages 0-4
      const assigned = agentIds[o % agentIds.length];
      const isStuck = o < 4; // Some are stuck > 2 days
      const stageDate = isStuck
        ? new Date(now.getTime() - (3 + Math.random() * 2) * 86400000)
        : new Date(now.getTime() - Math.random() * 86400000);

      await prisma.opportunity.create({
        data: {
          locationId: loc1.locationId,
          ghlOpportunityId: `opp_open_${oppIndex++}`,
          pipelineId: pipe1.id,
          stageId: stagePick.id,
          name: `Inquiry #${oppIndex} (${src.name})`,
          status: 'open',
          monetaryValue: Math.round(3500 + Math.random() * 12000),
          source: src.name,
          assignedTo: assigned,
          createdAt: new Date(now.getTime() - Math.floor(Math.random() * 15 * 86400000)),
          stageEnteredAt: stageDate,
        },
      });
    }
  }

  // Create tasks for Location 1 (due today, overdue, pending)
  console.log('Generating UAE tasks...');
  for (let i = 0; i < 42; i++) {
    // Overdue tasks
    const assigned = agentIds[i % agentIds.length];
    await prisma.task.create({
      data: {
        locationId: loc1.locationId,
        ghlTaskId: `task_overdue_${i + 1}`,
        title: `Follow-up call with pending lead #${100 + i}`,
        dueDate: new Date(now.getTime() - (1 + (i % 4)) * 86400000),
        completed: false,
        assignedTo: assigned,
      },
    });
  }

  for (let i = 0; i < 86; i++) {
    // Due today
    const assigned = agentIds[i % agentIds.length];
    await prisma.task.create({
      data: {
        locationId: loc1.locationId,
        ghlTaskId: `task_today_${i + 1}`,
        title: `Send quotation package #${200 + i}`,
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0),
        completed: false,
        assignedTo: assigned,
      },
    });
  }

  // 2. SUB-ACCOUNT 2: Global Immigration & Visa Hub
  const loc2 = await prisma.ghlLocation.create({
    data: {
      locationId: 'loc_immigration_hub',
      name: 'Global Immigration & Visa Hub',
      currency: 'USD',
      timezone: 'America/New_York',
      encryptedPrivateKey: encryptKey('pit-imm-secret-key-447b2e'),
      keyHint: '••••••••7b2e',
      lastSyncAt: new Date(),
      syncStatus: 'success',
    },
  });

  const david = await prisma.user.create({
    data: {
      locationId: loc2.locationId,
      ghlUserId: 'usr_david',
      name: 'David Miller',
      email: 'david@visahub.com',
      role: 'Senior Immigration Specialist',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
  });

  const maria = await prisma.user.create({
    data: {
      locationId: loc2.locationId,
      ghlUserId: 'usr_maria',
      name: 'Maria Santos',
      email: 'maria@visahub.com',
      role: 'Visa Consultant',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    },
  });

  await prisma.kpiTarget.createMany({
    data: [
      { locationId: loc2.locationId, ghlUserId: david.ghlUserId, periodMonth: '2026-09', revenueTarget: 120000, dealsTarget: 25 },
      { locationId: loc2.locationId, ghlUserId: maria.ghlUserId, periodMonth: '2026-09', revenueTarget: 100000, dealsTarget: 20 },
    ],
  });

  const pipe2 = await prisma.pipeline.create({
    data: {
      locationId: loc2.locationId,
      ghlPipelineId: 'pipe_golden_visa',
      name: 'Residency & Golden Visa',
    },
  });

  const stageNames2 = ['Consultation', 'Document Review', 'Gov Filing', 'Approved / Won'];
  const stages2 = [];
  for (let i = 0; i < stageNames2.length; i++) {
    const s = await prisma.pipelineStage.create({
      data: {
        locationId: loc2.locationId,
        pipelineId: pipe2.id,
        ghlStageId: `stage_visa_${i + 1}`,
        name: stageNames2[i],
        position: i,
      },
    });
    stages2.push(s);
  }

  // Create opportunities for Immigration Hub
  for (let i = 0; i < 45; i++) {
    const isWon = i < 18;
    await prisma.opportunity.create({
      data: {
        locationId: loc2.locationId,
        ghlOpportunityId: `opp_visa_${i + 1}`,
        pipelineId: pipe2.id,
        stageId: isWon ? stages2[3].id : stages2[i % 3].id,
        name: `Golden Visa Case #${1000 + i}`,
        status: isWon ? 'won' : 'open',
        monetaryValue: isWon ? 6500 : 4000,
        source: i % 2 === 0 ? 'Google Search' : 'Client Referral',
        assignedTo: i % 2 === 0 ? david.ghlUserId : maria.ghlUserId,
        createdAt: new Date(now.getTime() - (i % 15) * 86400000),
        wonAt: isWon ? new Date(now.getTime() - 2 * 86400000) : null,
      },
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
