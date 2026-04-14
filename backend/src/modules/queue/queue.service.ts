import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EnterQueueDto } from './dto/enter-queue.dto';

@Injectable()
export class QueueService {
  constructor(private prisma: PrismaService) {}

  async enterQueue(clientId: string, dto: EnterQueueDto) {
    // Check delinquency
    const delinquency = await this.prisma.delinquency.findFirst({
      where: { userId: clientId, status: 'ACTIVE' },
    });

    if (delinquency) {
      throw new BadRequestException('Entrada na fila bloqueada por inadimplência');
    }

    // Calculate next position
    const lastInQueue = await this.prisma.operationalQueue.findFirst({
      where: {
        boatId: dto.boatId,
        scheduledAt: {
          gte: new Date(new Date().toDateString()),
        },
        status: { in: ['WAITING', 'PREPARING'] },
      },
      orderBy: { position: 'desc' },
    });

    const position = (lastInQueue?.position || 0) + 1;

    return this.prisma.operationalQueue.create({
      data: {
        boatId: dto.boatId,
        clientId,
        reservationId: dto.reservationId,
        position,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : new Date(),
        notes: dto.notes,
      },
      include: {
        boat: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
      },
    });
  }

  async getTodayQueue(boatId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
      scheduledAt: { gte: today, lt: tomorrow },
      status: { in: ['WAITING', 'PREPARING', 'LAUNCHING', 'IN_WATER'] },
    };
    if (boatId) where.boatId = boatId;

    return this.prisma.operationalQueue.findMany({
      where,
      include: {
        boat: { select: { id: true, name: true, model: true } },
        client: { select: { id: true, name: true, phone: true } },
        operator: { select: { id: true, name: true } },
      },
      orderBy: { position: 'asc' },
    });
  }

  async updateStatus(id: string, status: string, operatorId?: string) {
    const queueItem = await this.prisma.operationalQueue.findUnique({ where: { id } });
    if (!queueItem) throw new NotFoundException('Item da fila não encontrado');

    const data: any = { status };

    if (operatorId) data.operatorId = operatorId;
    if (status === 'LAUNCHING' || status === 'IN_WATER') data.startedAt = new Date();
    if (status === 'COMPLETED' || status === 'CANCELLED') data.completedAt = new Date();

    // Update boat status
    if (status === 'IN_WATER') {
      await this.prisma.boat.update({
        where: { id: queueItem.boatId },
        data: { status: 'IN_USE' },
      });
    }

    if (status === 'COMPLETED' || status === 'RETURNING') {
      await this.prisma.boat.update({
        where: { id: queueItem.boatId },
        data: { status: 'AVAILABLE' },
      });
    }

    return this.prisma.operationalQueue.update({
      where: { id },
      data,
      include: {
        boat: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
      },
    });
  }

  async getQueuePosition(clientId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.operationalQueue.findMany({
      where: {
        clientId,
        scheduledAt: { gte: today },
        status: { in: ['WAITING', 'PREPARING', 'LAUNCHING'] },
      },
      include: { boat: { select: { id: true, name: true } } },
      orderBy: { position: 'asc' },
    });
  }
}
