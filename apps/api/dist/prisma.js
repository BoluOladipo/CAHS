let prismaInstance = null;
let prismaLoadFailed = false;
async function getPrisma() {
    if (prismaInstance)
        return prismaInstance;
    if (prismaLoadFailed)
        return null;
    try {
        const mod = await import("@prisma/client");
        prismaInstance = new mod.PrismaClient();
        return prismaInstance;
    }
    catch (err) {
        prismaLoadFailed = true;
        console.warn("[prisma] Could not load PrismaClient:", err.message);
        return null;
    }
}
export const prisma = new Proxy({}, {
    get(_target, modelName) {
        return new Proxy({}, {
            get(_subTarget, methodName) {
                return async (...args) => {
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
