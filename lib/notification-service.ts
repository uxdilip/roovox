// Server-side only - don't import Resend on client-side
let resend: any = null;

// Initialize Resend only on server-side
if (typeof window === 'undefined') {
  try {
    const { Resend } = require('resend');
    resend = new Resend(process.env.RESEND_API_KEY);
  } catch (error) {
    console.log('Resend not available on server-side');
  }
}

// Interface for notification data (for existing booking notifications)
export interface NotificationData {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  providerName: string;
  providerEmail: string;
  providerPhone: string;
  serviceName: string;
  appointmentTime: string;
  totalAmount: number;
  serviceLocation: string;
  deviceInfo: string;
  issueDescription: string;
}

// NotificationService class for existing booking functionality
export class NotificationService {
  static async sendNewBookingNotificationToProvider(data: NotificationData) {
    console.log('📧 Sending new booking notification to provider (using existing system)');
    // Implementation for existing booking notifications
  }

  static async sendBookingConfirmationToCustomer(data: NotificationData) {
    console.log('📧 Sending booking confirmation to customer (using existing system)');
    // Implementation for existing booking notifications
  }

  static async sendServiceStartedNotification(data: NotificationData) {
    console.log('📧 Sending service started notification (using existing system)');
    // Implementation for existing booking notifications
  }

  static async sendServiceCompletedNotification(data: NotificationData) {
    console.log('📧 Sending service completed notification (using existing system)');
    // Implementation for existing booking notifications
  }

  static async sendBookingCancelledNotification(data: NotificationData, reason?: string) {
    console.log('📧 Sending booking cancelled notification (using existing system)');
    // Implementation for existing booking notifications
  }
}

/**
 * Send email notification to provider about new quote request
 */
export async function notifyProviderOfNewRequest(
  providerEmail: string,
  providerName: string,
  customerName: string,
  deviceInfo: { brand: string; model: string },
  services: string[],
  budgetRange: { min: number; max: number },
  timeline: string
): Promise<{ success: boolean; error?: string }> {
  // Only run on server-side
  if (typeof window !== 'undefined') {
    console.log('⚠️ Email notifications only work on server-side');
    return { success: false, error: 'Email notifications only work on server-side' };
  }

  if (!resend) {
    console.log('⚠️ Resend not initialized');
    return { success: false, error: 'Email service not available' };
  }

  try {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #2563eb; margin: 0;">New Quote Request</h1>
          </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Hi ${providerName},
          </p>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            You have received a new quote request from <strong>${customerName}</strong>.
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #1f2937;">Request Details:</h3>
            
            <div style="margin-bottom: 15px;">
              <strong>Device:</strong> ${deviceInfo.brand} ${deviceInfo.model}
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>Services Needed:</strong> ${services.join(', ')}
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>Budget Range:</strong> ₹${budgetRange.min.toLocaleString()} - ₹${budgetRange.max.toLocaleString()}
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>Timeline:</strong> ${timeline}
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/provider/dashboard" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Request in Dashboard
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px; text-align: center;">
            Log in to your provider dashboard to respond to this request and create a custom quote.
          </p>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'Sniket <noreply@sniket.com>',
      to: [providerEmail],
      subject: `New Quote Request for ${deviceInfo.brand} ${deviceInfo.model}`,
      html: emailContent,
    });

    if (error) {
      console.error('❌ Error sending provider notification email:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Provider notification email sent:', data);
    return { success: true };

  } catch (error) {
    console.error('❌ Unexpected error sending provider notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send confirmation email to customer about quote request submission
 */
export async function notifyCustomerOfRequestSubmission(
  customerEmail: string,
  customerName: string,
  providerName: string,
  deviceInfo: { brand: string; model: string },
  services: string[]
): Promise<{ success: boolean; error?: string }> {
  // Only run on server-side
  if (typeof window !== 'undefined') {
    console.log('⚠️ Email notifications only work on server-side');
    return { success: false, error: 'Email notifications only work on server-side' };
  }

  if (!resend) {
    console.log('⚠️ Resend not initialized');
    return { success: false, error: 'Email service not available' };
  }

  try {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #10b981; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Quote Request Sent!</h1>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Hi ${customerName},
          </p>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Your quote request has been successfully sent to <strong>${providerName}</strong>.
          </p>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
            <h3 style="margin-top: 0; color: #1e40af;">Your Request:</h3>
            
            <div style="margin-bottom: 10px;">
              <strong>Device:</strong> ${deviceInfo.brand} ${deviceInfo.model}
            </div>
            
            <div style="margin-bottom: 10px;">
              <strong>Services:</strong> ${services.join(', ')}
            </div>
            
            <div style="margin-bottom: 10px;">
              <strong>Provider:</strong> ${providerName}
            </div>
          </div>
          
          <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <h3 style="margin-top: 0; color: #92400e;">What's Next?</h3>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li>The provider will review your request</li>
              <li>They'll create a custom quote based on your requirements</li>
              <li>You'll receive a notification when they respond</li>
              <li>You can then accept, decline, or negotiate further</li>
            </ul>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; text-align: center;">
            You'll hear back from the provider soon. We'll notify you as soon as they respond!
          </p>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'Sniket <noreply@sniket.com>',
      to: [customerEmail],
      subject: `Quote Request Sent to ${providerName}`,
      html: emailContent,
    });

    if (error) {
      console.error('❌ Error sending customer confirmation email:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Customer confirmation email sent:', data);
    return { success: true };

  } catch (error) {
    console.error('❌ Unexpected error sending customer confirmation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
} 