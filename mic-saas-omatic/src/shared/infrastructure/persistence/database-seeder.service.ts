import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import {
  CUSTOMER_REPOSITORY_PORT,
} from '../../../modules/customers/application/ports/out/customer-repository.port';
import type { CustomerRepositoryPort } from '../../../modules/customers/application/ports/out/customer-repository.port';
import {
  SIMULATION_REPOSITORY_PORT,
} from '../../../modules/simulations/application/ports/out/simulation-repository.port';
import type { SimulationRepositoryPort } from '../../../modules/simulations/application/ports/out/simulation-repository.port';
import { Customer } from '../../../modules/customers/domain/entities/customer.entity';
import { Simulation } from '../../../modules/simulations/domain/entities/simulation.entity';

export interface SeedCustomerDefinition {
  id: string;
  companyName: string;
  taxId: string;
  email: string;
  country: string;
  selectedPlan: string;
  createdAt: Date;
  simulations: Array<{
    id: string;
    activeUsers: number;
    storageGb: number;
    apiCalls: number;
    createdAt: Date;
  }>;
}

export const SEED_CUSTOMERS: SeedCustomerDefinition[] = [
  {
    id: '45a8f147-2aca-4238-9b52-e91a6a343678',
    companyName: 'Roams Telecom S.L.',
    taxId: 'B12345674',
    email: 'billing@roams.es',
    country: 'ES',
    selectedPlan: 'Enterprise Scale',
    createdAt: new Date('2026-09-01T09:00:00Z'),
    simulations: [
      {
        id: 'f6d7094a-8379-4857-872f-9669e59caaf1',
        activeUsers: 15,
        storageGb: 100,
        apiCalls: 50000,
        createdAt: new Date('2026-09-05T10:15:00Z'),
      },
      {
        id: '4f743918-acf5-4635-b1a4-312df082ff57',
        activeUsers: 50,
        storageGb: 200,
        apiCalls: 75000,
        createdAt: new Date('2026-10-12T14:30:00Z'),
      },
    ],
  },
  {
    id: '00b14cae-4bb4-4db4-9b58-3fd764614bd0',
    companyName: 'Telefónica Soluciones S.A.U.',
    taxId: 'A28010833',
    email: 'soluciones@telefonica.es',
    country: 'ES',
    selectedPlan: 'Enterprise Unlimited',
    createdAt: new Date('2026-08-15T08:30:00Z'),
    simulations: [
      {
        id: '8114f2e7-9d58-45a9-bc22-386f916d5501',
        activeUsers: 120,
        storageGb: 1000,
        apiCalls: 250000,
        createdAt: new Date('2026-08-20T11:00:00Z'),
      },
    ],
  },
  {
    id: '00cfb1c8-7a9e-4219-ac29-5673f1121580',
    companyName: 'Inditex Tecnologías S.L.',
    taxId: 'B87654323',
    email: 'sistemas@inditex.com',
    country: 'ES',
    selectedPlan: 'Scale Enterprise',
    createdAt: new Date('2026-08-22T10:00:00Z'),
    simulations: [
      {
        id: '9225a3f8-ae69-46ba-cd33-497a027e6612',
        activeUsers: 75,
        storageGb: 600,
        apiCalls: 150000,
        createdAt: new Date('2026-09-02T16:45:00Z'),
      },
    ],
  },
  {
    id: '9d8a0bc2-799f-40b1-98cd-e1c8346b1be3',
    companyName: 'Mercadona Tech S.L.',
    taxId: 'B98971237',
    email: 'it-billing@mercadona.es',
    country: 'ES',
    selectedPlan: 'Enterprise Scale',
    createdAt: new Date('2026-09-10T11:20:00Z'),
    simulations: [
      {
        id: 'a336b4a9-bf70-47cb-de44-508b138f7723',
        activeUsers: 60,
        storageGb: 450,
        apiCalls: 110000,
        createdAt: new Date('2026-09-18T09:10:00Z'),
      },
    ],
  },
  {
    id: '4ff9a3b0-0689-4a30-84ff-a884100281c2',
    companyName: 'Cabify España S.L.',
    taxId: 'B99887762',
    email: 'finanzas@cabify.com',
    country: 'ES',
    selectedPlan: 'Growth Pro',
    createdAt: new Date('2026-09-15T15:40:00Z'),
    simulations: [
      {
        id: 'b447c5ba-c081-48dc-ef55-619c249a8834',
        activeUsers: 35,
        storageGb: 180,
        apiCalls: 80000,
        createdAt: new Date('2026-09-22T12:00:00Z'),
      },
    ],
  },
  {
    id: 'bb62a2c4-0101-4a6b-870c-2171f5703f6c',
    companyName: 'Glovoapp Spain S.L.',
    taxId: 'B66882218',
    email: 'billing@glovoapp.com',
    country: 'ES',
    selectedPlan: 'Enterprise 500',
    createdAt: new Date('2026-09-20T08:50:00Z'),
    simulations: [
      {
        id: 'c558d6cb-d192-49ed-f066-720d350b9945',
        activeUsers: 90,
        storageGb: 700,
        apiCalls: 200000,
        createdAt: new Date('2026-10-01T17:30:00Z'),
      },
    ],
  },
  {
    id: '7fbabd76-6daf-430a-97bd-242c0e8e7ba9',
    companyName: 'Wallapop Technologies S.L.',
    taxId: 'B66301292',
    email: 'ops@wallapop.com',
    country: 'ES',
    selectedPlan: 'Pro Tier',
    createdAt: new Date('2026-09-25T13:10:00Z'),
    simulations: [
      {
        id: 'd669e7dc-e203-4afe-0177-831e461ca056',
        activeUsers: 25,
        storageGb: 120,
        apiCalls: 45000,
        createdAt: new Date('2026-10-05T10:00:00Z'),
      },
    ],
  },
  {
    id: '7961dd4a-77d8-4c8b-b613-4ce39659f137',
    companyName: 'TravelPerk S.L.',
    taxId: 'B66491820',
    email: 'admin@travelperk.com',
    country: 'ES',
    selectedPlan: 'Business Travel Pro',
    createdAt: new Date('2026-10-01T09:15:00Z'),
    simulations: [
      {
        id: 'e770f8ed-f314-4b0f-1288-942f572db167',
        activeUsers: 45,
        storageGb: 250,
        apiCalls: 95000,
        createdAt: new Date('2026-10-10T15:20:00Z'),
      },
    ],
  },
  {
    id: '3a1290bb-821b-4f01-9a90-7d98c2134011',
    companyName: 'Banco Santander S.A.',
    taxId: 'A39000013',
    email: 'corp-billing@santander.com',
    country: 'ES',
    selectedPlan: 'Enterprise Global',
    createdAt: new Date('2026-07-10T10:00:00Z'),
    simulations: [
      {
        id: 'f88109fe-0425-4c10-2399-0530683ec278',
        activeUsers: 200,
        storageGb: 3500,
        apiCalls: 850000,
        createdAt: new Date('2026-08-01T12:00:00Z'),
      },
    ],
  },
  {
    id: '1b9420dd-933a-4e12-8b89-6e87b1245022',
    companyName: 'BBVA Digital Banking S.A.',
    taxId: 'A48265169',
    email: 'it-finance@bbva.es',
    country: 'ES',
    selectedPlan: 'Enterprise Scale',
    createdAt: new Date('2026-07-20T14:30:00Z'),
    simulations: [
      {
        id: '09921a0f-1536-4d21-3400-1641794fd389',
        activeUsers: 180,
        storageGb: 2200,
        apiCalls: 450000,
        createdAt: new Date('2026-08-10T09:40:00Z'),
      },
    ],
  },
  {
    id: '2c8310ee-044b-4f23-9c90-5f76a2356033',
    companyName: 'Iberdrola Clientes S.A.U.',
    taxId: 'A95748372',
    email: 'facturacion@iberdrola.es',
    country: 'ES',
    selectedPlan: 'Enterprise Green',
    createdAt: new Date('2026-08-05T11:00:00Z'),
    simulations: [
      {
        id: '1aa32b10-2647-4e32-4511-27528a50e490',
        activeUsers: 110,
        storageGb: 950,
        apiCalls: 220000,
        createdAt: new Date('2026-08-25T16:15:00Z'),
      },
    ],
  },
  {
    id: '5d7201ff-155c-4a34-0d01-4e65b3467044',
    companyName: 'SEAT S.A.',
    taxId: 'A28049161',
    email: 'procurement@seat.es',
    country: 'ES',
    selectedPlan: 'Industrial Pro',
    createdAt: new Date('2026-08-12T16:00:00Z'),
    simulations: [
      {
        id: '2bb43c21-3758-4f43-5622-38639b61f501',
        activeUsers: 85,
        storageGb: 800,
        apiCalls: 170000,
        createdAt: new Date('2026-09-08T11:50:00Z'),
      },
    ],
  },
  {
    id: 'bb0f92d1-f28e-4e3c-b801-1639e1dc882d',
    companyName: 'Berlin Cloud GmbH',
    taxId: 'DE999888777',
    email: 'finance@berlincloud.de',
    country: 'DE',
    selectedPlan: 'Growth Plan',
    createdAt: new Date('2026-09-02T10:13:35Z'),
    simulations: [
      {
        id: '3cc54d32-4869-4054-6733-4974ac720612',
        activeUsers: 20,
        storageGb: 100,
        apiCalls: 30000,
        createdAt: new Date('2026-09-12T14:00:00Z'),
      },
    ],
  },
  {
    id: '6e6192aa-266d-4b45-1e12-3d54c4578055',
    companyName: 'Celonis SE',
    taxId: 'DE815412903',
    email: 'sales-ops@celonis.de',
    country: 'DE',
    selectedPlan: 'Enterprise AI',
    createdAt: new Date('2026-08-18T12:00:00Z'),
    simulations: [
      {
        id: '4dd65e43-597a-4165-7844-5a85bd831723',
        activeUsers: 65,
        storageGb: 400,
        apiCalls: 130000,
        createdAt: new Date('2026-08-28T15:20:00Z'),
      },
    ],
  },
  {
    id: '7f5083bb-377e-4c56-2f23-2c43d5689066',
    companyName: 'Doctolib SAS',
    taxId: 'FR45801234567',
    email: 'billing@doctolib.fr',
    country: 'FR',
    selectedPlan: 'Healthcare Scale',
    createdAt: new Date('2026-09-08T13:40:00Z'),
    simulations: [
      {
        id: '5ee76f54-608b-4276-8955-6b96ce942834',
        activeUsers: 40,
        storageGb: 300,
        apiCalls: 90000,
        createdAt: new Date('2026-09-19T10:30:00Z'),
      },
    ],
  },
  {
    id: '8a4f74cc-488f-4d67-3a34-1b32e6790077',
    companyName: 'Datadog France SAS',
    taxId: 'FR90812345678',
    email: 'finance@datadoghq.fr',
    country: 'FR',
    selectedPlan: 'Cloud Enterprise',
    createdAt: new Date('2026-08-30T09:00:00Z'),
    simulations: [
      {
        id: '6ff87065-719c-4387-9066-7ca7df053945',
        activeUsers: 95,
        storageGb: 1200,
        apiCalls: 350000,
        createdAt: new Date('2026-09-14T11:15:00Z'),
      },
    ],
  },
  {
    id: '4ba60023-5984-42c5-b220-5cd6f2f9f86c',
    companyName: 'Silicon Valley AI Inc',
    taxId: '123456789',
    email: 'admin@sv-ai.com',
    country: 'US',
    selectedPlan: 'Pro Plan',
    createdAt: new Date('2026-09-03T10:13:38Z'),
    simulations: [
      {
        id: '70098176-820d-4498-0177-8db8e0164a56',
        activeUsers: 30,
        storageGb: 150,
        apiCalls: 60000,
        createdAt: new Date('2026-09-15T16:00:00Z'),
      },
    ],
  },
  {
    id: '9b3e65dd-599a-4e78-4b45-0a21f7801088',
    companyName: 'Snowflake Computing Inc',
    taxId: '987654321',
    email: 'billing@snowflake.com',
    country: 'US',
    selectedPlan: 'Data Cloud Scale',
    createdAt: new Date('2026-08-14T15:00:00Z'),
    simulations: [
      {
        id: '811a9287-931e-4509-1288-9ec9f1275b67',
        activeUsers: 150,
        storageGb: 3000,
        apiCalls: 800000,
        createdAt: new Date('2026-09-01T14:10:00Z'),
      },
    ],
  },
];

@Injectable()
export class DatabaseSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSeederService.name);

  constructor(
    @Inject(CUSTOMER_REPOSITORY_PORT)
    private readonly customerRepository: CustomerRepositoryPort,
    @Inject(SIMULATION_REPOSITORY_PORT)
    private readonly simulationRepository: SimulationRepositoryPort,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seed(false);
  }

  async seed(force = false): Promise<{ customersCount: number; simulationsCount: number }> {
    const existing = await this.customerRepository.search(undefined, undefined, 1, 1);
    if (!force && existing.total > 0) {
      this.logger.log(`Database already populated (${existing.total} customers). Skipping auto-seed.`);
      return { customersCount: existing.total, simulationsCount: 0 };
    }

    this.logger.log(`Seeding database with ${SEED_CUSTOMERS.length} corporate customers and simulations...`);

    let customersCount = 0;
    let simulationsCount = 0;

    for (const def of SEED_CUSTOMERS) {
      let customer = await this.customerRepository.findById(def.id);
      if (!customer) {
        customer = await this.customerRepository.findByTaxId(def.taxId);
      }

      if (!customer) {
        customer = Customer.reconstitute({
          id: def.id,
          companyName: def.companyName,
          taxId: def.taxId,
          email: def.email,
          country: def.country,
          selectedPlan: def.selectedPlan,
          createdAt: def.createdAt,
        });
        await this.customerRepository.save(customer);
        customersCount++;
      }

      if (customer) {
        const existingSimulations = await this.simulationRepository.findByCustomerId(customer.getId());
        const existingSimIds = new Set(existingSimulations.map((s) => s.getId()));

        for (const simDef of def.simulations) {
          if (!existingSimIds.has(simDef.id)) {
            const simulation = Simulation.create(
              {
                id: simDef.id,
                customerId: customer.getId(),
                customerCountry: customer.getCountry(),
                activeUsers: simDef.activeUsers,
                storageGb: simDef.storageGb,
                apiCalls: simDef.apiCalls,
              },
              () => simDef.id,
            );
            await this.simulationRepository.save(simulation);
            simulationsCount++;
          }
        }
      }
    }

    this.logger.log(
      `Database seeding finished successfully: +${customersCount} customers, +${simulationsCount} simulations.`,
    );

    return { customersCount, simulationsCount };
  }
}
