"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CreditCard, IndianRupee } from "lucide-react";

const PAYMENT_OPTIONS = [
  {
    value: "online",
    title: "Pay Online",
    label: "Pay securely with UPI, cards, or netbanking",
    icon: <CreditCard className="w-8 h-8 text-primary" />,
  },
  {
    value: "cod",
    title: "Pay after service",
    label: "Pay with cash after service",
    icon: <IndianRupee className="w-8 h-8 text-green-600" />,
  },
];

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) return resolve(true);
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaymentOptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);

  useEffect(() => {
    // Clean up old session data (older than 1 hour)
    const cleanupOldSessions = () => {
      if (typeof window === 'undefined') return; // Check for window object
      
      const now = Date.now();
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('pending_booking_')) {
          const timestamp = parseInt(key.replace('pending_booking_', ''));
          if (now - timestamp > oneHour) {
            sessionStorage.removeItem(key);
          }
        }
      }
    };

    cleanupOldSessions();

    // Load booking data from sessionStorage - look for the key used by booking page
    if (typeof window !== 'undefined') {
      try {
        // First try to get data from the key used by the new offer-based booking flow
        let storedData = sessionStorage.getItem('bookingData');
        
        if (storedData) {
          const data = JSON.parse(storedData);
          setBookingData(data);
          // Use the price from offer data if available
          setAmount(data.price || data.total_amount || 0);
          console.log('✅ Booking data loaded from sessionStorage:', data);
        } else {
          // Fallback: try to get from session key if provided
          const sessionKey = searchParams.get("session");
          if (sessionKey) {
            storedData = sessionStorage.getItem(sessionKey);
            if (storedData) {
              const data = JSON.parse(storedData);
              setBookingData(data);
              setAmount(data.total_amount);
              console.log('✅ Booking data loaded from session key:', data);
            } else {
              throw new Error('No booking data found in session');
            }
          } else {
            throw new Error('No booking data found');
          }
        }
      } catch (error) {
        console.error('Error loading booking data:', error);
        toast.error("Booking data not found. Please try booking again.");
        router.push('/book');
      }
    }

    // Cleanup function to remove session data if user navigates away
    return () => {
      // Only remove if payment wasn't completed (this will be handled in success handlers)
    };
  }, [router, searchParams]);

  const getButtonText = () => {
    if (!selected) return "Continue";
    if (selected === "online") return "Pay Online";
    if (selected === "cod") return "Pay After Service";
    return "Continue";
  };

  const handleContinue = async () => {
    if (!selected || !bookingData) {
      toast.error("Booking data not found");
      return;
    }
    setLoading(true);
    if (selected === "online") {
      // Razorpay flow
      try {
        // 1. Create Razorpay order
        const orderRes = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            session_key: 'bookingData', // Use the key we stored the data with
            amount: amount || bookingData.price || 0
          }),
        });
        const orderData = await orderRes.json();
        console.log('Order data received:', orderData);
        if (!orderData.success) {
          throw new Error(orderData.error || "Failed to create payment order");
        }
        if (!orderData.order) {
          throw new Error("Failed to create payment order - no order data received");
        }
        if (!orderData.order.key_id) {
          throw new Error("Payment configuration error - missing authentication key");
        }
        // 2. Load Razorpay script
        await loadRazorpayScript();
        // 3. Launch Razorpay checkout
        const options = {
          key: orderData.order.key_id,
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: "Device Service Booking",
          description: `Booking for ${bookingData.selectedDevice?.brand || ''} ${bookingData.selectedDevice?.model || ''}`,
          order_id: orderData.order.id,
          handler: async function (response: any) {
            setLoading(true);
            // 4. Verify payment
            try {
              const verifyRes = await fetch("/api/payments/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  session_key: 'bookingData', // Use the key we stored the data with
                  booking_data: bookingData, // Send the complete booking data
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                // Clean up session data
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem('bookingData');
                }
                toast.success("Payment successful!");
                router.push("/customer/my-bookings");
              } else {
                console.error('Payment verification failed:', verifyData.error);
                toast.error("Payment verification failed: " + (verifyData.error || 'Unknown error'));
              }
            } catch (e: any) {
              console.error('Payment verification error:', e);
              toast.error("Payment verification failed: " + e.message);
            }
          },
          prefill: {
            email: bookingData.customer_email || "",
            contact: bookingData.customer_phone || "",
          },
          theme: { color: "#6366f1" },
          modal: {
            ondismiss: function() {
              setLoading(false);
            }
          }
        };
        // @ts-ignore
        if (typeof window !== 'undefined') {
          // @ts-ignore
          const rzp = new window.Razorpay(options);
          rzp.open();
        }
      } catch (e: any) {
        toast.error(e.message || "Failed to process payment");
      } finally {
        setLoading(false);
      }
    } else {
      // COD: Call API to confirm COD
      try {
        console.log('🔍 [PAYMENT] Sending COD data to API:', {
          session_key: 'bookingData',
          booking_data: bookingData
        });
        
        // Log the specific fields that might cause issues
        console.log('🔍 [PAYMENT] Critical fields check:', {
          customer_id: bookingData.customer_id,
          provider_id: bookingData.provider_id,
          device_id: bookingData.device_id,
          service_id: bookingData.service_id,
          date: bookingData.date,
          time: bookingData.time,
          location_type: bookingData.location_type,
          total_amount: bookingData.total_amount
        });
        
        const res = await fetch("/api/payments/cod-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            session_key: 'bookingData', // Use the key we stored the data with
            booking_data: bookingData // Send the complete booking data
          }),
        });
        const data = await res.json();
        if (data.success) {
          // Clean up session data
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('bookingData');
          }
          toast.success("Booking confirmed for Pay After Service!");
          router.push("/customer/my-bookings");
        } else {
          toast.error(data.error || "Failed to confirm booking");
        }
      } catch (e) {
        toast.error("Failed to confirm booking");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold mb-1">Choose Your Payment Method</h1>
          <div className="text-lg font-semibold text-gray-700">Total Payable</div>
          <div className="text-3xl font-bold text-primary mb-2">₹{amount !== null ? amount.toLocaleString() : "..."}</div>
        </div>
        <div className="space-y-6">
          {PAYMENT_OPTIONS.map((opt) => (
            <Card
              key={opt.value}
              className={`flex items-center gap-4 p-5 cursor-pointer border-2 transition-all rounded-xl shadow-sm ${selected === opt.value ? "border-primary bg-primary/5" : "border-gray-200 bg-white hover:border-primary/50"}`}
              onClick={() => setSelected(opt.value)}
            >
              <div className="flex-shrink-0">{opt.icon}</div>
              <div className="flex flex-col">
                <span className="text-lg font-bold mb-1">{opt.title}</span>
                <span className="text-gray-600 text-sm">{opt.label}</span>
              </div>
            </Card>
          ))}
        </div>
        <Button
          className="w-full mt-8 text-lg py-6 rounded-xl"
          size="lg"
          onClick={handleContinue}
          disabled={loading || !selected || amount === null}
        >
          {loading ? "Processing..." : getButtonText()}
        </Button>
      </div>
    </div>
  );
} 