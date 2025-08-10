// Simple HTML email templates that don't rely on React Email components

export const createNewBookingEmail = (data: {
  providerName: string;
  bookingId: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  appointmentTime: string;
  totalAmount: number;
  serviceLocation: string;
  deviceInfo: string;
  issueDescription: string;
}) => {
  const formattedDate = new Date(data.appointmentTime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Booking Request - Sniket</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .logo { font-size: 24px; font-weight: bold; color: #007bff; }
        .content { background: white; padding: 30px; border: 1px solid #dee2e6; }
        .title { font-size: 24px; color: #007bff; margin-bottom: 20px; }
        .greeting { font-size: 18px; margin-bottom: 20px; }
        .paragraph { margin-bottom: 15px; }
        .booking-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-label { font-weight: bold; margin-bottom: 8px; }
        .customer-info { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .section-title { font-size: 18px; font-weight: bold; color: #1976d2; margin-bottom: 15px; }
        .customer-name { font-size: 16px; font-weight: bold; margin-bottom: 8px; }
        .customer-contact { margin-bottom: 8px; }
        .issue-info { background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .issue-text { margin-bottom: 8px; }
        .action-section { text-align: center; margin: 30px 0; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
        .footer-text { color: #6c757d; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🔧 Sniket</div>
        </div>
        
        <div class="content">
          <div class="title">New Booking Request!</div>
          <div class="greeting">Hi ${data.providerName},</div>
          <div class="paragraph">
            You have received a new booking request. Please review the details below:
          </div>

          <div class="booking-details">
            <div class="detail-label">Booking ID: ${data.bookingId}</div>
            <div class="detail-label">Service: ${data.serviceName}</div>
            <div class="detail-label">Device: ${data.deviceInfo}</div>
            <div class="detail-label">Appointment: ${formattedDate}</div>
            <div class="detail-label">Location: ${data.serviceLocation}</div>
            <div class="detail-label">Amount: ₹${data.totalAmount}</div>
          </div>

          <div class="customer-info">
            <div class="section-title">Customer Information</div>
            <div class="customer-name">${data.customerName}</div>
            <div class="customer-contact">📞 ${data.customerPhone}</div>
          </div>

          <div class="issue-info">
            <div class="section-title">Issue Description</div>
            <div class="issue-text">${data.issueDescription}</div>
          </div>

          <div class="action-section">
            <div class="paragraph">
              Please confirm this booking within 2 hours to avoid automatic cancellation.
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/provider/bookings/${data.bookingId}" class="button">
              View Booking Details
            </a>
          </div>
        </div>

        <div class="footer">
          <div class="footer-text">
            Thank you for being part of Sniket! 🚀
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const createBookingConfirmationEmail = (data: {
  customerName: string;
  bookingId: string;
  serviceName: string;
  appointmentTime: string;
  totalAmount: number;
  providerName: string;
  providerPhone: string;
  serviceLocation: string;
  deviceInfo: string;
}) => {
  const formattedDate = new Date(data.appointmentTime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmed - Sniket</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #d4edda; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .logo { font-size: 24px; font-weight: bold; color: #155724; }
        .content { background: white; padding: 30px; border: 1px solid #c3e6cb; }
        .title { font-size: 24px; color: #155724; margin-bottom: 20px; }
        .greeting { font-size: 18px; margin-bottom: 20px; }
        .paragraph { margin-bottom: 15px; }
        .booking-details { background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-label { font-weight: bold; margin-bottom: 8px; }
        .provider-info { background: #e2e3e5; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .section-title { font-size: 18px; font-weight: bold; color: #495057; margin-bottom: 15px; }
        .provider-name { font-size: 16px; font-weight: bold; margin-bottom: 8px; }
        .provider-contact { margin-bottom: 8px; }
        .footer { background: #d4edda; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
        .footer-text { color: #155724; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">✅ Sniket</div>
        </div>
        
        <div class="content">
          <div class="title">Booking Confirmed!</div>
          <div class="greeting">Hi ${data.customerName},</div>
          <div class="paragraph">
            Great news! Your booking has been confirmed. Here are the details:
          </div>

          <div class="booking-details">
            <div class="detail-label">Booking ID: ${data.bookingId}</div>
            <div class="detail-label">Service: ${data.serviceName}</div>
            <div class="detail-label">Device: ${data.deviceInfo}</div>
            <div class="detail-label">Appointment: ${formattedDate}</div>
            <div class="detail-label">Location: ${data.serviceLocation}</div>
            <div class="detail-label">Amount: ₹${data.totalAmount}</div>
          </div>

          <div class="provider-info">
            <div class="section-title">Service Provider</div>
            <div class="provider-name">${data.providerName}</div>
            <div class="provider-contact">📞 ${data.providerPhone}</div>
          </div>

          <div class="paragraph">
            Your service provider will contact you shortly to confirm the appointment details.
            If you have any questions, please don't hesitate to reach out.
          </div>
        </div>

        <div class="footer">
          <div class="footer-text">
            Thank you for choosing Sniket! 🚀
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}; 