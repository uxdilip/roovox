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
        from: 'onboarding@resend.dev',
        to: [to],
        subject,
        html: htmlContent,
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
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

    } catch (error) {
      throw new Error(`Booking confirmation failed: ${error.message}`);
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
      throw new Error(`New booking notification failed: ${error.message}`);
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

    } catch (error) {
      throw new Error(`Service started notification failed: ${error.message}`);
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

    } catch (error) {
      throw new Error(`Service completed notification failed: ${error.message}`);
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

    } catch (error) {
      throw new Error(`Booking cancelled notification failed: ${error.message}`);
    }
  }
} 