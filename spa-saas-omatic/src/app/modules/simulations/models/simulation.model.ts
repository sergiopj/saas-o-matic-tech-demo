export interface SimulationCreate {
    customerId: string;
    activeUsers: number;
    storageGb: number;
    apiCalls: number;
}

export interface Simulation {
    id: string;
    customerId: string;
    activeUsers: number;
    storageGb: number;
    apiCalls: number;
    monthlyBaseCost: number;
    taxRate: number;
    taxAmount: number;
    totalCost: number;
    currency: string;
    createdAt: string;
}

// In-memory projection for the reactive slider before persisting
export interface SimulationProjection {
    activeUsers: number;
    storageGb: number;
    apiCalls: number;
    monthlyBaseCostEur: number;
    taxRate: number;
    taxAmountEur: number;
    totalCostEur: number;
    convertedTotalCost: number;
    targetCurrency: string;
}