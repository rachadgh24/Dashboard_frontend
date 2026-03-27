export type HasClaimFn = (claimName: string) => boolean;

export function getLandingRoute(hasClaim: HasClaimFn): string {
  if (hasClaim('ViewDashboard')) return '/home';
  if (hasClaim('ViewCustomers')) return '/customers';
  if (hasClaim('ViewCars')) return '/sales';
  if (hasClaim('ViewUsers')) return '/users';
  return '/no-access';
}

