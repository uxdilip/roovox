import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { testType, customerEmail, providerEmail } = await request.json();

    if (!testType || !customerEmail || !providerEmail) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: testType, customerEmail, providerEmail'
      }, { status: 400 });
    }

    // Test email data
    const testEmailData = {
      bookingId: 'TEST-' + Date.now(),
      customerName: 'Test Customer',
      customerEmail: customerEmail,
      customerPhone: '+91 9876543210',
      providerName: 'Test Provider',
      providerEmail: providerEmail,
      providerPhone: '+91 9876543211',
      serviceName: 'Screen Replacement',
      appointmentTime: new Date().toISOString(),
      totalAmount: 2500,
      serviceLocation: 'Customer Location',
      deviceInfo: 'iPhone 13 Pro',
      issueDescription: 'Cracked screen needs replacement',
    };

    let result;

    switch (testType) {
      case 'booking_confirmation':
        result = await EmailService.sendBookingConfirmationToCustomer(testEmailData);
        break;
      case 'new_booking_notification':
        result = await EmailService.sendNewBookingNotificationToProvider(testEmailData);
        break;
      case 'service_started':
        result = await EmailService.sendServiceStartedNotification(testEmailData);
        break;
      case 'service_completed':
        result = await EmailService.sendServiceCompletedNotification(testEmailData);
        break;
      case 'booking_cancelled':
        result = await EmailService.sendBookingCancelledNotification(testEmailData, 'Testing cancellation');
        break;
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid test type'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `${testType} email sent successfully`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Email test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to send test email'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Email test endpoint is ready',
    availableTests: [
      'booking_confirmation',
      'new_booking_notification', 
      'service_started',
      'service_completed',
      'booking_cancelled'
    ]
  });
}
