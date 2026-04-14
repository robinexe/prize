import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async send(userId: string, type: string, title: string, body: string, data?: any) {
    const notification = await this.prisma.notification.create({
      data: { userId, type: type as any, title, body, data },
    });

    // TODO: Firebase push notification
    // TODO: WhatsApp notification (simulated)

    return notification;
  }

  async sendBulk(userIds: string[], type: string, title: string, body: string) {
    const notifications = await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: type as any,
        title,
        body,
      })),
    });

    return { sent: notifications.count };
  }

  async getUserNotifications(userId: string, p = 1, l = 20) {
    const page = Number(p) || 1;
    const limit = Number(l) || 20;
    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { sentAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return { data, total, unreadCount, page, pages: Math.ceil(total / limit) };
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
  }
}
