import { DomainError } from '../../../../shared/domain/domain.exception';
import { PRICING_TIERS } from '../../../../shared/domain/constants/fiscal.constants';


export function calculateTieredPrice(activeUsers: number): number {
    if (!Number.isInteger(activeUsers) || activeUsers < 0) {
        throw new DomainError('Active users must be an integer greater than or equal to 0.');
    }

    let total = 0;
    let remaining = activeUsers;
    let previousLimit = 0;

    for (const tier of PRICING_TIERS) {
        if (remaining <= 0) break;
        const usersInTier = Math.min(remaining, tier.upTo - previousLimit);
        total += usersInTier * tier.price;
        remaining -= usersInTier;
        previousLimit = tier.upTo;
    }

    return total;
}