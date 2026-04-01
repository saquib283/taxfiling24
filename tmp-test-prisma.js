const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  try {
      const campaigns = await prisma.campaign.findMany({
        include: {
          template: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
        orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }],
      });
      console.log('Campaigns fetched!');
      
      const templates = await prisma.campaignTemplate.findMany({
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      });
      console.log('Templates fetched!');
      
      const subscribers = await prisma.subscriber.findMany({
        orderBy: { createdAt: "desc" },
      });
      console.log('Subscribers fetched!');
      
      const settings = await prisma.setting.findMany({
          select: {
            key: true,
            value: true,
          },
      });
      console.log('Settings fetched!');
  } catch(e) {
      fs.writeFileSync('output-node.txt', "PRISMA ERROR: " + e.message);
  }
}

main().finally(() => prisma.$disconnect());
