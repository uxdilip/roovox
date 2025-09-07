import { EmailNotificationData } from './email-service';
import { fetchCustomerData, fetchProviderData, fetchServiceData, fetchDeviceData } from './notification-helpers';

export async function buildEmailNotificationData(booking: any): Promise<EmailNotificationData> {
  try {
    console.log(`📧 Building email notification data for booking: ${booking.$id}`);
    
    const [customerData, providerData, serviceData, deviceData] = await Promise.all([
      fetchCustomerData(booking.customer_id),
      fetchProviderData(booking.provider_id), 
      fetchServiceData(booking.service_id),
      fetchDeviceData(booking.device_id),
    ]);

    console.log(`📧 Email data built - Customer: ${customerData.email}, Provider: ${providerData.email}`);

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
      serviceLocation: booking.service_location || booking.customer_address || 'Service Location',
      deviceInfo: deviceData.info,
      issueDescription: booking.issue_description || booking.selected_issues?.join(', ') || 'Device repair service',
    };
  } catch (error) {
    console.error('Error building email notification data:', error);
    throw new Error(`Failed to build email notification data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to safely send emails (with error handling)
export async function safeEmailSend(emailFunction: () => Promise<any>, description: string) {
  try {
    await emailFunction();
    console.log(`✅ ${description} sent successfully`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error instanceof Error ? error.message : 'Unknown error');
    // Don't throw - log error but continue (email failures shouldn't break booking flow)
  }
}
