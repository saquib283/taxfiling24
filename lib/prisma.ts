import { PrismaClient, Prisma } from '@prisma/client';

const prismaClientSingleton = () => {
  const client = new PrismaClient();
  
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          let retries = 3;
          let delay = 1000;
          
          while (true) {
            try {
              return await query(args);
            } catch (error) {
              // P1001: Can't reach database server (Neon cold-start)
              // P1008: Operations timed out
              // P1011/P1017: Server closed connection
              // P2024: Connection pool timeout
              if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                ['P1001', 'P1002', 'P1008', 'P1011', 'P1017', 'P2024'].includes(error.code) &&
                retries > 0
              ) {
                console.warn(`[Prisma] Transient DB Error (${error.code}). Retrying ${model}.${operation} in ${delay}ms... (${retries} left)`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                retries--;
                delay *= 1.5; // Exponential backoff
                continue;
              }
              throw error;
            }
          }
        },
      },
    },
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
