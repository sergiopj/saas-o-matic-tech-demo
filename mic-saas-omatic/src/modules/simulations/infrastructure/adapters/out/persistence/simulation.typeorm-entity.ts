import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity('simulations')
export class SimulationTypeOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Index()
  @Column('varchar', { length: 36 })
  customerId: string;

  @Column('integer')
  activeUsers: number;

  @Column('float')
  storageGb: number;

  @Column('integer')
  apiCalls: number;

  @Column('decimal', { precision: 10, scale: 2 })
  monthlyBaseCost: number;

  @Column('decimal', { precision: 5, scale: 4 })
  taxRate: number;

  @Column('decimal', { precision: 10, scale: 2 })
  taxAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalCost: number;

  @Column('datetime')
  createdAt: Date;
}
