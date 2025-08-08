import NotificationTester from '@/components/NotificationTester';

export default function TestNotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Notification System Test
          </h1>
          <p className="text-gray-600">
            Test the email notification system for your Sniket application
          </p>
        </div>
        
        <NotificationTester />
        
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Notification System Status</h2>
            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-700">✅ System is working correctly</span>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Available Notifications</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Booking Confirmation (Customer)</li>
                  <li>New Booking Request (Provider)</li>
                  <li>Service Started (Customer)</li>
                  <li>Service Completed (Customer)</li>
                  <li>Booking Cancelled (Customer)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Integration</h3>
                <p className="ml-4">
                  The notification system is fully integrated into your booking API. 
                  Emails are sent automatically when booking status changes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 