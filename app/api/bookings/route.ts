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
    return NextResponse.json({ booking });
  } catch (e: any) {
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
      const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'pending_cod_collection'];
      if (!validStatuses.includes(updateData.status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }
    }

    // Special handling for COD orders when marking as completed
    if (updateData.status === 'completed') {
      // Get the current booking to check payment method
      const currentBooking = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.BOOKINGS,
        bookingId
      );
      
      // Check if this is a COD order by looking at payment records
      try {
        const paymentsResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.PAYMENTS,
          [Query.equal("booking_id", bookingId)]
        );
        
        let isCODOrder = false;
        let paymentRecord = null;
        if (paymentsResponse.documents.length > 0) {
          paymentRecord = paymentsResponse.documents[0];
          isCODOrder = paymentRecord.payment_method === "COD";
        } else {
          // Fallback: check booking's payment_status
          isCODOrder = currentBooking.payment_status === "pending";
        }
        
          isCODOrder, 
          bookingId, 
          paymentRecords: paymentsResponse.documents.length,
          location_type: currentBooking.location_type 
        });
        
        // If this is a COD order
        if (isCODOrder) {
          // ✅ NEW: Different handling for doorstep vs in-store COD orders
          if (currentBooking.location_type === 'provider_location') {
            // In-store COD: Mark as completed and create commission collection
            updateData.status = 'completed';
            updateData.payment_status = 'completed';
            
            // Create commission collection record for in-store COD
            try {
              // Calculate commission (10% of total amount)
              const commissionAmount = paymentRecord ? paymentRecord.commission_amount : (currentBooking.total_amount * 0.10);
              
                booking_id: bookingId,
                provider_id: currentBooking.provider_id,
                commission_amount: commissionAmount
              });
              
              // Create commission collection record directly
              const commissionCollection = await databases.createDocument(
                DATABASE_ID,
                'commission_collections',
                'unique()',
                {
                  booking_id: bookingId,
                  provider_id: currentBooking.provider_id,
                  commission_amount: commissionAmount,
                  collection_method: 'upi',
                  status: 'pending',
                  due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              );
              
              
              // Update payment record if it exists to mark commission tracking started
              if (paymentRecord) {
                try {
                  await databases.updateDocument(
                    DATABASE_ID,
                    COLLECTIONS.PAYMENTS,
                    paymentRecord.$id,
                    {
                      is_commission_settled: false,
                      updated_at: new Date().toISOString()
                    }
                  );
                } catch (paymentUpdateError) {
                  console.error('⚠️ Error updating payment record (non-fatal):', paymentUpdateError);
                }
              }
            } catch (commissionError) {
              console.error('❌ Error creating commission collection (non-fatal):', commissionError);
              // Don't fail the booking completion if commission creation fails
            }
          } else {
            // Doorstep COD: Set to pending_cod_collection (existing behavior)
            updateData.status = 'pending_cod_collection';
          }
        }
      } catch (error) {
        console.error("Error checking payment method for COD handling:", error);
        // Continue with original status if payment check fails
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
    case 'pending_cod_collection':
      return `Your ${deviceName} repair has been completed. Our team will collect the payment shortly.`;
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

// Export PATCH as an alias to PUT for compatibility
export const PATCH = PUT;