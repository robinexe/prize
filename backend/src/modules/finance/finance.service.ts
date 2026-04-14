import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateChargeDto } from './dto/create-charge.dto';
import { RegisterPaymentDto } from './dto/register-payment.dto';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  // ---- CHARGES ----

  async createCharge(dto: CreateChargeDto) {
    return this.prisma.charge.create({
      data: {
        userId: dto.userId,
        description: dto.description,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        category: dto.category,
        reference: dto.reference,
        boatId: dto.boatId,
      },
    });
  }

  async generateMonthlyCharges() {
    const activeShares = await this.prisma.share.findMany({
      where: { isActive: true },
      include: { boat: true, user: true },
    });

    const charges = [];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-based

    for (const share of activeShares) {
      // Look up the sale to get the correct dueDay for this share
      const sale = await this.prisma.shareSale.findFirst({
        where: { shareId: share.id, status: 'ACTIVE' },
        select: { dueDay: true },
      });
      const dueDay = sale?.dueDay || parseInt(process.env.AUTO_CHARGE_DAY || '5');
      const reference = `monthly-${share.id}-${year}-${month + 1}`;

      // Check if charge already exists for this month (match both old and new reference formats)
      const existing = await this.prisma.charge.findFirst({
        where: {
          userId: share.userId,
          boatId: share.boatId,
          category: 'MONTHLY_FEE',
          dueDate: {
            gte: new Date(year, month, 1),
            lt: new Date(year, month + 1, 1),
          },
        },
      });

      if (!existing) {
        const dueDate = new Date(year, month, dueDay, 23, 59, 59, 999);
        const charge = await this.prisma.charge.create({
          data: {
            userId: share.userId,
            description: `Mensalidade — ${share.boat.name} (${String(month + 1).padStart(2, '0')}/${year})`,
            amount: Number(share.boat.monthlyFee) || share.monthlyValue,
            dueDate,
            category: 'MONTHLY_FEE',
            reference,
            boatId: share.boatId,
          },
        });
        charges.push(charge);
      }
    }

    return { generated: charges.length, charges };
  }

  async getUserCharges(userId: string, status?: string) {
    const where: any = { userId, deletedAt: null };
    if (status) where.status = status;

    return this.prisma.charge.findMany({
      where,
      orderBy: { dueDate: 'desc' },
      include: { payments: true },
    });
  }

  async getAllCharges(p = 1, l = 20, status?: string, userId?: string, boatId?: string) {
    const page = Number(p) || 1;
    const limit = Number(l) || 20;
    const where: any = { deletedAt: null };
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (boatId) where.boatId = boatId;

    const [charges, total] = await Promise.all([
      this.prisma.charge.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          payments: true,
        },
        orderBy: { dueDate: 'desc' },
      }),
      this.prisma.charge.count({ where }),
    ]);

    return { data: charges, total, page, pages: Math.ceil(total / limit) };
  }

  // ---- PAYMENTS ----

  async updateCharge(id: string, dto: Partial<CreateChargeDto>) {
    const charge = await this.prisma.charge.findUnique({ where: { id } });
    if (!charge) throw new NotFoundException('Cobrança não encontrada');
    if (charge.status === 'PAID') throw new BadRequestException('Não é possível editar cobrança já paga');

    const data: any = {};
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.dueDate !== undefined) data.dueDate = new Date(dto.dueDate);
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.boatId !== undefined) data.boatId = dto.boatId;

    return this.prisma.charge.update({ where: { id }, data });
  }

  async deleteCharge(id: string) {
    const charge = await this.prisma.charge.findUnique({ where: { id } });
    if (!charge) throw new NotFoundException('Cobrança não encontrada');
    if (charge.status === 'PAID') throw new BadRequestException('Não é possível remover cobrança já paga');

    return this.prisma.charge.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    });
  }

  async registerPayment(dto: RegisterPaymentDto) {
    const charge = await this.prisma.charge.findUnique({ where: { id: dto.chargeId } });
    if (!charge) throw new NotFoundException('Cobrança não encontrada');
    if (charge.status === 'PAID') throw new BadRequestException('Cobrança já está paga');

    const payment = await this.prisma.payment.create({
      data: {
        chargeId: dto.chargeId,
        userId: charge.userId,
        amount: dto.amount,
        method: dto.method as any,
        transactionId: dto.transactionId,
      },
    });

    // Update charge status
    const totalPaid = await this.prisma.payment.aggregate({
      where: { chargeId: dto.chargeId },
      _sum: { amount: true },
    });

    if ((totalPaid._sum.amount || 0) >= charge.amount) {
      await this.prisma.charge.update({
        where: { id: dto.chargeId },
        data: { status: 'PAID', paidAt: new Date() },
      });

      // Resolve delinquency if all charges paid
      await this.checkAndResolveDelinquency(charge.userId);
    }

    return payment;
  }

  // ---- DELINQUENCY ----

  async getDelinquents(p = 1, l = 20) {
    const page = Number(p) || 1;
    const limit = Number(l) || 20;
    const [data, total] = await Promise.all([
      this.prisma.delinquency.findMany({
        where: { status: { in: ['ACTIVE', 'NEGOTIATING'] } },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, name: true, email: true, phone: true } } },
        orderBy: { daysPastDue: 'desc' },
      }),
      this.prisma.delinquency.count({ where: { status: { in: ['ACTIVE', 'NEGOTIATING'] } } }),
    ]);

    return { data, total, page, pages: Math.ceil(total / limit) };
  }

  async processDelinquencies() {
    const blockDays = parseInt(process.env.DELINQUENCY_BLOCK_DAYS || '30');
    const now = new Date();

    // Find all overdue charges
    const overdueCharges = await this.prisma.charge.findMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: now },
        deletedAt: null,
      },
    });

    // Mark as overdue
    for (const charge of overdueCharges) {
      await this.prisma.charge.update({
        where: { id: charge.id },
        data: { status: 'OVERDUE' },
      });
    }

    // Group by user
    const userOverdue = new Map<string, { total: number; oldestDue: Date }>();
    const allOverdue = await this.prisma.charge.findMany({
      where: { status: 'OVERDUE', deletedAt: null },
    });

    for (const charge of allOverdue) {
      const entry = userOverdue.get(charge.userId) || { total: 0, oldestDue: charge.dueDate };
      entry.total += charge.amount;
      if (charge.dueDate < entry.oldestDue) entry.oldestDue = charge.dueDate;
      userOverdue.set(charge.userId, entry);
    }

    // Create/update delinquency records
    for (const [userId, data] of userOverdue) {
      const daysPastDue = Math.floor((now.getTime() - data.oldestDue.getTime()) / (1000 * 60 * 60 * 24));

      await this.prisma.delinquency.upsert({
        where: { id: `delinquency-${userId}` },
        create: {
          id: `delinquency-${userId}`,
          userId,
          totalAmount: data.total,
          oldestDue: data.oldestDue,
          daysPastDue,
          status: daysPastDue >= blockDays ? 'ACTIVE' : 'ACTIVE',
          blockedAt: daysPastDue >= blockDays ? now : null,
        },
        update: {
          totalAmount: data.total,
          oldestDue: data.oldestDue,
          daysPastDue,
          blockedAt: daysPastDue >= blockDays ? now : undefined,
        },
      });
    }

    return { processed: userOverdue.size };
  }

  // ---- DASHBOARD ----

  async getDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalRevenue,
      monthlyRevenue,
      pendingCharges,
      overdueCharges,
      activeDelinquents,
    ] = await Promise.all([
      this.prisma.payment.aggregate({ _sum: { amount: true } }),
      this.prisma.payment.aggregate({
        where: { paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      this.prisma.charge.count({ where: { status: 'PENDING' } }),
      this.prisma.charge.count({ where: { status: 'OVERDUE' } }),
      this.prisma.delinquency.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      pendingCharges,
      overdueCharges,
      activeDelinquents,
    };
  }

  private async checkAndResolveDelinquency(userId: string) {
    const overdueCount = await this.prisma.charge.count({
      where: { userId, status: 'OVERDUE' },
    });

    if (overdueCount === 0) {
      await this.prisma.delinquency.updateMany({
        where: { userId, status: 'ACTIVE' },
        data: { status: 'RESOLVED', resolvedAt: new Date() },
      });
    }
  }
}
