import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBoatDto } from './dto/create-boat.dto';
import { UpdateBoatDto } from './dto/update-boat.dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class BoatsService {
  private readonly logger = new Logger(BoatsService.name);

  constructor(
    private prisma: PrismaService,
    private ai: AiService,
  ) {}

  async create(dto: CreateBoatDto) {
    return this.prisma.boat.create({ data: dto as any });
  }

  async findAll(p = 1, l = 20, status?: string) {
    const page = Number(p) || 1;
    const limit = Number(l) || 20;
    const where: any = { deletedAt: null };
    if (status) where.status = status;

    const [boats, total] = await Promise.all([
      this.prisma.boat.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: {
              shares: { where: { isActive: true, deletedAt: null } },
              reservations: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.boat.count({ where }),
    ]);

    return { data: boats, total, page, pages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const boat = await this.prisma.boat.findUnique({
      where: { id },
      include: {
        shares: {
          where: { isActive: true },
          include: { user: { select: { id: true, name: true, email: true, phone: true } } },
        },
        _count: { select: { reservations: true, fuelLogs: true, maintenances: true } },
      },
    });

    if (!boat || boat.deletedAt) throw new NotFoundException('Embarcação não encontrada');
    return boat;
  }

  async update(id: string, dto: UpdateBoatDto) {
    await this.findById(id);
    return this.prisma.boat.update({ where: { id }, data: dto as any });
  }

  async softDelete(id: string) {
    await this.findById(id);
    return this.prisma.boat.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'BLOCKED' },
    });
  }

  async getAvailableForDate(startDate: Date, endDate: Date) {
    const busyBoatIds = await this.prisma.reservation.findMany({
      where: {
        status: { in: ['CONFIRMED', 'IN_USE'] },
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } },
        ],
      },
      select: { boatId: true },
    });

    const busyIds = busyBoatIds.map((r) => r.boatId);

    return this.prisma.boat.findMany({
      where: {
        deletedAt: null,
        status: 'AVAILABLE',
        id: { notIn: busyIds },
      },
    });
  }

  async getUserBoats(userId: string) {
    return this.prisma.boat.findMany({
      where: {
        deletedAt: null,
        shares: { some: { userId, isActive: true } },
      },
      include: {
        shares: { where: { userId, isActive: true } },
      },
    });
  }

  // ================================================================
  // MARKETPLACE — Public (no auth)
  // ================================================================

  async getMarketplaceBoats() {
    const boats = await this.prisma.boat.findMany({
      where: {
        deletedAt: null,
        status: 'AVAILABLE',
        notes: { startsWith: '[COTA]' },
      },
      select: {
        id: true,
        name: true,
        model: true,
        year: true,
        capacity: true,
        fuelType: true,
        fuelCapacity: true,
        totalShares: true,
        monthlyFee: true,
        shareValue: true,
        locationBerth: true,
        hasSound: true,
        marketplaceDescription: true,
        imageUrl: false,
        _count: {
          select: {
            shares: { where: { isActive: true, deletedAt: null } },
          },
        },
      },
      orderBy: { shareValue: 'asc' },
    });

    // Lazy-generate AI descriptions for boats that don't have one
    const results = await Promise.all(
      boats.map(async (boat) => {
        let description = boat.marketplaceDescription;
        if (!description) {
          description = await this.generateMarketplaceDescription(boat);
          // Save to DB (fire-and-forget)
          this.prisma.boat.update({
            where: { id: boat.id },
            data: { marketplaceDescription: description },
          }).catch((err) => this.logger.warn(`Falha ao salvar descrição: ${err.message}`));
        }
        return {
          ...boat,
          marketplaceDescription: description,
          hasImage: true,
          imageUrl: `/public/boats/${boat.id}/image`,
          availableShares: boat.totalShares - boat._count.shares,
          brand: this.extractBrand(boat.model),
        };
      }),
    );

    return results;
  }

  private extractBrand(model: string): string {
    const m = model.toLowerCase();
    if (m.includes('sea-doo') || m.includes('seadoo')) return 'Sea-Doo';
    if (m.includes('yamaha')) return 'Yamaha';
    if (m.includes('kawasaki')) return 'Kawasaki';
    if (m.includes('honda')) return 'Honda';
    return model.split(' ')[0];
  }

  private async generateMarketplaceDescription(boat: {
    name: string;
    model: string;
    year: number;
    capacity: number;
    fuelCapacity: number;
  }): Promise<string> {
    const prompt = `Gere uma descrição premium de marketing em português brasileiro para a venda de cotas de uma embarcação náutica.

Dados da embarcação:
- Nome: ${boat.name}
- Modelo: ${boat.model}
- Ano: ${boat.year}
- Capacidade: ${boat.capacity} pessoas
- Tanque: ${boat.fuelCapacity}L

Regras:
- Máximo 3 parágrafos curtos
- Tom aspiracional e sofisticado
- Destaque performance, design e experiência
- Inclua dados técnicos reais do modelo (pesquise sobre o modelo)
- NÃO invente especificações, use apenas dados conhecidos do modelo
- NÃO use emojis
- NÃO mencione preços
- Foque na experiência de ter o próprio jet ski compartilhado`;

    try {
      const genAI = this.ai['genAI'];
      const modelName = this.ai['model'];
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: 'Você é um copywriter especialista em marketing náutico premium.',
      });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err: any) {
      this.logger.warn(`Gemini falhou para descrição: ${err.message}`);
      try {
        const openai = this.ai['openai'];
        if (openai) {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'Você é um copywriter especialista em marketing náutico premium.' },
              { role: 'user', content: prompt },
            ],
            max_tokens: 1024,
          });
          return completion.choices[0]?.message?.content || '';
        }
      } catch (e: any) {
        this.logger.warn(`OpenAI fallback falhou: ${e.message}`);
      }
      return `${boat.model} ${boat.year} — Uma embarcação de alta performance projetada para oferecer a melhor experiência náutica. Com capacidade para ${boat.capacity} pessoas e tanque de ${boat.fuelCapacity}L, proporciona autonomia e conforto para seus dias na água.`;
    }
  }
}
