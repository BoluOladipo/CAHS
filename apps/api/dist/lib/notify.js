import { prisma } from "../prisma.js";
import { sendNotificationEmail } from "../services/mailer.js";
export async function notify(userId, title, body) {
    const notif = await prisma.notification.create({ data: { userId, title, body } });
    // Non-blocking email dispatch if recipient has an email address
    prisma.user
        .findUnique({ where: { id: userId }, select: { email: true, fullName: true } })
        .then((user) => {
        if (user?.email) {
            return sendNotificationEmail(user.email, title, body, user.fullName);
        }
    })
        .catch((err) => {
        console.warn(`[notify] Failed to dispatch email notification for ${userId}:`, err);
    });
    return notif;
}
