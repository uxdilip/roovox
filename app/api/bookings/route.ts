import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';
import { notificationService } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json();
    
    // Validate required fields
    const requiredFields = ['customer_id', 'provider_id', 'device_id', 'service_id', 'appointment_time', 'total_amount'];
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Validate part_quality
    const validPartQualities = ['oem', 'hq'];
    if (bookingData.part_quality && !validPartQualities.includes(bookingData.part_quality)) {
      return NextResponse.json({ error: 'Invalid part_quality value' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (bookingData.status && !validStatuses.includes(bookingData.status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    // Validate payment_status
    const validPaymentStatuses = ['pending', 'completed', 'refunded'];
    if (bookingData.payment_status && !validPaymentStatuses.includes(bookingData.payment_status)) {
      return NextResponse.json({ error: 'Invalid payment_status value' }, { status: 400 });
    }

    // Validate location_type
    const validLocationTypes = ['doorstep', 'provider_location'];
    if (bookingData.location_type && !validLocationTypes.includes(bookingData.location_type)) {
      return NextResponse.json({ error: 'Invalid location_type value' }, { status: 400 });
    }

    // Validate serviceMode
    const validServiceModes = ['doorstep', 'instore'];
    if (bookingData.serviceMode && !validServiceModes.includes(bookingData.serviceMode)) {
      return NextResponse.json({ error: 'Invalid serviceMode value' }, { status: 400 });
    }

    const booking = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.BOOKINGS,
      ID.unique(),
      {
        ...bookingData,
        status: bookingData.status || 'pending',
        payment_status: bookingData.payment_status || 'pending',
        rating: bookingData.rating || 0,
        review: bookingData.review || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    );

    // 🔔 NEW: Create in-app notifications using fresh system
    try {
      console.log('🔔 Creating notifications for new booking...');
      
      // Create notification for customer
      await notificationService.createNotification({
        type: 'booking',
        category: 'business',
        priority: 'high',
        title: 'New Booking Created',
        message: `Your booking has been created successfully`,
        userId: bookingData.customer_id,
        userType: 'customer',
        relatedId: booking.$id,
        relatedType: 'booking',
        metadata: {
          bookingId: booking.$id,
          providerId: bookingData.provider_id,
          deviceId: bookingData.device_id,
          serviceId: bookingData.service_id,
          totalAmount: bookingData.total_amount
        }
      });

      // Create notification for provider
      await notificationService.createNotification({
        type: 'booking',
        category: 'business',
        priority: 'high',
        title: 'New Booking Received',
        message: `You have received a new booking request`,
        userId: bookingData.provider_id,
        userType: 'provider',
        relatedId: booking.$id,
        relatedType: 'booking',
        metadata: {
          bookingId: booking.$id,
          customerId: bookingData.customer_id,
          deviceId: bookingData.device_id,
          serviceId: bookingData.service_id,
          totalAmount: bookingData.total_amount
        }
      });

      console.log('✅ Fresh notifications created successfully');
    } catch (error) {
      console.error('❌ Failed to create notifications:', error);
      // Don't fail the booking creation if notifications fail
    }

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      // List all bookings
      const bookings = await databases.listDocuments(DATABASE_ID, 'bookings');
      console.log('All bookings:', bookings.documents.map(b => ({ id: b.$id, total_amount: b.total_amount, status: b.status })));
      return NextResponse.json({ 
        success: true, 
        bookings: bookings.documents.map(b => ({ id: b.$id, total_amount: b.total_amount, status: b.status, payment_status: b.payment_status }))
      });
    }

    // Fetch specific booking
    const booking = await databases.getDocument(DATABASE_ID, 'bookings', id);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    // Optionally, map/normalize fields for frontend
    console.log('Booking structure:', Object.keys(booking));
    return NextResponse.json({ booking });
  } catch (e: any) {
    console.log('[DEBUG] Error fetching booking:', e.message);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('id');
    
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const updateData = await request.json();
    
    // Validate status if provided
    if (updateData.status) {
      const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(updateData.status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }
    }

    // Validate payment_status if provided
    if (updateData.payment_status) {
      const validPaymentStatuses = ['pending', 'completed', 'refunded'];
      if (!validPaymentStatuses.includes(updateData.payment_status)) {
        return NextResponse.json({ error: 'Invalid payment_status value' }, { status: 400 });
      }
    }

    // Validate rating if provided
    if (updateData.rating !== undefined) {
      if (typeof updateData.rating !== 'number' || updateData.rating < 0 || updateData.rating > 5) {
        return NextResponse.json({ error: 'Rating must be a number between 0 and 5' }, { status: 400 });
      }
    }

    const updatedBooking = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.BOOKINGS,
      bookingId,
      {
        ...updateData,
        updated_at: new Date().toISOString()
      }
    );

    // 🔔 NEW: Create notifications for status changes using fresh system
    try {
      if (updateData.status) {
        console.log('🔔 Creating status change notification for:', updateData.status);
        
        // Get device name from the booking data
        const deviceName = updatedBooking.device_name || 'device';
        
        // Create notification for customer
        await notificationService.createNotification({
          type: 'booking',
          category: 'business',
          priority: 'medium',
          title: 'Booking Status Updated',
          message: getStatusChangeMessage(updateData.status, deviceName),
          userId: updatedBooking.customer_id,
          userType: 'customer',
          relatedId: bookingId,
          relatedType: 'booking',
          metadata: {
            bookingId,
            status: updateData.status,
            deviceName,
            previousStatus: updatedBooking.status
          }
        });

        // Create notification for provider
        await notificationService.createNotification({
          type: 'booking',
          category: 'business',
          priority: 'medium',
          title: 'Booking Status Updated',
          message: getProviderStatusMessage(updateData.status, deviceName),
          userId: updatedBooking.provider_id,
          userType: 'provider',
          relatedId: bookingId,
          relatedType: 'booking',
          metadata: {
            bookingId,
            status: updateData.status,
            deviceName,
            previousStatus: updatedBooking.status
          }
        });

        console.log('✅ Status change notifications created successfully');
      }
    } catch (error) {
      console.error('Failed to create status change notifications:', error);
      // Don't fail the update if notifications fail
    }

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error: any) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🔔 NEW: Helper functions for notification messages
function getStatusChangeMessage(status: string, deviceName: string): string {
  switch (status) {
    case 'confirmed':
      return `Your ${deviceName} repair has been confirmed by the provider`;
    case 'in_progress':
      return `Your ${deviceName} repair has started`;
    case 'completed':
      return `Your ${deviceName} repair has been completed`;
    case 'cancelled':
      return `Your ${deviceName} repair has been cancelled`;
    case 'disputed':
      return `Your ${deviceName} repair has been disputed`;
    default:
      return `Your ${deviceName} repair status has been updated`;
  }
}

function getProviderStatusMessage(status: string, deviceName: string): string {
  switch (status) {
    case 'confirmed':
      return `Customer confirmed ${deviceName} repair booking`;
    case 'cancelled':
      return `Customer cancelled ${deviceName} repair booking`;
    case 'disputed':
      return `Customer disputed ${deviceName} repair booking`;
    default:
      return `${deviceName} repair status updated`;
  }
}