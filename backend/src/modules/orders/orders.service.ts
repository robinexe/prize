import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(status?: string, date?: string, restaurantTableId?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (restaurantTableId) where.restaurantTableId = restaurantTableId;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.createdAt = { gte: start, lt: end };
    }

    return this.prisma.order.findMany({
      where,
      include: { items: true, waiter: true, restaurantTable: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { menuItem: true } }, waiter: true, restaurantTable: true },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    return order;
  }

  async create(dto: CreateOrderDto) {
    const total = dto.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    return this.prisma.order.create({
      data: {
        type: (dto.type as any) || 'TABLE',
        status: 'PREPARING',
        tableNumber: dto.tableNumber,
        customerName: dto.customerName,
        notes: dto.notes,
        total,
        items: {
          create: dto.items.map(i => ({
            menuItemId: i.menuItemId || undefined,
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            notes: i.notes,
          })),
        },
      },
      include: { items: true },
    });
  }

  async update(id: string, dto: UpdateOrderDto) {
    await this.findOne(id);
    return this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status as any,
        tableNumber: dto.tableNumber,
        customerName: dto.customerName,
        notes: dto.notes,
      },
      include: { items: true },
    });
  }

  async advanceStatus(id: string) {
    const order = await this.findOne(id);
    const flow: Record<string, string> = {
      ANALYSIS: 'PREPARING',
      PREPARING: 'READY',
      READY: 'SERVED',
      SERVED: 'DONE',
      DELIVERING: 'DONE',
    };
    const next = flow[order.status];
    if (!next) throw new NotFoundException('Pedido já finalizado ou cancelado');
    return this.prisma.order.update({
      where: { id },
      data: { status: next as any },
      include: { items: true },
    });
  }

  async cancel(id: string) {
    await this.findOne(id);
    return this.prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' as any },
      include: { items: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.order.delete({ where: { id } });
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [counts, todayTotal] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['status'],
        _count: true,
        where: { createdAt: { gte: today, lt: tomorrow } },
      }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: today, lt: tomorrow }, status: { not: 'CANCELLED' } },
      }),
    ]);

    return {
      byStatus: counts.reduce((acc: Record<string, number>, c: any) => ({ ...acc, [c.status]: c._count }), {} as Record<string, number>),
      todayRevenue: todayTotal._sum.total || 0,
    };
  }
}
