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
  Button,
} from '@react-email/components';

interface NewBookingNotificationEmailProps {
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
}

export const NewBookingNotificationEmail = ({
  providerName,
  bookingId,
  customerName,
  customerPhone,
  serviceName,
  appointmentTime,
  totalAmount,
  serviceLocation,
  deviceInfo,
  issueDescription,
}: NewBookingNotificationEmailProps) => {
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
      <Preview>New booking request - Sniket</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>Sniket</Text>
          </Section>

          <Section style={content}>
            <Text style={title}>New Booking Request!</Text>
            <Text style={greeting}>Hi {providerName},</Text>
            <Text style={paragraph}>
              You have received a new booking request. Please review the details below:
            </Text>

            <Section style={bookingDetails}>
              <Text style={detailLabel}>Booking ID: {bookingId}</Text>
              <Text style={detailLabel}>Service: {serviceName}</Text>
              <Text style={detailLabel}>Device: {deviceInfo}</Text>
              <Text style={detailLabel}>Appointment: {formattedDate}</Text>
              <Text style={detailLabel}>Amount: ₹{totalAmount}</Text>
            </Section>

            <Section style={customerInfo}>
              <Text style={sectionTitle}>Customer Information</Text>
              <Text style={customerNameStyle}>{customerName}</Text>
              <Text style={customerContact}>{customerPhone}</Text>
            </Section>

            <Section style={issueInfo}>
              <Text style={sectionTitle}>Issue Description</Text>
              <Text style={issueText}>{issueDescription}</Text>
            </Section>

            <Section style={actionSection}>
              <Text style={paragraph}>
                Please confirm this booking within 2 hours to avoid automatic cancellation.
              </Text>
              <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/provider/bookings/${bookingId}`}>
                View Booking Details
              </Button>
            </Section>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Thank you for being part of Sniket!
            </Text>
            <Text style={footerText}>
              Need help? Contact us at sniketofficial@gmail.com
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

const customerInfo = {
  backgroundColor: '#eff6ff',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
};

const issueInfo = {
  backgroundColor: '#fef3c7',
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

const customerNameStyle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1f2937',
  marginBottom: '8px',
} as const;

const customerContact = {
  fontSize: '14px',
  color: '#374151',
};

const issueText = {
  fontSize: '14px',
  color: '#374151',
  lineHeight: '20px',
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

export default NewBookingNotificationEmail; 