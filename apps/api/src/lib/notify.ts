import { prisma } from "../prisma.js";

export async function notify(userId: string, title: string, body: string) {
  await prisma.notification.create({ data: { userId, title, body } });
  console.log(`[mock-mailer] to=${userId} subject=${title} body=${body}`);
}
