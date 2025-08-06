# Roovox Notification System

This document describes the email notification system implemented for the Roovox project using Resend.

## Overview

The notification system automatically sends emails to customers and providers at key points in the booking lifecycle. It's designed to be non-blocking and fault-tolerant, ensuring that booking operations continue even if email sending fails.

## Architecture

### Components

1. **Email Templates** (`components/emails/`)
   - `BookingConfirmationEmail.tsx` - Customer booking confirmation
   - `NewBookingNotificationEmail.tsx` - Provider new booking notification

2. **Notification Service** (`lib/notification-service.ts`)
   - Central service for sending all types of notifications
   - Handles email rendering and sending via Resend

3. **Helper Functions** (`lib/notification-helpers.ts`)
   - Functions to fetch user data from Appwrite
   - Build notification data objects

4. **API Integration** (`app/api/bookings/route.ts`)
   - Automatic notification triggers on booking lifecycle events

## Setup Instructions

### 1. Resend Account Setup

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add your domain or use the sandbox domain for testing

### 2. Environment Variables

Add these to your `.env.local` file:

```env
RESEND_API_KEY=your_resend_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Domain Verification

For production, you'll need to verify your domain with Resend. For testing, you can use the sandbox domain.

## Notification Types

### Customer Notifications

1. **Booking Confirmation** (`confirmed`)
   - Sent when booking status changes to confirmed
   - Includes booking details, provider info, and appointment time

2. **Service Started** (`in_progress`)
   - Sent when service begins
   - Notifies customer that technician has started work

3. **Service Completed** (`completed`)
   - Sent when service is finished
   - Requests rating and feedback

4. **Booking Cancelled** (`cancelled`)
   - Sent when booking is cancelled
   - Includes cancellation reason if provided

### Provider Notifications

1. **New Booking Request** (on booking creation)
   - Sent immediately when new booking is created
   - Includes customer details, service requirements, and booking info

## Testing

### Test Page

Visit `/test-notifications` to test the notification system:

1. Enter your email address (use `delivered@resend.dev` for testing)
2. Select notification type
3. Click "Send Test Notification"
4. Check your email inbox

### API Testing

You can also test via API:

```bash
curl -X POST http://localhost:3000/api/test-notifications \
  -H "Content-Type: application/json" \
  -d '{"email": "delivered@resend.dev", "type": "booking-confirmation"}'
```

## Integration Points

### Booking API (`/api/bookings`)

The notification system is integrated into the booking API at these points:

1. **POST** (Create Booking)
   - Sends new booking notification to provider
   - Sends confirmation to customer if status is 'confirmed'

2. **PUT** (Update Booking)
   - Sends appropriate notifications based on status changes:
     - `confirmed` → Booking confirmation email
     - `in_progress` → Service started notification
     - `completed` → Service completed notification
     - `cancelled` → Cancellation notification

### Error Handling

- Notifications are sent asynchronously and don't block booking operations
- Failed notifications are logged but don't cause API failures
- All notification errors are caught and logged for debugging

## Email Templates

### Styling

All email templates use:
- Responsive design
- Professional styling with Roovox branding
- Clear call-to-action buttons
- Mobile-friendly layout

### Customization

To customize email templates:
1. Edit the React components in `components/emails/`
2. Update styles and content as needed
3. Test with the notification tester

## Production Considerations

### Rate Limiting

Resend has rate limits:
- Free tier: 3,000 emails/month
- Paid tiers: Higher limits available

### Monitoring

Monitor email delivery:
- Check Resend dashboard for delivery statistics
- Review server logs for notification errors
- Set up alerts for failed notifications

### Scaling

For high-volume applications:
- Consider using a queue system (Redis, Bull)
- Implement retry logic for failed emails
- Add email templates for different languages

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check RESEND_API_KEY is set correctly
   - Verify domain is verified with Resend
   - Check server logs for error messages

2. **Template rendering issues**
   - Ensure @react-email/components is installed
   - Check template syntax and props

3. **Missing user data**
   - Verify Appwrite collections exist
   - Check user/provider data structure
   - Review notification helper functions

### Debug Mode

Enable debug logging by checking server console for:
- Notification data building
- Email sending attempts
- Success/failure messages

## Future Enhancements

### Phase 2 Features
- SMS notifications
- Push notifications
- In-app notifications
- Email preferences management

### Phase 3 Features
- Multi-language support
- Advanced email templates
- Notification analytics
- A/B testing for templates

## Support

For issues with the notification system:
1. Check the troubleshooting section
2. Review server logs
3. Test with the notification tester
4. Contact the development team 