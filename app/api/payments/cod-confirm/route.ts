import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { notificationService } from '@/lib/notifications';
import { updateOfferOnBookingComplete } from '@/lib/offer-services';

export async function POST(req: NextRequest) {
  try {
    const { session_key, booking_data } = await req.json();
    
    
    if (!session_key || !booking_data) {
      return NextResponse.json({ success: false, error: 'Missing session_key or booking_data' }, { status: 400 });
    }

      total_amount: booking_data.total_amount,
      customer_id: booking_data.customer_id,
      provider_id: booking_data.provider_id
    });

    // Create booking document for COD
    let booking;
    try {
      // Include ALL required fields from the Appwrite bookings collection schema
      const completeBookingData = {
        // Required fields
        customer_id: booking_data.customer_id,
        provider_id: booking_data.provider_id,
        device_id: booking_data.device_id || 'default_device',
        service_id: booking_data.service_id || 'default_service',
        status: 'pending', // required enum - COD bookings start as pending
        appointment_time: (() => {
          try {
              date: booking_data.date,
              time: booking_data.time
            });
            
            // Ensure we have valid date and time
            if (!booking_data.date || !booking_data.time) {
              console.error('Missing date or time:', { date: booking_data.date, time: booking_data.time });
              throw new Error('Missing date or time');
            }
            
            // Try to create a simple datetime string first
            const simpleDateTime = `${booking_data.date} ${booking_data.time}`;
            
            // Try to parse it
            const parsedDate = new Date(simpleDateTime);
            if (!isNaN(parsedDate.getTime())) {
              const isoString = parsedDate.toISOString();
              return isoString;
            }
            
            // If simple parsing fails, try manual parsing
            
            // Parse time like "10:00 AM" to 24-hour format
            const timeStr = booking_data.time;
            let [time, period] = timeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            
            const dateStr = booking_data.date + 'T' + 
              hours.toString().padStart(2, '0') + ':' + 
              minutes.toString().padStart(2, '0') + ':00';
            
            
            const finalDate = new Date(dateStr);
            if (isNaN(finalDate.getTime())) {
              throw new Error('Invalid date created: ' + dateStr);
            }
            
            const isoString = finalDate.toISOString();
            
            return isoString;
          } catch (error) {
            console.error('Error parsing appointment time:', error);
            // Fallback to default time
            const fallbackDate = new Date(booking_data.date + 'T09:00:00');
            return fallbackDate.toISOString();
          }
        })(), // required datetime
        total_amount: booking_data.total_amount,
        payment_status: 'pending', // required enum - COD payments are pending until service completion
        location_type: booking_data.location_type || 'provider_location', // required enum - use the mapped value
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        
        // ✅ FIXED: Store device_info for better device display
        ...(booking_data.device_info && { device_info: booking_data.device_info }),
        
        // Optional fields (if available)
        ...(booking_data.issue_description && { issue_description: booking_data.issue_description }),
        ...(booking_data.part_quality && { part_quality: booking_data.part_quality }),
        ...(booking_data.customer_address && { customer_address: booking_data.customer_address }),
        ...(booking_data.selected_issues && { selected_issues: booking_data.selected_issues }),
        ...(booking_data.warranty && { warranty: booking_data.warranty }),
        ...(booking_data.serviceMode && { serviceMode: booking_data.serviceMode }),
      };

      
      booking = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.BOOKINGS,
        'unique()',
        completeBookingData
      );
      
    } catch (error: any) {
      console.error('[COD-CONFIRM] Error creating booking:', error);
      return NextResponse.json({ success: false, error: 'Failed to create booking: ' + error.message }, { status: 500 });
    }

    // ✅ FIXED: Calculate commission for COD
    const commissionAmount = booking.total_amount * 0.10; // 10% commission
    const providerPayout = booking.total_amount * 0.90;   // 90% to provider

      total_amount: booking.total_amount,
      commission_amount: commissionAmount,
      provider_payout: providerPayout
    });

    // Create payment document with commission
    try {
      const payment = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PAYMENTS,
        'unique()',
        {
          booking_id: booking.$id,
          amount: booking.total_amount,
          status: 'pending',
          payment_method: 'COD',
          transaction_id: '',
          commission_amount: commissionAmount,    // ✅ FIXED: Commission calculated
          provider_payout: providerPayout,        // ✅ FIXED: Payout calculated
          is_commission_settled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      );
      
        payment_id: payment.$id,
        commission_amount: commissionAmount,
        provider_payout: providerPayout
      });
    } catch (error: any) {
      console.error('[COD-CONFIRM] Error creating payment document:', error);
      return NextResponse.json({ success: false, error: 'Failed to create payment record: ' + error.message }, { status: 500 });
    }

    // ✅ NEW: Update offer status when booking is completed
    if (booking_data.offerId) {
      try {
        const offerUpdateResult = await updateOfferOnBookingComplete(booking_data.offerId, booking.$id);
        
        if (offerUpdateResult.success) {
        } else {
          console.error('❌ [COD-CONFIRM] Failed to update offer status:', offerUpdateResult.error);
        }
      } catch (error) {
        console.error('❌ [COD-CONFIRM] Error updating offer status:', error);
        // Don't fail the booking if offer update fails
      }
    }

    // 🔔 NEW: Create in-app notifications using fresh system
    try {
      
      // Create notification for provider
      await notificationService.createNotification({
        type: 'booking',
        category: 'business',
        priority: 'high',
        title: 'New COD Booking Received',
        message: `You have received a new COD booking request`,
        userId: booking.provider_id,
        userType: 'provider',
        relatedId: booking.$id,
        relatedType: 'booking',
        metadata: {
          bookingId: booking.$id,
          customerId: booking.customer_id,
          deviceId: booking.device_id,
          serviceId: booking.service_id,
          totalAmount: booking.total_amount,
          paymentMethod: 'COD'
        }
      });

      // Create notification for customer
      await notificationService.createNotification({
        type: 'booking',
        category: 'business',
        priority: 'high',
        title: 'COD Booking Confirmed',
        message: `Your COD booking has been confirmed successfully`,
        userId: booking.customer_id,
        userType: 'customer',
        relatedId: booking.$id,
        relatedType: 'booking',
        metadata: {
          bookingId: booking.$id,
          providerId: booking.provider_id,
          deviceId: booking.device_id,
          serviceId: booking.service_id,
          totalAmount: booking.total_amount,
          paymentMethod: 'COD'
        }
      });

    } catch (error) {
      console.error('❌ Failed to create notifications:', error);
      // Don't fail the COD confirmation if notifications fail
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[COD-CONFIRM] Error:', e.message, e);
    return NextResponse.json({ success: false, error: e.message || 'Server error' }, { status: 500 });
  }
} 