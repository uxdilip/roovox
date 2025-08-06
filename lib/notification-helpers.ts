import { databases, DATABASE_ID } from './appwrite';
import { NotificationData } from './notification-service';

export async function fetchCustomerData(customerId: string) {
  try {
    const customer = await databases.getDocument(DATABASE_ID, 'users', customerId);
    return {
      name: customer.name,
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
    const provider = await databases.getDocument(DATABASE_ID, 'providers', providerId);
    const user = await databases.getDocument(DATABASE_ID, 'users', provider.user_id);
    
    return {
      name: provider.business_name || user.name,
      email: user.email,
      phone: user.phone,
    };
  } catch (error) {
    console.error('Error fetching provider data:', error);
    throw new Error('Failed to fetch provider data');
  }
}

export async function fetchServiceData(serviceId: string) {
  try {
    const service = await databases.getDocument(DATABASE_ID, 'services', serviceId);
    return {
      name: service.name,
    };
  } catch (error) {
    console.error('Error fetching service data:', error);
    throw new Error('Failed to fetch service data');
  }
}

export async function fetchDeviceData(deviceId: string) {
  try {
    const device = await databases.getDocument(DATABASE_ID, 'devices', deviceId);
    return {
      info: `${device.brand} ${device.model}`,
    };
  } catch (error) {
    console.error('Error fetching device data:', error);
    throw new Error('Failed to fetch device data');
  }
}

export async function buildNotificationData(booking: any): Promise<NotificationData> {
  try {
    const [customerData, providerData, serviceData, deviceData] = await Promise.all([
      fetchCustomerData(booking.customer_id),
      fetchProviderData(booking.provider_id),
      fetchServiceData(booking.service_id),
      fetchDeviceData(booking.device_id),
    ]);

    return {
      bookingId: booking.$id,
      customerName: customerData.name,
      customerEmail: customerData.email,
      customerPhone: customerData.phone,
      providerName: providerData.name,
      providerEmail: providerData.email,
      providerPhone: providerData.phone,
      serviceName: serviceData.name,
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