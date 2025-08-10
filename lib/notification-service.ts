import resend from './resend';
import { BookingConfirmationEmail } from '../components/emails/BookingConfirmationEmail';
import { NewBookingNotificationEmail } from '../components/emails/NewBookingNotificationEmail';
import { ServiceStartedEmail } from '../components/emails/ServiceStartedEmail';
import { ServiceCompletedEmail } from '../components/emails/ServiceCompletedEmail';
import { BookingCancelledEmail } from '../components/emails/BookingCancelledEmail';
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
      const emailHtml = await render(
        NewBookingNotificationEmail({
          providerName: data.providerName,
          bookingId: data.bookingId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          serviceName: data.serviceName,
          appointmentTime: data.appointmentTime,
          totalAmount: data.totalAmount,
          serviceLocation: data.serviceLocation,
          deviceInfo: data.deviceInfo,
          issueDescription: data.issueDescription,
        })
      );

      await this.sendEmail(
        data.providerEmail,
        `New Booking Request - ${data.bookingId}`,
        emailHtml
      );
    } catch (error: any) {
      console.error('🔍 Detailed error in sendNewBookingNotificationToProvider:', {
        error,
        errorType: typeof error,
        errorMessage: error.message,
        errorString: error.toString(),
        errorKeys: Object.keys(error),
        errorValues: Object.values(error)
      });
      
      // Better error message extraction
      let errorMessage = 'Unknown error';
      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message;
        } else if (error.statusCode) {
          errorMessage = `HTTP ${error.statusCode}: ${error.message || 'Request failed'}`;
        } else if (error.code) {
          errorMessage = `Code ${error.code}: ${error.message || 'Request failed'}`;
        } else {
          // Try to extract any useful information from the error object
          const errorInfo = Object.entries(error)
            .filter(([key, value]) => value && typeof value === 'string')
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          if (errorInfo) {
            errorMessage = errorInfo;
          }
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      throw new Error(`New booking notification failed: ${errorMessage}`);
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