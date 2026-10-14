import { prisma } from "../prisma.js";
export async function audit(input) {
    await prisma.auditEvent.create({
        data: {
            actorId: input.actorId ?? null,
            action: input.action,
            entity: input.entity,
            entityId: input.entityId,
            beforeJson: input.before ? JSON.stringify(input.before) : null,
            afterJson: input.after ? JSON.stringify(input.after) : null,
        },
    });
}
