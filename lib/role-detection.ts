import { getProviderByUserId, getCustomerByUserId } from './appwrite-services';

export interface RoleDetectionResult {
  hasProvider: boolean;
  hasCustomer: boolean;
  provider: any | null;
  customer: any | null;
  isProviderLogin: boolean;
  needsPhoneOnboarding: boolean; // For customers who need phone
  needsProviderOnboarding: boolean; // For providers who need onboarding
}

export const detectUserRoles = async (userId: string, isProviderLogin: boolean = false, userPhone?: string): Promise<RoleDetectionResult> => {
  try {
    // Check both provider and customer profiles
    const [provider, customer] = await Promise.all([
      getProviderByUserId(userId).catch(() => null),
      getCustomerByUserId(userId).catch(() => null)
    ]);

    // Check if user needs phone onboarding (Google OAuth customers who don't have phone)
    const needsPhoneOnboarding = !userPhone || userPhone.trim() === '';
    
    // Check if provider needs onboarding (new provider or incomplete onboarding)
    const needsProviderOnboarding = isProviderLogin && (!provider || 
      !provider.business_name || 
      provider.business_name === 'Your Business');

    return {
      hasProvider: !!provider,
      hasCustomer: !!customer,
      provider,
      customer,
      isProviderLogin,
      needsPhoneOnboarding,
      needsProviderOnboarding
    };
  } catch (error) {
    console.error('Error detecting user roles:', error);
    return {
      hasProvider: false,
      hasCustomer: false,
      provider: null,
      customer: null,
      isProviderLogin: false,
      needsPhoneOnboarding: true,
      needsProviderOnboarding: false
    };
  }
};

export const getRedirectPath = (roleResult: RoleDetectionResult): string => {
  const { hasProvider, hasCustomer, isProviderLogin, provider, needsPhoneOnboarding, needsProviderOnboarding } = roleResult;

  // Provider login - check if onboarding is needed
  if (isProviderLogin && needsProviderOnboarding) {
    return '/provider/onboarding';
  }

  // Customer login - check if phone onboarding is needed (Google OAuth without phone)
  if (!isProviderLogin && needsPhoneOnboarding) {
    return '/customer/onboarding';
  }

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