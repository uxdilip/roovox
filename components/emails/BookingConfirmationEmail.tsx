import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Link,
  Preview,
  Section,
  Hr,
} from '@react-email/components';

interface BookingConfirmationEmailProps {
  customerName: string;
  bookingId: string;
  serviceName: string;
  appointmentTime: string;
  totalAmount: number;
  providerName: string;
  providerPhone: string;
  serviceLocation: string;
  deviceInfo: string;
}

export const BookingConfirmationEmail = ({
  customerName,
  bookingId,
  serviceName,
  appointmentTime,
  totalAmount,
  providerName,
  providerPhone,
  serviceLocation,
  deviceInfo,
}: BookingConfirmationEmailProps) => {
  const formattedDate = new Date(appointmentTime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Html>
      <Head />
      <Preview>Your booking has been confirmed - Roovox</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>🔧 Roovox</Text>
          </Section>

          <Section style={content}>
            <Text style={title}>Booking Confirmed!</Text>
            <Text style={greeting}>Hi {customerName},</Text>
            <Text style={paragraph}>
              Great news! Your booking has been confirmed. Here are the details:
            </Text>

            <Section style={bookingDetails}>
              <Text style={detailLabel}>Booking ID: {bookingId}</Text>
              <Text style={detailLabel}>Service: {serviceName}</Text>
              <Text style={detailLabel}>Device: {deviceInfo}</Text>
              <Text style={detailLabel}>Appointment: {formattedDate}</Text>
              <Text style={detailLabel}>Location: {serviceLocation}</Text>
              <Text style={detailLabel}>Amount: ₹{totalAmount}</Text>
            </Section>

            <Section style={providerInfo}>
              <Text style={sectionTitle}>Your Service Provider</Text>
              <Text style={providerNameStyle}>{providerName}</Text>
              <Text style={providerContact}>📞 {providerPhone}</Text>
            </Section>

            <Text style={paragraph}>
              Your technician will arrive at the scheduled time. Please ensure someone is available at the location.
            </Text>

            <Text style={paragraph}>
              If you need to make any changes, please contact us immediately.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Thank you for choosing Roovox! 🚀
            </Text>
            <Text style={footerText}>
              Need help? Contact us at support@roovox.com
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const header = {
  textAlign: 'center' as const,
  padding: '20px 0',
};

const logo = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1f2937',
};

const content = {
  padding: '0 48px',
};

const title = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1f2937',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const greeting = {
  fontSize: '16px',
  color: '#374151',
  marginBottom: '16px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#374151',
  marginBottom: '16px',
};

const bookingDetails = {
  backgroundColor: '#f9fafb',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
};

const detailLabel = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#6b7280',
  padding: '8px 0',
  marginBottom: '8px',
};

const providerInfo = {
  backgroundColor: '#eff6ff',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
};

const sectionTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1e40af',
  marginBottom: '12px',
};

const providerNameStyle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1f2937',
  marginBottom: '8px',
};

const providerContact = {
  fontSize: '14px',
  color: '#374151',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
};

const footer = {
  textAlign: 'center' as const,
  padding: '20px 48px',
};

const footerText = {
  fontSize: '14px',
  color: '#6b7280',
  marginBottom: '8px',
};

export default BookingConfirmationEmail; 