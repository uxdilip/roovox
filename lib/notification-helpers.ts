import { databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { Query } from 'appwrite';

export async function fetchCustomerData(customerId: string) {
  try {
    // First try to find customer by user_id in customers collection
    try {
      const customerResponse = await databases.listDocuments(
        DATABASE_ID, 
        COLLECTIONS.CUSTOMERS, 
        [Query.equal('user_id', customerId), Query.limit(1)]
      );
      
      if (customerResponse.documents.length > 0) {
        const customer = customerResponse.documents[0];
        return {
          name: customer.full_name,
          email: customer.email,
          phone: customer.phone,
        };
      }
    } catch (error) {
      console.log('Customer not found in customers collection, trying user collection...');
    }
    
    // Fallback to user collection
    const userResponse = await databases.listDocuments(
      DATABASE_ID, 
      COLLECTIONS.USERS, 
      [Query.equal('user_id', customerId), Query.limit(1)]
    );
    
    if (userResponse.documents.length > 0) {
      const user = userResponse.documents[0];
      return {
        name: user.name,
        email: user.email,
        phone: user.phone || 'No phone',
      };
    }
    
    throw new Error('Customer not found in any collection');
  } catch (error) {
    console.error('Error fetching customer data:', error);
    throw new Error('Failed to fetch customer data');
  }
}

export async function fetchProviderData(providerId: string) {
  try {
    // First try business_setup collection - it has the most complete provider information
    try {
      const businessSetupResponse = await databases.listDocuments(
        DATABASE_ID, 
        COLLECTIONS.BUSINESS_SETUP, 
        [Query.equal('user_id', providerId), Query.limit(1)]
      );
      
      if (businessSetupResponse.documents.length > 0) {
        const businessSetup = businessSetupResponse.documents[0];
        
        // Try to get business name and email from onboarding data
        let businessName = 'Provider';
        let providerEmail = null;
        let providerPhone = null;
        
        try {
          if (businessSetup.onboarding_data) {
            const onboardingData = JSON.parse(businessSetup.onboarding_data);
            businessName = onboardingData?.businessInfo?.businessName || 'Provider';
            
            // Check for email in onboarding data - using the correct path structure
            if (onboardingData?.personalDetails?.email) {
              providerEmail = onboardingData.personalDetails.email;
            } else if (onboardingData?.personalInfo?.email) {
              providerEmail = onboardingData.personalInfo.email;
            } else if (onboardingData?.contactInfo?.email) {
              providerEmail = onboardingData.contactInfo.email;
            } else if (onboardingData?.email) {
              providerEmail = onboardingData.email;
            }
            
            // Check for phone in onboarding data
            if (onboardingData?.personalDetails?.mobile) {
              providerPhone = onboardingData.personalDetails.mobile;
            } else if (onboardingData?.personalInfo?.phone) {
              providerPhone = onboardingData.personalInfo.phone;
            } else if (onboardingData?.contactInfo?.phone) {
              providerPhone = onboardingData.contactInfo.phone;
            }
          }
        } catch (parseError) {
          console.error('Error parsing business setup onboarding data:', parseError);
        }
        
        // Check direct email field first, then onboarding data
        if (businessSetup.email && businessSetup.email !== 'No email') {
          return {
            name: businessName,
            email: businessSetup.email,
            phone: providerPhone || businessSetup.phone || 'No phone',
          };
        } else if (providerEmail && providerEmail !== 'No email') {
          return {
            name: businessName,
            email: providerEmail,
            phone: providerPhone || businessSetup.phone || 'No phone',
          };
        }
      }
    } catch (error) {
      console.log('Provider not found in business_setup collection...');
    }
    
    // Try providers collection
    try {
      const providerResponse = await databases.listDocuments(
        DATABASE_ID, 
        COLLECTIONS.PROVIDERS, 
        [Query.equal('user_id', providerId), Query.limit(1)]
      );
      
      if (providerResponse.documents.length > 0) {
        const provider = providerResponse.documents[0];
        if (provider.email && provider.email !== 'No email') {
          return {
            name: `Provider ${provider.providerId?.slice(-4) || 'Unknown'}`,
            email: provider.email,
            phone: provider.phone,
          };
        }
      }
    } catch (error) {
      console.log('Provider not found in providers collection...');
    }
    
    // Try user collection as fallback
    try {
      const userResponse = await databases.listDocuments(
        DATABASE_ID, 
        COLLECTIONS.USERS, 
        [Query.equal('user_id', providerId), Query.limit(1)]
      );
      
      if (userResponse.documents.length > 0) {
        const user = userResponse.documents[0];
        return {
          name: user.name || 'Provider',
          email: user.email || 'No email',
          phone: user.phone || 'No phone',
        };
      }
    } catch (error) {
      console.log('Provider not found in user collection either');
    }
    
    throw new Error('Provider not found in any collection');
  } catch (error) {
    console.error('Error fetching provider data:', error);
    throw new Error('Failed to fetch provider data');
  }
}

export async function fetchServiceData(serviceId: string) {
  try {
    // Try to fetch from custom_series_services first
    const service = await databases.getDocument(DATABASE_ID, COLLECTIONS.CUSTOM_SERIES_SERVICES, serviceId);
    return {
      name: service.name || service.service_name || 'Service',
    };
  } catch (error) {
    console.error('Error fetching service data:', error);
    // If service fetch fails, return a default name
    return {
      name: 'Service',
    };
  }
}

export async function fetchDeviceData(deviceId: string) {
  try {
    // Try to fetch from phones collection first
    try {
      const device = await databases.getDocument(DATABASE_ID, COLLECTIONS.PHONES, deviceId);
      return {
        info: `${device.brand || 'Phone'} ${device.model || 'Device'}`,
      };
    } catch (phoneError) {
      // If not found in phones, try laptops
      const device = await databases.getDocument(DATABASE_ID, COLLECTIONS.LAPTOPS, deviceId);
      return {
        info: `${device.brand || 'Laptop'} ${device.model || 'Device'}`,
      };
    }
  } catch (error) {
    console.error('Error fetching device data:', error);
    // If device fetch fails, return a default info
    return {
      info: 'Device',
    };
  }
}

 