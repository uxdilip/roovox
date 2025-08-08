import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Preview,
  Section,
  Hr,
  Button,
} from '@react-email/components';

interface ServiceCompletedEmailProps {
  customerName: string;
  bookingId: string;
  serviceName: string;
  deviceInfo: string;
}

export const ServiceCompletedEmail = ({
  customerName,
  bookingId,
  serviceName,
  deviceInfo,
}: ServiceCompletedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Service Completed - Sniket</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>🔧 Sniket</Text>
          </Section>

          <Section style={content}>
            <Text style={title}>Service Completed!</Text>
            <Text style={greeting}>Hi {customerName},</Text>
            <Text style={paragraph}>
              Great news! Your service has been completed successfully. 
              Please rate your experience and provide feedback to help us improve our services.
            </Text>

            <Section style={bookingDetails}>
              <Text style={detailLabel}>Booking ID: {bookingId}</Text>
              <Text style={detailLabel}>Service: {serviceName}</Text>
              <Text style={detailLabel}>Device: {deviceInfo}</Text>
            </Section>

            <Section style={actionSection}>
              <Text style={paragraph}>
                How was your experience with our service?
              </Text>
              <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/customer/bookings/${bookingId}`}>
                Rate Your Experience
              </Button>
            </Section>

            <Text style={paragraph}>
              Thank you for choosing Sniket! We hope to serve you again soon.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Thank you for choosing Sniket! 🚀
            </Text>
            <Text style={footerText}>
              Need help? Contact us at support@sniket.com
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

const actionSection = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
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

export default ServiceCompletedEmail; 