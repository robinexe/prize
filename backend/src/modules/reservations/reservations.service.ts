import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(private prisma: PrismaService) {}

  // Every day at 17:00 BRT — mark all ended reservations as COMPLETED
  @Cron('0 17 * * *', { timeZone: 'America/Sao_Paulo' })
  async completeEndedReservations() {
    const now = new Date();
    const result = await this.prisma.reservation.updateMany({
      where: {
        status: { in: ['CONFIRMED', 'PENDING'] },
        endDate: { lt: now },
      },
      data: { status: 'COMPLETED' },
    });
    if (result.count > 0) {
      this.logger.log(`Auto-completed ${result.count} ended reservation(s)`);
    }
  }

  async create(userId: string, dto: CreateReservationDto, isAdmin = false) {
    // Check if user has active share for this boat (skip for admin)
    if (!isAdmin) {
      const share = await this.prisma.share.findFirst({
        where: { userId, boatId: dto.boatId, isActive: true },
      });

      if (!share) {
        throw new ForbiddenException('Você não possui cota nesta embarcação');
      }

      // Check max simultaneous reservations limit
      const maxRes = share.maxReservations ?? 3;
      const activeReservations = await this.prisma.reservation.count({
        where: {
          userId,
          boatId: dto.boatId,
          status: { in: ['CONFIRMED', 'PENDING'] },
          endDate: { gte: new Date() },
          deletedAt: null,
        },
      });
      if (activeReservations >= maxRes) {
        throw new BadRequestException(
          `Limite de ${maxRes} reserva${maxRes > 1 ? 's' : ''} simultânea${maxRes > 1 ? 's' : ''} atingido para esta embarcação. Cancele uma reserva existente ou aguarde.`,
        );
      }
    }

    // Check delinquency — block reservation if overdue (skip for admin)
    if (!isAdmin) {
      const delinquency = await this.prisma.delinquency.findFirst({
        where: { userId, status: 'ACTIVE' },
      });

      if (delinquency) {
        throw new ForbiddenException(
          `Reserva bloqueada por inadimplência de R$ ${delinquency.totalAmount.toFixed(2)}. Regularize seus pagamentos.`,
        );
      }

      // Also check for overdue charges directly
      const overdueCharge = await this.prisma.charge.findFirst({
        where: {
          userId,
          status: 'OVERDUE',
          deletedAt: null,
        },
      });

      if (overdueCharge) {
        throw new ForbiddenException(
          `Reserva bloqueada. Você possui fatura(s) vencida(s). Regularize seus pagamentos.`,
        );
      }
    }

    // Check boat availability
    const boat = await this.prisma.boat.findUnique({ where: { id: dto.boatId } });
    if (!boat || boat.status !== 'AVAILABLE') {
      throw new BadRequestException('Embarcação não disponível');
    }

    // Check maintenance block
    const activeMaintenance = await this.prisma.maintenance.findFirst({
      where: {
        boatId: dto.boatId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        scheduledAt: { lte: new Date(dto.endDate) },
      },
    });

    if (activeMaintenance) {
      throw new BadRequestException('Embarcação em manutenção no período solicitado');
    }

    // Check conflicting reservations
    const conflict = await this.prisma.reservation.findFirst({
      where: {
        boatId: dto.boatId,
        status: { in: ['CONFIRMED', 'PENDING', 'IN_USE'] },
        deletedAt: null,
        startDate: { lt: new Date(dto.endDate) },
        endDate: { gt: new Date(dto.startDate) },
      },
      include: { user: { select: { name: true } } },
    });

    if (conflict) {
      const cStart = conflict.startDate.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      const cEnd = conflict.endDate.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      const who = conflict.user?.name || 'outro cotista';
      throw new BadRequestException(
        `Horário indisponível. ${who} já tem reserva de ${cStart} até ${cEnd}.`,
      );
    }

    // Check max reservation days
    const maxDays = parseInt(process.env.MAX_RESERVATION_DAYS || '7');
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays > maxDays) {
      throw new BadRequestException(`Reserva máxima de ${maxDays} dias`);
    }

    return this.prisma.reservation.create({
      data: {
        boatId: dto.boatId,
        userId,
        startDate: start,
        endDate: end,
        status: 'CONFIRMED',
        notes: dto.notes,
      },
      include: { boat: { select: { id: true, name: true, model: true } } },
    });
  }

  async findAll(p = 1, l = 20, status?: string, boatId?: string) {
    const page = Number(p) || 1;
    const limit = Number(l) || 20;
    const where: any = { deletedAt: null };
    if (status) where.status = status;
    if (boatId) where.boatId = boatId;

    const [reservations, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          boat: { select: { id: true, name: true, model: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.reservation.count({ where }),
    ]);

    return { data: reservations, total, page, pages: Math.ceil(total / limit) };
  }

  async findByUser(userId: string, upcoming = false) {
    const where: any = { userId, deletedAt: null };
    if (upcoming) {
      where.startDate = { gte: new Date() };
      where.status = { in: ['CONFIRMED', 'PENDING'] };
    }

    return this.prisma.reservation.findMany({
      where,
      include: { boat: { select: { id: true, name: true, model: true, imageUrl: true } } },
      orderBy: { startDate: 'asc' },
    });
  }

  async findByBoat(boatId: string, date?: string) {
    const where: any = {
      boatId,
      status: { in: ['CONFIRMED', 'PENDING', 'IN_USE'] },
      deletedAt: null,
    };
    if (date) {
      const dayStart = new Date(date + 'T00:00:00');
      const dayEnd = new Date(date + 'T23:59:59');
      where.startDate = { lte: dayEnd };
      where.endDate = { gte: dayStart };
    }
    return this.prisma.reservation.findMany({
      where,
      include: { user: { select: { id: true, name: true } } },
      orderBy: { startDate: 'asc' },
    });
  }

  async cancel(id: string, userId: string, reason?: string, role?: string) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException('Reserva não encontrada');
    if (role !== 'ADMIN' && reservation.userId !== userId) throw new ForbiddenException('Reserva não pertence a você');
    if (reservation.status === 'CANCELLED') throw new BadRequestException('Reserva já cancelada');

    return this.prisma.reservation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason || 'Cancelado pelo cliente',
      },
    });
  }

  async getCalendar(boatId: string, month: number, year: number) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    return this.prisma.reservation.findMany({
      where: {
        boatId,
        status: { in: ['CONFIRMED', 'IN_USE', 'COMPLETED'] },
        startDate: { lte: endOfMonth },
        endDate: { gte: startOfMonth },
      },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { startDate: 'asc' },
    });
  }

  // ─── Swap Requests ────────────────────────────────────────────────────

  async createSwapRequest(requesterId: string, dto: { targetReservationId: string; offeredReservationId: string; message?: string }) {
    // Target reservation = the one the requester WANTS (belongs to another user)
    const targetReservation = await this.prisma.reservation.findUnique({
      where: { id: dto.targetReservationId },
      include: { boat: { select: { id: true, name: true } }, user: { select: { id: true, name: true } } },
    });
    if (!targetReservation) throw new NotFoundException('Reserva alvo não encontrada');
    if (targetReservation.userId === requesterId) throw new BadRequestException('Você não pode trocar com sua própria reserva');
    if (targetReservation.status !== 'CONFIRMED') throw new BadRequestException('A reserva alvo deve estar confirmada');

    const now = new Date();
    if (new Date(targetReservation.startDate) < now) throw new BadRequestException('Não é possível trocar reservas passadas');

    // Offered reservation = the one the requester is GIVING (must belong to requester)
    const offeredReservation = await this.prisma.reservation.findUnique({
      where: { id: dto.offeredReservationId },
      include: { boat: { select: { id: true, name: true } } },
    });
    if (!offeredReservation) throw new NotFoundException('Reserva oferecida não encontrada');
    if (offeredReservation.userId !== requesterId) throw new ForbiddenException('Você só pode oferecer suas próprias reservas');
    if (offeredReservation.status !== 'CONFIRMED') throw new BadRequestException('A reserva oferecida deve estar confirmada');
    if (new Date(offeredReservation.startDate) < now) throw new BadRequestException('Não é possível trocar reservas passadas');
    if (offeredReservation.boatId !== targetReservation.boatId) throw new BadRequestException('Ambas as reservas devem ser da mesma embarcação');

    // Check no pending swap already exists for either reservation
    const existing = await this.prisma.reservationSwap.findFirst({
      where: {
        status: 'PENDING',
        OR: [
          { reservationId: dto.targetReservationId },
          { offeredReservationId: dto.offeredReservationId },
          { reservationId: dto.offeredReservationId },
          { offeredReservationId: dto.targetReservationId },
        ],
      },
    });
    if (existing) throw new BadRequestException('Já existe uma solicitação de troca pendente envolvendo uma dessas reservas');

    return this.prisma.reservationSwap.create({
      data: {
        reservationId: dto.targetReservationId,
        offeredReservationId: dto.offeredReservationId,
        requesterId,
        targetUserId: targetReservation.userId,
        message: dto.message,
      },
      include: {
        reservation: { include: { boat: { select: { id: true, name: true } }, user: { select: { id: true, name: true } } } },
        offeredReservation: { include: { user: { select: { id: true, name: true } } } },
        requester: { select: { id: true, name: true } },
      },
    });
  }

  async getMySwapRequests(userId: string) {
    return this.prisma.reservationSwap.findMany({
      where: {
        OR: [{ requesterId: userId }, { targetUserId: userId }],
      },
      include: {
        reservation: {
          include: {
            boat: { select: { id: true, name: true } },
            user: { select: { id: true, name: true } },
          },
        },
        offeredReservation: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        requester: { select: { id: true, name: true } },
        targetUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingSwapsForUser(userId: string) {
    return this.prisma.reservationSwap.findMany({
      where: { targetUserId: userId, status: 'PENDING' },
      include: {
        reservation: {
          include: {
            boat: { select: { id: true, name: true } },
            user: { select: { id: true, name: true } },
          },
        },
        offeredReservation: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        requester: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async respondToSwap(swapId: string, userId: string, accept: boolean) {
    const swap = await this.prisma.reservationSwap.findUnique({
      where: { id: swapId },
      include: {
        reservation: true,
        offeredReservation: true,
      },
    });
    if (!swap) throw new NotFoundException('Solicitação de troca não encontrada');
    if (swap.targetUserId !== userId) throw new ForbiddenException('Apenas o cotista alvo pode responder');
    if (swap.status !== 'PENDING') throw new BadRequestException('Esta solicitação já foi respondida');

    if (accept) {
      // Swap dates between the two reservations
      const targetStart = swap.reservation.startDate;
      const targetEnd = swap.reservation.endDate;
      const offeredStart = swap.offeredReservation.startDate;
      const offeredEnd = swap.offeredReservation.endDate;

      await this.prisma.$transaction([
        // Target reservation gets the offered reservation's dates
        this.prisma.reservation.update({
          where: { id: swap.reservationId },
          data: { startDate: offeredStart, endDate: offeredEnd },
        }),
        // Offered reservation gets the target reservation's dates
        this.prisma.reservation.update({
          where: { id: swap.offeredReservationId },
          data: { startDate: targetStart, endDate: targetEnd },
        }),
      ]);

      // Also swap scheduledAt in OperationalQueue if entries exist
      await this.prisma.$transaction([
        this.prisma.operationalQueue.updateMany({
          where: { reservationId: swap.reservationId },
          data: { scheduledAt: offeredStart },
        }),
        this.prisma.operationalQueue.updateMany({
          where: { reservationId: swap.offeredReservationId },
          data: { scheduledAt: targetStart },
        }),
      ]);
    }

    return this.prisma.reservationSwap.update({
      where: { id: swapId },
      data: {
        status: accept ? 'ACCEPTED' : 'REJECTED',
        respondedAt: new Date(),
      },
      include: {
        reservation: { include: { boat: { select: { id: true, name: true } }, user: { select: { id: true, name: true } } } },
        offeredReservation: { include: { user: { select: { id: true, name: true } } } },
        requester: { select: { id: true, name: true } },
        targetUser: { select: { id: true, name: true } },
      },
    });
  }

  async getCoOwners(userId: string, boatId: string) {
    const shares = await this.prisma.share.findMany({
      where: { boatId, isActive: true, userId: { not: userId } },
      include: { user: { select: { id: true, name: true } } },
    });
    return shares.map(s => s.user);
  }

  async confirmArrival(reservationId: string, userId: string, expectedArrivalTime: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { boat: true },
    });
    if (!reservation) throw new NotFoundException('Reserva não encontrada');
    if (reservation.userId !== userId) throw new ForbiddenException('Reserva não pertence a este usuário');
    if (!['CONFIRMED', 'PENDING'].includes(reservation.status)) {
      throw new BadRequestException('Reserva não pode ser confirmada neste status');
    }
    if (reservation.confirmedAt) {
      throw new BadRequestException('Reserva já foi confirmada');
    }

    // Update reservation with confirmation data
    const updated = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: {
        confirmedAt: new Date(),
        expectedArrivalTime,
      },
      include: { boat: { select: { id: true, name: true, model: true } } },
    });

    // Create queue entry in WAITING status
    const maxPos = await this.prisma.operationalQueue.aggregate({
      _max: { position: true },
      where: { status: { in: ['WAITING', 'IN_WATER', 'PREPARING', 'LAUNCHING'] } },
    });
    await this.prisma.operationalQueue.create({
      data: {
        boatId: reservation.boatId,
        reservationId,
        clientId: userId,
        position: (maxPos._max.position ?? 0) + 1,
        status: 'WAITING',
        scheduledAt: reservation.startDate,
      },
    });

    return updated;
  }
}
