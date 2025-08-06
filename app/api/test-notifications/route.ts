import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notification-service';

export async function POST(request: NextRequest) {
  try {
    const { email, type } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const testData = {
      bookingId: 'TEST-123',
      customerName: 'John Doe',
      customerEmail: email,
      customerPhone: '+91 9876543210',
      providerName: 'TechFix Pro',
      providerEmail: email, // Use the same email for testing
      providerPhone: '+91 9876543211',
      serviceName: 'Screen Replacement',
      appointmentTime: new Date().toISOString(),
      totalAmount: 2500,
      serviceLocation: '123 Main St, Mumbai, Maharashtra',
      deviceInfo: 'iPhone 12',
      issueDescription: 'Cracked screen needs replacement',
    };

    let result;
    switch (type) {
      case 'booking-confirmation':
        result = await NotificationService.sendBookingConfirmationToCustomer(testData);
        break;
      case 'new-booking':
        result = await NotificationService.sendNewBookingNotificationToProvider(testData);
        break;
      case 'service-started':
        result = await NotificationService.sendServiceStartedNotification(testData);
        break;
      case 'service-completed':
        result = await NotificationService.sendServiceCompletedNotification(testData);
        break;
      case 'booking-cancelled':
        result = await NotificationService.sendBookingCancelledNotification(testData, 'Customer requested cancellation');
        break;
      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `${type} notification sent successfully`,
      result 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Failed to send test notification'
    }, { status: 500 });
  }
} 