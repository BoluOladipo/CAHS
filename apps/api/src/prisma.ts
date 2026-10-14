import { PrismaClient } from "@prisma/client";

let prismaInstance: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (prismaInstance) return prismaInstance;
  try {
    prismaInstance = new PrismaClient();
    return prismaInstance;
  } catch (err) {
    console.warn("[prisma] Could not initialize PrismaClient:", (err as Error).message);
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        return new Proxy({}, {
          get(_subTarget, subProp) {
            return async () => {
              throw new Error(`Database offline: Prisma unavailable for ${String(prop)}.${String(subProp)}`);
            };
          },
        });
      },
    });
  }
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const val = (client as any)[prop];
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  },
});
