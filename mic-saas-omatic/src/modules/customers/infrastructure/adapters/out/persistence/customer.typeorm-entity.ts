import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity('customers')
export class CustomerTypeOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 120 })
  companyName: string;

  @Index({ unique: true })
  @Column('varchar', { length: 20 })
  taxId: string;

  @Column('varchar', { length: 150 })
  email: string;

  @Column('varchar', { length: 2 })
  country: string;

  @Column('varchar', { length: 50 })
  selectedPlan: string;

  @Column('datetime')
  createdAt: Date;
}

