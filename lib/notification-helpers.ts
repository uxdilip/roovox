import { databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { NotificationData } from './notification-service';

export async function fetchCustomerData(customerId: string) {
  try {
    const customer = await databases.getDocument(DATABASE_ID, COLLECTIONS.CUSTOMERS, customerId);
    return {
      name: customer.full_name, // Changed from customer.name to customer.full_name
      email: customer.email,
      phone: customer.phone,
    };
  } catch (error) {
    console.error('Error fetching customer data:', error);
    throw new Error('Failed to fetch customer data');
  }
}

export async function fetchProviderData(providerId: string) {
  try {
    const provider = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROVIDERS, providerId);
    
    // The provider document contains email and phone directly
    // The providerId field references the user, but we don't need to fetch it for notifications
    return {
      name: `Provider ${provider.providerId?.slice(-4) || 'Unknown'}`, // Use last 4 chars of providerId as name
      email: provider.email,
      phone: provider.phone,
    };
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

export async function buildNotificationData(booking: any): Promise<NotificationData> {
  try {
    const [customerData, providerData, deviceData] = await Promise.all([
      fetchCustomerData(booking.customer_id),
      fetchProviderData(booking.provider_id),
      fetchDeviceData(booking.device_id),
    ]);

    // Extract service info from booking's selected_issues field
    let serviceName = 'Service';
    try {
      if (booking.selected_issues) {
        const selectedIssues = JSON.parse(booking.selected_issues);
        if (Array.isArray(selectedIssues) && selectedIssues.length > 0) {
          serviceName = selectedIssues.map((issue: any) => issue.name).join(', ');
        }
      }
    } catch (parseError) {
      console.error('Error parsing selected_issues:', parseError);
    }

    return {
      bookingId: booking.$id,
      customerName: customerData.name,
      customerEmail: customerData.email,
      customerPhone: customerData.phone,
      providerName: providerData.name,
      providerEmail: providerData.email,
      providerPhone: providerData.phone,
      serviceName: serviceName,
      appointmentTime: booking.appointment_time,
      totalAmount: booking.total_amount,
      serviceLocation: booking.customer_address || 'Service Location',
      deviceInfo: deviceData.info,
      issueDescription: booking.issue_description || 'No description provided',
    };
  } catch (error) {
    console.error('Error building notification data:', error);
    throw new Error('Failed to build notification data');
  }
} 