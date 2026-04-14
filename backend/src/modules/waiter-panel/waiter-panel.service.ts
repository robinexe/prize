import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWaiterOrderDto, FinalizeOrderDto } from './dto/create-waiter-order.dto';

@Injectable()
export class WaiterPanelService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, avatar: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const waiter = await this.prisma.waiter.findFirst({
      where: { userId },
    });

    return { ...user, waiter };
  }

  async getTables() {
    const tables = await this.prisma.restaurantTable.findMany({
      where: { isActive: true },
      orderBy: { number: 'asc' },
      include: {
        orders: {
          where: {
            status: { notIn: ['DONE', 'CANCELLED'] },
            createdAt: { gte: this.todayStart() },
          },
          include: { items: true, waiter: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return tables.map(t => ({
      ...t,
      activeOrdersCount: t.orders.length,
      isOccupied: t.orders.length > 0,
    }));
  }

  async getOrders(waiterId?: string) {
    const where: any = {
      status: { notIn: ['DONE', 'CANCELLED'] },
      createdAt: { gte: this.todayStart() },
    };
    if (waiterId) where.waiterId = waiterId;

    return this.prisma.order.findMany({
      where,
      include: { items: true, waiter: true, restaurantTable: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMenu() {
    return this.prisma.menuCategory.findMany({
      where: { isActive: true },
      include: {
        items: {
          where: { isAvailable: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async createOrder(userId: string, dto: CreateWaiterOrderDto) {
    const waiter = await this.prisma.waiter.findFirst({
      where: { userId },
    });
    if (!waiter) throw new BadRequestException('Garçom não vinculado. Contacte o administrador.');

    const subtotal = dto.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const commission = subtotal * (waiter.commissionRate / 100);

    const status = dto.sendToKitchen === false ? 'READY' : 'PREPARING';

    return this.prisma.order.create({
      data: {
        type: 'TABLE',
        status: status as any,
        tableNumber: dto.tableNumber,
        restaurantTableId: dto.restaurantTableId || undefined,
        customerName: dto.customerName,
        notes: dto.notes,
        subtotal,
        total: subtotal,
        waiterId: waiter.id,
        waiterCommission: commission,
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
      include: { items: true, waiter: true, restaurantTable: true },
    });
  }

  async advanceOrder(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new NotFoundException('Pedido não encontrado');

    const flow: Record<string, string> = {
      ANALYSIS: 'PREPARING',
      PREPARING: 'READY',
      READY: 'SERVED',
      SERVED: 'DONE',
      DELIVERING: 'DONE',
    };
    const next = flow[order.status];
    if (!next) throw new BadRequestException('Pedido já finalizado ou cancelado');

    return this.prisma.order.update({
      where: { id },
      data: { status: next as any },
      include: { items: true, waiter: true, restaurantTable: true },
    });
  }

  async finalizeOrder(id: string, dto: FinalizeOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    if (order.status === 'DONE' || order.status === 'CANCELLED') {
      throw new BadRequestException('Pedido já finalizado ou cancelado');
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        status: 'DONE',
        paymentMethod: dto.paymentMethod,
      },
      include: { items: true, waiter: true, restaurantTable: true },
    });
  }

  async getMyStats(userId: string) {
    const waiter = await this.prisma.waiter.findFirst({ where: { userId } });
    if (!waiter) return { todayOrders: 0, todayRevenue: 0, todayCommission: 0 };

    const today = this.todayStart();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await this.prisma.order.findMany({
      where: {
        waiterId: waiter.id,
        createdAt: { gte: today, lt: tomorrow },
        status: { not: 'CANCELLED' },
      },
      select: { total: true, waiterCommission: true, status: true },
    });

    return {
      todayOrders: orders.length,
      todayRevenue: orders.reduce((s, o) => s + o.total, 0),
      todayCommission: orders.reduce((s, o) => s + o.waiterCommission, 0),
    };
  }

  private todayStart() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
