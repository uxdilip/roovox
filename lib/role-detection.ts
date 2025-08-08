import { getProviderByUserId, getCustomerByUserId } from './appwrite-services';

export interface RoleDetectionResult {
  hasProvider: boolean;
  hasCustomer: boolean;
  provider: any | null;
  customer: any | null;
  isProviderLogin: boolean;
}

export const detectUserRoles = async (userId: string, isProviderLogin: boolean = false): Promise<RoleDetectionResult> => {
  try {
    // Check both provider and customer profiles
    const [provider, customer] = await Promise.all([
      getProviderByUserId(userId).catch(() => null),
      getCustomerByUserId(userId).catch(() => null)
    ]);

    return {
      hasProvider: !!provider,
      hasCustomer: !!customer,
      provider,
      customer,
      isProviderLogin
    };
  } catch (error) {
    console.error('Error detecting user roles:', error);
    return {
      hasProvider: false,
      hasCustomer: false,
      provider: null,
      customer: null,
      isProviderLogin
    };
  }
};

export const getRedirectPath = (roleResult: RoleDetectionResult): string => {
  const { hasProvider, hasCustomer, isProviderLogin, provider } = roleResult;

  if (hasProvider && hasCustomer) {
    // User has both roles - prioritize based on login context
    return isProviderLogin ? '/provider/dashboard' : '/customer/dashboard';
  } else if (hasProvider) {
    // User is provider only
    if (isProviderLogin) {
      // Provider login - check onboarding status
      if (provider?.business_name && provider.business_name !== 'Your Business') {
        return '/provider/dashboard';
      } else {
        return '/provider/onboarding';
      }
    } else {
      // Customer login but user is provider
      return '/provider/dashboard';
    }
  } else if (hasCustomer) {
    // User is customer only
    if (!isProviderLogin) {
      // Customer login - proceed normally
      return '/customer/dashboard';
    } else {
      // Provider login but user is customer
      return '/customer/dashboard';
    }
  } else {
    // New user - redirect based on login context
    return isProviderLogin ? '/provider/onboarding' : '/customer/onboarding';
  }
};

export const getCrossRoleMessage = (roleResult: RoleDetectionResult): string | null => {
  const { hasProvider, hasCustomer, isProviderLogin } = roleResult;

  if (hasProvider && !isProviderLogin) {
    return 'This account is registered as a provider. Redirecting to provider dashboard.';
  } else if (hasCustomer && isProviderLogin) {
    return 'This account is registered as a customer. Redirecting to customer dashboard.';
  }

  return null;
}; 