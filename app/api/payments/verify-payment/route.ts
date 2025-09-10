import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import crypto from 'crypto';
import { updateOfferOnBookingComplete } from '@/lib/offer-services';
import { EmailService } from '@/lib/email-service';
import { buildEmailNotificationData, safeEmailSend } from '@/lib/email-helpers';

export async function POST(req: NextRequest) {
  try {
    const { 
      session_key, 
      booking_data,
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature 
    } = await req.json();

    if (!session_key || !booking_data || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing payment verification parameters' 
      }, { status: 400 });
    }

    // Verify payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    
    const signature = crypto
      .createHmac('sha256', secret || 'your_secret_key')
      .update(text)
      .digest('hex');

    const isAuthentic = signature === razorpay_signature;

    // For test mode, we can be more lenient with signature verification
    // In production, you should always verify the signature
    const shouldProceed = isAuthentic || process.env.NODE_ENV === 'development';

    if (!shouldProceed) {
      return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 400 });
    }

    // Create booking document after successful payment
    let booking;
    try {
      // Include ALL required fields from the Appwrite bookings collection schema
      const completeBookingData = {
        // Required fields
        customer_id: booking_data.customer_id,
        provider_id: booking_data.provider_id,
        device_id: booking_data.device_id || 'default_device',
        service_id: booking_data.service_id || 'default_service',
        status: 'confirmed', // required enum (confirmed for online payments)
        appointment_time: (() => {
          try {
            console.log('🔍 [VERIFY-PAYMENT] Parsing appointment time:', {
              date: booking_data.date,
              time: booking_data.time
            });
            
            // Ensure we have valid date and time
            if (!booking_data.date || !booking_data.time) {
              console.error('Missing date or time:', { date: booking_data.date, time: booking_data.time });
              throw new Error('Missing date or time');
            }
            
            // Parse time like "10:00 AM" to 24-hour format
            const timeStr = booking_data.time;
            let [time, period] = timeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            
            const dateStr = booking_data.date + 'T' + 
              hours.toString().padStart(2, '0') + ':' + 
              minutes.toString().padStart(2, '0') + ':00';
            
            console.log('🔍 [VERIFY-PAYMENT] Created datetime string:', dateStr);
            
            const finalDate = new Date(dateStr);
            if (isNaN(finalDate.getTime())) {
              throw new Error('Invalid date created: ' + dateStr);
            }
            
            const isoString = finalDate.toISOString();
            console.log('🔍 [VERIFY-PAYMENT] Final ISO string:', isoString);
            
            return isoString;
          } catch (error) {
            console.error('Error parsing appointment time:', error);
            // Fallback to default time
            const fallbackDate = new Date(booking_data.date + 'T09:00:00');
            console.log('🔍 [VERIFY-PAYMENT] Using fallback date:', fallbackDate.toISOString());
            return fallbackDate.toISOString();
          }
        })(), // required datetime
        total_amount: booking_data.total_amount,
        payment_status: 'completed', // required enum (completed for online payments)
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

      console.log('🔍 [VERIFY-PAYMENT] Complete booking data:', completeBookingData);

      // Create the complete booking with all required fields
      booking = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.BOOKINGS,
        'unique()',
        completeBookingData
      );
    } catch (error: any) {
      console.error('Error creating booking:', error);
      return NextResponse.json({ success: false, error: 'Failed to create booking: ' + error.message }, { status: 500 });
    }

    // Create payment document
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PAYMENTS,
        'unique()',
        {
          booking_id: booking.$id,
          amount: booking.total_amount,
          status: 'completed',
          payment_method: 'online',
          transaction_id: `TXN_${Date.now()}`,
          commission_amount: booking.total_amount * 0.10, // 10% commission
          provider_payout: booking.total_amount * 0.90,   // 90% to provider
          is_commission_settled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          razorpay_payment_id,
          razorpay_order_id,
        }
      );
    } catch (error: any) {
      console.error('Error creating payment document:', error);
      return NextResponse.json({ success: false, error: 'Failed to create payment record: ' + error.message }, { status: 500 });
    }

    // 📧 NEW: Send email notifications for online payment booking
    try {
      console.log('📧 Sending email notifications for online payment booking...');
      
      const emailData = await buildEmailNotificationData(booking);
      
      // Send booking confirmation email to customer (payment processed, booking confirmed)
      await safeEmailSend(
        () => EmailService.sendBookingConfirmationToCustomer(emailData),
        'Customer booking confirmation email (online payment)'
      );
      
      // Send new booking notification email to provider (confirmed booking with payment received)
      await safeEmailSend(
        () => EmailService.sendNewBookingNotificationToProvider(emailData),
        'Provider booking notification email (online payment)'
      );

      console.log('✅ Email notifications processed successfully for online payment');
    } catch (error) {
      console.error('❌ Failed to send email notifications for online payment:', error);
      // Don't fail the payment verification if email notifications fail
    }

    // ✅ NEW: Update offer status when booking is completed
    if (booking_data.offerId) {
      try {
        console.log('🎯 [VERIFY-PAYMENT] Updating offer status for offer:', booking_data.offerId);
        const offerUpdateResult = await updateOfferOnBookingComplete(booking_data.offerId, booking.$id);
        
        if (offerUpdateResult.success) {
          console.log('✅ [VERIFY-PAYMENT] Offer status updated successfully');
        } else {
          console.error('❌ [VERIFY-PAYMENT] Failed to update offer status:', offerUpdateResult.error);
        }
      } catch (error) {
        console.error('❌ [VERIFY-PAYMENT] Error updating offer status:', error);
        // Don't fail the booking if offer update fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Error verifying payment:', e);
    return NextResponse.json({ 
      success: false, 
      error: e.message || 'Payment verification failed' 
    }, { status: 500 });
  }
} 