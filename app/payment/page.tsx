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
  const bookingId = searchParams.get("id");
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    async function fetchBooking() {
      if (!bookingId) return;
      try {
        const res = await fetch(`/api/bookings?id=${bookingId}`);
        const data = await res.json();
        if (data && data.booking && data.booking.total_amount) {
          setAmount(data.booking.total_amount);
          setBooking(data.booking);
        }
      } catch (e) {
        setAmount(null);
      }
    }
    fetchBooking();
  }, [bookingId]);

  const getButtonText = () => {
    if (!selected) return "Continue";
    if (selected === "online") return "Pay Online";
    if (selected === "cod") return "Pay After Service";
    return "Continue";
  };

  const handleContinue = async () => {
    if (!bookingId || !selected) {
      toast.error("Booking not found");
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
            booking_id: bookingId,
            amount: booking?.total_amount || 0
          }),
        });
        const orderData = await orderRes.json();
        if (!orderData.order) throw new Error("Failed to create payment order");
        // 2. Load Razorpay script
        await loadRazorpayScript();
        // 3. Launch Razorpay checkout
        const options = {
          key: orderData.order.key_id,
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: "Device Service Booking",
          description: `Booking for ${booking?.device_brand || ''} ${booking?.device_model || ''}`,
          order_id: orderData.order.id,
          handler: async function (response: any) {
            console.log('Payment success response:', response);
            console.log('Using booking ID for verification:', bookingId);
            // 4. Verify payment
            try {
              console.log('Starting payment verification...');
              const verifyRes = await fetch("/api/payments/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  booking_id: bookingId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              console.log('Verification response status:', verifyRes.status);
              const verifyData = await verifyRes.json();
              console.log('Payment verification response:', verifyData);
              if (verifyData.success) {
                toast.success("Payment successful!");
                router.push("/customer/dashboard");
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
            email: booking?.customer_email || "",
            contact: booking?.customer_phone || "",
          },
          theme: { color: "#6366f1" },
          modal: {
            ondismiss: function() {
              console.log('Payment modal dismissed');
              setLoading(false);
            }
          }
        };
        console.log('Razorpay options:', options);
        // @ts-ignore
        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (e: any) {
        toast.error(e.message || "Failed to process payment");
      } finally {
        setLoading(false);
      }
    } else {
      // COD: Call API to confirm COD
      try {
        const res = await fetch("/api/payments/cod-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ booking_id: bookingId }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Booking confirmed for Pay After Service!");
          router.push("/customer/dashboard");
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