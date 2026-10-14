import type { PrismaClient } from "@prisma/client";

let prismaInstance: any = null;
let prismaLoadFailed = false;

async function getPrisma(): Promise<any> {
  if (prismaInstance) return prismaInstance;
  if (prismaLoadFailed) return null;
  try {
    const mod = await import("@prisma/client");
    prismaInstance = new mod.PrismaClient();
    return prismaInstance;
  } catch (err) {
    prismaLoadFailed = true;
    console.warn("[prisma] Could not load PrismaClient:", (err as Error).message);
    return null;
  }
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, modelName) {
    return new Proxy({}, {
      get(_subTarget, methodName) {
        return async (...args: any[]) => {
          const client = await getPrisma();
          if (!client) {
            throw new Error(`Database offline: Prisma unavailable for ${String(modelName)}.${String(methodName)}`);
          }
          const model = client[modelName];
          if (!model || typeof model[methodName] !== "function") {
            throw new Error(`Prisma model or method not found: ${String(modelName)}.${String(methodName)}`);
          }
          return model[methodName](...args);
        };
      },
    });
  },
});
