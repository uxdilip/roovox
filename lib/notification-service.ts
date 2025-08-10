import resend from './resend';
import BookingConfirmationEmail from '../components/emails/BookingConfirmationEmail';
import NewBookingNotificationEmail from '../components/emails/NewBookingNotificationEmail';
import ServiceStartedEmail from '../components/emails/ServiceStartedEmail';
import ServiceCompletedEmail from '../components/emails/ServiceCompletedEmail';
import BookingCancelledEmail from '../components/emails/BookingCancelledEmail';
import { render } from '@react-email/components';


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

export class NotificationService {
  private static async sendEmail(to: string, subject: string, htmlContent: string) {
    try {
      // Validate inputs
      if (!to || !subject || !htmlContent) {
        throw new Error('Missing required parameters: to, subject, or htmlContent');
      }

      if (typeof htmlContent !== 'string') {
        throw new Error(`HTML content must be a string, got: ${typeof htmlContent}`);
      }

      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'notifications@sniket.com', // Use environment variable or fallback
        to: [to],
        subject,
        html: htmlContent,
      });

      if (error) {
        // Log the error structure for debugging
        console.error('🔍 Resend error structure:', {
          error,
          errorType: typeof error,
          errorKeys: Object.keys(error),
          errorValues: Object.values(error)
        });
        throw error;
      }

      return data;
    } catch (error: any) {
      // Log the caught error structure for debugging
      console.error('🔍 Caught error in sendEmail:', {
        error,
        errorType: typeof error,
        errorKeys: Object.keys(error),
        errorValues: Object.values(error)
      });
      throw error;
    }
  }

  static async sendBookingConfirmationToCustomer(data: NotificationData) {
    try {
      const emailHtml = await render(
        BookingConfirmationEmail({
          customerName: data.customerName,
          bookingId: data.bookingId,
          serviceName: data.serviceName,
          appointmentTime: data.appointmentTime,
          totalAmount: data.totalAmount,
          providerName: data.providerName,
          providerPhone: data.providerPhone,
          serviceLocation: data.serviceLocation,
          deviceInfo: data.deviceInfo,
        })
      );

      await this.sendEmail(
        data.customerEmail,
        `Booking Confirmed - ${data.bookingId}`,
        emailHtml
      );

    } catch (error: any) {
      throw new Error(`Booking confirmation failed: ${error.message || error.toString() || 'Unknown error'}`);
    }
  }

  static async sendNewBookingNotificationToProvider(data: NotificationData) {
    try {
      // Create simple HTML email template
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Booking Request</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <h1 style="color: #007bff; margin: 0;">🔧 Sniket</h1>
          </div>
          
          <div style="padding: 20px;">
            <h2 style="color: #28a745;">New Booking Request!</h2>
            <p>Hi ${data.providerName},</p>
            <p>You have received a new booking request. Please review the details below:</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Booking Details</h3>
              <p><strong>Booking ID:</strong> ${data.bookingId}</p>
              <p><strong>Service:</strong> ${data.serviceName}</p>
              <p><strong>Device:</strong> ${data.deviceInfo}</p>
              <p><strong>Appointment:</strong> ${data.appointmentTime}</p>
              <p><strong>Location:</strong> ${data.serviceLocation}</p>
              <p><strong>Amount:</strong> ₹${data.totalAmount}</p>
            </div>
            
            <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Customer Information</h3>
              <p><strong>Name:</strong> ${data.customerName}</p>
              <p><strong>Phone:</strong> ${data.customerPhone}</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Issue Description</h3>
              <p>${data.issueDescription}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p>Please confirm this booking within 2 hours to avoid automatic cancellation.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/provider/bookings/${data.bookingId}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Booking Details</a>
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin-top: 20px;">
            <p style="margin: 0;">Thank you for being part of Sniket! 🚀</p>
            <p style="margin: 5px 0 0 0;">Need help? Contact us at support@sniket.com</p>
          </div>
        </body>
        </html>
      `;
      
      await this.sendEmail(
        data.providerEmail,
        `New Booking Request - ${data.bookingId}`,
        emailHtml
      );
    } catch (error: any) {
      console.error('🔍 Error in sendNewBookingNotificationToProvider:', error);
      throw new Error(`New booking notification failed: ${error.message || error.toString() || 'Unknown error'}`);
    }
  }

  static async sendServiceStartedNotification(data: NotificationData) {
    try {
      const emailHtml = await render(
        ServiceStartedEmail({
          customerName: data.customerName,
          bookingId: data.bookingId,
          serviceName: data.serviceName,
          deviceInfo: data.deviceInfo,
        })
      );

      await this.sendEmail(
        data.customerEmail,
        `Service Started - ${data.bookingId}`,
        emailHtml
      );

    } catch (error: any) {
      throw new Error(`Service started notification failed: ${error.message || error.toString() || 'Unknown error'}`);
    }
  }

  static async sendServiceCompletedNotification(data: NotificationData) {
    try {
      const emailHtml = await render(
        ServiceCompletedEmail({
          customerName: data.customerName,
          bookingId: data.bookingId,
          serviceName: data.serviceName,
          deviceInfo: data.deviceInfo,
        })
      );

      await this.sendEmail(
        data.customerEmail,
        `Service Completed - ${data.bookingId}`,
        emailHtml
      );

    } catch (error: any) {
      throw new Error(`Service completed notification failed: ${error.message || error.toString() || 'Unknown error'}`);
    }
  }

  static async sendBookingCancelledNotification(data: NotificationData, reason?: string) {
    try {
      const emailHtml = await render(
        BookingCancelledEmail({
          customerName: data.customerName,
          bookingId: data.bookingId,
          serviceName: data.serviceName,
          deviceInfo: data.deviceInfo,
          reason,
        })
      );

      await this.sendEmail(
        data.customerEmail,
        `Booking Cancelled - ${data.bookingId}`,
        emailHtml
      );

    } catch (error: any) {
      throw new Error(`Booking cancelled notification failed: ${error.message || error.toString() || 'Unknown error'}`);
    }
  }
} 