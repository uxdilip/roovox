import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Preview,
  Section,
  Hr,
} from '@react-email/components';

interface BookingCancelledEmailProps {
  customerName: string;
  bookingId: string;
  serviceName: string;
  deviceInfo: string;
  reason?: string;
}

export const BookingCancelledEmail = ({
  customerName,
  bookingId,
  serviceName,
  deviceInfo,
  reason,
}: BookingCancelledEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Booking Cancelled - Roovox</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>🔧 Roovox</Text>
          </Section>

          <Section style={content}>
            <Text style={title}>Booking Cancelled</Text>
            <Text style={greeting}>Hi {customerName},</Text>
            <Text style={paragraph}>
              Your booking has been cancelled. We're sorry for any inconvenience this may have caused.
            </Text>

            <Section style={bookingDetails}>
              <Text style={detailLabel}>Booking ID: {bookingId}</Text>
              <Text style={detailLabel}>Service: {serviceName}</Text>
              <Text style={detailLabel}>Device: {deviceInfo}</Text>
              {reason && <Text style={detailLabel}>Reason: {reason}</Text>}
            </Section>

            <Text style={paragraph}>
              If you have any questions about this cancellation or would like to book a new service, 
              please don't hesitate to contact our support team.
            </Text>

            <Text style={paragraph}>
              Thank you for considering Roovox for your service needs.
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
  color: '#374151',
  marginBottom: '8px',
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

export default BookingCancelledEmail; 