import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { randomBytes } from 'crypto';
import {
  CreateTableDto, UpdateTableDto,
  CreateWaiterDto, UpdateWaiterDto,
  CreateTerminalDto, UpdateTerminalDto,
  OpenCashRegisterDto, CloseCashRegisterDto, CashRegisterTransactionDto,
  CreatePDVOrderDto, CreateSelfServiceOrderDto,
} from './dto';

@Injectable()
export class PdvService {
  constructor(private prisma: PrismaService) {}

  // ─── Tables ─────────────────────────────────────────────
  async getTables() {
    return this.prisma.restaurantTable.findMany({ orderBy: { number: 'asc' } });
  }

  async createTable(dto: CreateTableDto) {
    const selfServiceToken = randomBytes(16).toString('hex');
    return this.prisma.restaurantTable.create({
      data: { number: dto.number, name: dto.name, capacity: dto.capacity || 4, selfServiceToken },
    });
  }

  async updateTable(id: string, dto: UpdateTableDto) {
    return this.prisma.restaurantTable.update({ where: { id }, data: dto });
  }

  async deleteTable(id: string) {
    return this.prisma.restaurantTable.delete({ where: { id } });
  }

  // ─── Waiters ────────────────────────────────────────────
  async getWaiters() {
    return this.prisma.waiter.findMany({ orderBy: { name: 'asc' } });
  }

  async createWaiter(dto: CreateWaiterDto) {
    return this.prisma.waiter.create({
      data: { name: dto.name, commissionRate: dto.commissionRate ?? 10 },
    });
  }

  async updateWaiter(id: string, dto: UpdateWaiterDto) {
    return this.prisma.waiter.update({ where: { id }, data: dto });
  }

  async deleteWaiter(id: string) {
    return this.prisma.waiter.delete({ where: { id } });
  }

  async getWaiterCommissions(waiterId: string, from?: string, to?: string) {
    const where: any = { waiterId, status: 'DONE' };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setDate(end.getDate() + 1);
        where.createdAt.lt = end;
      }
    }
    const orders = await this.prisma.order.findMany({
      where,
      select: { id: true, number: true, total: true, waiterCommission: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    const totalCommission = orders.reduce((s: number, o: any) => s + (o.waiterCommission || 0), 0);
    const totalSales = orders.reduce((s: number, o: any) => s + o.total, 0);
    return { orders, totalCommission, totalSales, count: orders.length };
  }

  // ─── Terminals ──────────────────────────────────────────
  async getTerminals() {
    return this.prisma.terminal.findMany({
      orderBy: { name: 'asc' },
      include: {
        cashRegisters: {
          where: { status: 'OPEN' },
          take: 1,
        },
      },
    });
  }

  async createTerminal(dto: CreateTerminalDto) {
    return this.prisma.terminal.create({ data: { name: dto.name } });
  }

  async updateTerminal(id: string, dto: UpdateTerminalDto) {
    return this.prisma.terminal.update({ where: { id }, data: dto });
  }

  async deleteTerminal(id: string) {
    return this.prisma.terminal.delete({ where: { id } });
  }

  // ─── Cash Registers ────────────────────────────────────
  async openCashRegister(dto: OpenCashRegisterDto) {
    // Check if terminal already has an open register
    const existing = await this.prisma.cashRegister.findFirst({
      where: { terminalId: dto.terminalId, status: 'OPEN' },
    });
    if (existing) throw new BadRequestException('Este terminal já possui um caixa aberto');

    return this.prisma.cashRegister.create({
      data: {
        terminalId: dto.terminalId,
        operatorName: dto.operatorName,
        openingAmount: dto.openingAmount || 0,
      },
      include: { terminal: true },
    });
  }

  async closeCashRegister(id: string, dto: CloseCashRegisterDto) {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id },
      include: { transactions: true },
    });
    if (!register) throw new NotFoundException('Caixa não encontrado');
    if (register.status === 'CLOSED') throw new BadRequestException('Caixa já fechado');

    // Calculate expected amount
    const salesTotal = register.transactions
      .filter((t: any) => t.type === 'SALE')
      .reduce((s: number, t: any) => s + t.amount, 0);
    const depositsTotal = register.transactions
      .filter((t: any) => t.type === 'DEPOSIT')
      .reduce((s: number, t: any) => s + t.amount, 0);
    const withdrawalsTotal = register.transactions
      .filter((t: any) => t.type === 'WITHDRAWAL')
      .reduce((s: number, t: any) => s + t.amount, 0);

    const expectedAmount = register.openingAmount + salesTotal + depositsTotal - withdrawalsTotal;

    return this.prisma.cashRegister.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closingAmount: dto.closingAmount,
        expectedAmount,
        notes: dto.notes,
      },
      include: { terminal: true, transactions: true },
    });
  }

  async getCashRegisters(status?: string, terminalId?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (terminalId) where.terminalId = terminalId;

    return this.prisma.cashRegister.findMany({
      where,
      include: { terminal: true, _count: { select: { orders: true } } },
      orderBy: { openedAt: 'desc' },
      take: 50,
    });
  }

  async getCashRegister(id: string) {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id },
      include: {
        terminal: true,
        transactions: { orderBy: { createdAt: 'desc' } },
        orders: {
          include: { items: true, waiter: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!register) throw new NotFoundException('Caixa não encontrado');
    return register;
  }

  async addTransaction(cashRegisterId: string, dto: CashRegisterTransactionDto) {
    const register = await this.prisma.cashRegister.findUnique({ where: { id: cashRegisterId } });
    if (!register) throw new NotFoundException('Caixa não encontrado');
    if (register.status === 'CLOSED') throw new BadRequestException('Caixa está fechado');

    return this.prisma.cashRegisterTransaction.create({
      data: {
        cashRegisterId,
        type: dto.type,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        description: dto.description,
      },
    });
  }

  async getCashRegisterHistory(from?: string, to?: string) {
    const where: any = { status: 'CLOSED' };
    if (from || to) {
      where.closedAt = {};
      if (from) where.closedAt.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setDate(end.getDate() + 1);
        where.closedAt.lt = end;
      }
    }

    return this.prisma.cashRegister.findMany({
      where,
      include: { terminal: true, _count: { select: { orders: true, transactions: true } } },
      orderBy: { closedAt: 'desc' },
      take: 100,
    });
  }

  // ─── PDV Orders (Sell) ─────────────────────────────────
  async createPDVOrder(dto: CreatePDVOrderDto) {
    // Validate cash register is open
    const register = await this.prisma.cashRegister.findUnique({ where: { id: dto.cashRegisterId } });
    if (!register) throw new NotFoundException('Caixa não encontrado');
    if (register.status === 'CLOSED') throw new BadRequestException('Caixa está fechado');

    // Calculate totals
    const subtotal = dto.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    let discount = 0;
    if (dto.discount && dto.discount > 0) {
      discount = dto.discountType === 'PERCENT'
        ? subtotal * (dto.discount / 100)
        : dto.discount;
    }
    const total = Math.max(0, subtotal - discount);

    // Calculate waiter commission
    let waiterCommission = 0;
    if (dto.waiterId) {
      const waiter = await this.prisma.waiter.findUnique({ where: { id: dto.waiterId } });
      if (waiter) {
        waiterCommission = total * (waiter.commissionRate / 100);
      }
    }

    const requiresPreparation = dto.requiresPreparation !== false;
    const status = requiresPreparation ? 'PREPARING' : 'DONE';

    // Create order
    const order = await this.prisma.order.create({
      data: {
        type: (dto.type as any) || 'COUNTER',
        status: status as any,
        restaurantTableId: dto.restaurantTableId || undefined,
        waiterId: dto.waiterId || undefined,
        cashRegisterId: dto.cashRegisterId,
        customerName: dto.customerName,
        tableNumber: dto.tableNumber,
        notes: dto.notes,
        subtotal,
        discount,
        discountType: dto.discountType,
        total,
        paymentMethod: dto.paymentMethod || 'PENDING',
        requiresPreparation,
        waiterCommission,
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
      include: { items: true, waiter: true },
    });

    // Create cash register transaction (only if payment method is provided)
    const hasPay = dto.paymentMethod && dto.paymentMethod !== 'PENDING';
    if (hasPay) {
      await this.prisma.cashRegisterTransaction.create({
        data: {
          cashRegisterId: dto.cashRegisterId,
          orderId: order.id,
          type: 'SALE',
          amount: total,
          paymentMethod: dto.paymentMethod,
          description: `Pedido #${order.number}`,
        },
      });

      // Update cash register totals
      await this.prisma.cashRegister.update({
        where: { id: dto.cashRegisterId },
        data: {
          totalSales: { increment: total },
          totalOrders: { increment: 1 },
        },
      });
    }

    return order;
  }

  // ─── Finalize Orders (Fechar Conta) ───────────────────
  async finalizeOrders(dto: { orderIds: string[]; paymentMethod: string; cashRegisterId: string; waiterFeeAmount?: number }) {
    const orders = await this.prisma.order.findMany({
      where: { id: { in: dto.orderIds } },
      include: { items: true },
    });

    const ordersTotal = orders.reduce((sum, o) => sum + o.total, 0);
    const waiterFee = dto.waiterFeeAmount && dto.waiterFeeAmount > 0 ? dto.waiterFeeAmount : 0;
    const totalAmount = ordersTotal + waiterFee;

    // Update all orders with payment method and mark as DONE
    await this.prisma.order.updateMany({
      where: { id: { in: dto.orderIds } },
      data: { paymentMethod: dto.paymentMethod, status: 'DONE' as any },
    });

    // Create cash register transaction for the total
    if (totalAmount > 0) {
      await this.prisma.cashRegisterTransaction.create({
        data: {
          cashRegisterId: dto.cashRegisterId,
          type: 'SALE',
          amount: totalAmount,
          paymentMethod: dto.paymentMethod,
          description: `Conta fechada — ${orders.length} pedido(s)${waiterFee > 0 ? ` + taxa garçom` : ''}`,
        },
      });

      await this.prisma.cashRegister.update({
        where: { id: dto.cashRegisterId },
        data: {
          totalSales: { increment: totalAmount },
          totalOrders: { increment: orders.length },
        },
      });
    }

    return { finalized: orders.length, total: totalAmount };
  }

  // ─── PDV Dashboard Stats ──────────────────────────────
  async getPDVStats(cashRegisterId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
      createdAt: { gte: today, lt: tomorrow },
      status: { not: 'CANCELLED' },
    };
    if (cashRegisterId) where.cashRegisterId = cashRegisterId;

    const [orderCount, revenue, byPayment, openRegisters] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.aggregate({ _sum: { total: true }, where }),
      this.prisma.order.groupBy({
        by: ['paymentMethod'],
        _sum: { total: true },
        _count: true,
        where,
      }),
      this.prisma.cashRegister.findMany({
        where: { status: 'OPEN' },
        include: { terminal: true },
      }),
    ]);

    return {
      totalOrders: orderCount,
      totalRevenue: revenue._sum.total || 0,
      byPayment: byPayment.map((p: any) => ({
        method: p.paymentMethod || 'N/A',
        total: p._sum.total || 0,
        count: p._count,
      })),
      openRegisters,
    };
  }

  // ─── Self-Service ─────────────────────────────────────
  async generateTableToken(tableId: string) {
    const token = randomBytes(16).toString('hex');
    return this.prisma.restaurantTable.update({
      where: { id: tableId },
      data: { selfServiceToken: token },
    });
  }

  async getSelfServiceMenu(token: string) {
    const table = await this.prisma.restaurantTable.findUnique({
      where: { selfServiceToken: token },
    });
    if (!table || !table.isActive) throw new NotFoundException('Mesa não encontrada');

    const categories = await this.prisma.menuCategory.findMany({
      where: { isActive: true },
      include: {
        items: {
          where: { isAvailable: true },
          orderBy: { order: 'asc' },
          select: { id: true, name: true, description: true, price: true, image: true, order: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    return { table: { id: table.id, number: table.number, name: table.name }, categories };
  }

  async createSelfServiceOrder(token: string, dto: CreateSelfServiceOrderDto) {
    const table = await this.prisma.restaurantTable.findUnique({
      where: { selfServiceToken: token },
    });
    if (!table || !table.isActive) throw new NotFoundException('Mesa não encontrada');

    // Validate items exist and get real prices
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: dto.items.map(i => i.menuItemId) }, isAvailable: true },
    });
    const priceMap = new Map(menuItems.map(m => [m.id, { price: m.price, name: m.name }]));

    const validItems = dto.items.filter(i => priceMap.has(i.menuItemId));
    if (validItems.length === 0) throw new BadRequestException('Nenhum item válido');

    const subtotal = validItems.reduce((s, i) => {
      const real = priceMap.get(i.menuItemId)!;
      return s + real.price * i.quantity;
    }, 0);

    const order = await this.prisma.order.create({
      data: {
        type: 'TABLE',
        status: 'PREPARING',
        restaurantTableId: table.id,
        customerName: dto.customerName || `Mesa ${table.number}`,
        tableNumber: String(table.number),
        notes: dto.notes,
        subtotal,
        discount: 0,
        total: subtotal,
        paymentMethod: 'PENDING',
        requiresPreparation: true,
        items: {
          create: validItems.map(i => {
            const real = priceMap.get(i.menuItemId)!;
            return {
              menuItemId: i.menuItemId,
              name: real.name,
              quantity: i.quantity,
              unitPrice: real.price,
              notes: i.notes,
            };
          }),
        },
      },
      include: { items: true },
    });

    return { orderId: order.id, orderNumber: order.number, total: order.total };
  }

  // ─── Session-based Self-Service (QR Code) ────────────
  async createMesaSession(tableCode: string) {
    const table = await this.prisma.restaurantTable.findUnique({
      where: { selfServiceToken: tableCode },
    });
    if (!table || !table.isActive) throw new NotFoundException('Mesa não encontrada');

    // Generate session token
    const sessionToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await this.prisma.selfServiceSession.create({
      data: { token: sessionToken, tableId: table.id, expiresAt },
    });

    // Cleanup expired sessions (fire-and-forget)
    this.prisma.selfServiceSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    }).catch(() => {});

    return {
      sessionToken,
      expiresAt: expiresAt.toISOString(),
      table: { number: table.number, name: table.name },
    };
  }

  private async validateSession(sessionToken: string) {
    const session = await this.prisma.selfServiceSession.findUnique({
      where: { token: sessionToken },
      include: { table: true },
    });
    if (!session) throw new NotFoundException('Sessão inválida');
    if (session.expiresAt < new Date()) throw new BadRequestException('Sessão expirada. Escaneie o QR code novamente.');
    if (!session.table.isActive) throw new NotFoundException('Mesa desativada');
    return session.table;
  }

  async getMenuBySession(sessionToken: string) {
    const table = await this.validateSession(sessionToken);

    const categories = await this.prisma.menuCategory.findMany({
      where: { isActive: true },
      include: {
        items: {
          where: { isAvailable: true },
          orderBy: { order: 'asc' },
          select: { id: true, name: true, description: true, price: true, image: true, order: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    return { table: { number: table.number, name: table.name }, categories };
  }

  async createOrderBySession(sessionToken: string, dto: CreateSelfServiceOrderDto) {
    const table = await this.validateSession(sessionToken);

    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: dto.items.map(i => i.menuItemId) }, isAvailable: true },
    });
    const priceMap = new Map(menuItems.map(m => [m.id, { price: m.price, name: m.name }]));

    const validItems = dto.items.filter(i => priceMap.has(i.menuItemId));
    if (validItems.length === 0) throw new BadRequestException('Nenhum item válido');

    const subtotal = validItems.reduce((s, i) => {
      const real = priceMap.get(i.menuItemId)!;
      return s + real.price * i.quantity;
    }, 0);

    const order = await this.prisma.order.create({
      data: {
        type: 'TABLE',
        status: 'PREPARING',
        restaurantTableId: table.id,
        customerName: dto.customerName || `Mesa ${table.number}`,
        tableNumber: String(table.number),
        notes: dto.notes,
        subtotal,
        discount: 0,
        total: subtotal,
        paymentMethod: 'PENDING',
        requiresPreparation: true,
        items: {
          create: validItems.map(i => {
            const real = priceMap.get(i.menuItemId)!;
            return {
              menuItemId: i.menuItemId,
              name: real.name,
              quantity: i.quantity,
              unitPrice: real.price,
              notes: i.notes,
            };
          }),
        },
      },
      include: { items: true },
    });

    return { orderId: order.id, orderNumber: order.number, total: order.total };
  }

  // ─── Comanda (order history for table) ────────────
  async getTableComanda(tableCode: string) {
    const table = await this.prisma.restaurantTable.findUnique({
      where: { selfServiceToken: tableCode },
    });
    if (!table) throw new NotFoundException('Mesa não encontrada');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await this.prisma.order.findMany({
      where: {
        restaurantTableId: table.id,
        createdAt: { gte: today },
      },
      include: {
        items: { select: { name: true, quantity: true, unitPrice: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      table: { number: table.number, name: table.name },
      orders: orders.map(o => ({
        number: o.number,
        status: o.status,
        total: o.total,
        customerName: o.customerName,
        createdAt: o.createdAt,
        items: o.items,
      })),
    };
  }

  // ─── Fechar Conta (request closure) ───────────────
  async requestTableClosure(tableCode: string) {
    const table = await this.prisma.restaurantTable.findUnique({
      where: { selfServiceToken: tableCode },
    });
    if (!table) throw new NotFoundException('Mesa não encontrada');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Move all non-cancelled, non-done orders to DELIVERING (= Aguardando Fechamento)
    const result = await this.prisma.order.updateMany({
      where: {
        restaurantTableId: table.id,
        createdAt: { gte: today },
        status: { notIn: ['CANCELLED', 'DONE', 'DELIVERING'] },
      },
      data: { status: 'DELIVERING' as any },
    });

    return { updated: result.count, message: 'Conta solicitada! Aguarde o atendente.' };
  }
}
