export interface Customer {
    id: string;
    companyName: string;
    taxId: string;
    email: string;
    country: string;
    selectedPlan: string;
    createdAt: string;
}

export interface CustomerCreate {
    companyName: string;
    taxId: string;
    email: string;
    country: string;
    selectedPlan: string;
}