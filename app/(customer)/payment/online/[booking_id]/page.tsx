"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

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

export default function OnlinePaymentPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.booking_id as string;
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [paying, setPaying] = useState(false);

  // Fetch booking details
  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/bookings?id=${bookingId}`);
        const data = await res.json();
        if (data && data.booking) setBooking(data.booking);
      } catch (e) {
        toast.error("Failed to fetch booking");
      }
    }
    if (bookingId) fetchBooking();
  }, [bookingId]);

  // Create Razorpay order
  useEffect(() => {
    async function createOrder() {
      if (!booking) return;
      try {
        const res = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: booking.total_amount, booking_id: booking.$id }),
        });
        const data = await res.json();
        if (data && data.order) setOrder(data.order);
        else toast.error("Failed to create payment order");
      } catch (e) {
        toast.error("Failed to create payment order");
      } finally {
        setLoading(false);
      }
    }
    if (booking) createOrder();
  }, [booking]);

  // Launch Razorpay checkout
  useEffect(() => {
    async function launchRazorpay() {
      if (!order || !booking) return;
      await loadRazorpayScript();
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Device Service Booking",
        description: `Booking for ${booking.device_id}`,
        order_id: order.id,
        handler: async function (response: any) {
          setPaying(true);
          // Verify payment
          try {
            const verifyRes = await fetch("/api/payments/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                booking_id: booking.$id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              toast.success("Payment successful!");
              router.push("/customer/my-bookings");
            } else {
              toast.error("Payment verification failed");
            }
          } catch (e) {
            toast.error("Payment verification failed");
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          email: booking.customer_email || "",
          contact: booking.customer_phone || "",
        },
        theme: { color: "#6366f1" },
      };
      // @ts-ignore
      if (typeof window !== 'undefined') {
        // @ts-ignore
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    }
    if (order && booking) launchRazorpay();
    // eslint-disable-next-line
  }, [order, booking]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white p-4">
      <Card className="w-full max-w-md shadow-lg rounded-2xl border-2 border-primary/10">
        <CardContent className="space-y-6">
          <h2 className="text-2xl font-bold text-center mb-2">Complete Your Payment</h2>
          {loading || !booking ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3 mx-auto" />
              <Skeleton className="h-6 w-1/2 mx-auto" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-gray-700">
                <span className="font-medium">Device</span>
                <span className="font-semibold">{booking.device_brand} {booking.device_model}</span>
              </div>
              <div className="flex items-center justify-between text-gray-700">
                <span className="font-medium">Service</span>
                <span className="font-semibold">{booking.service_name}</span>
              </div>
              <div className="flex items-center justify-between text-gray-700">
                <span className="font-medium">Total</span>
                <span className="font-bold text-primary text-lg">₹{booking.total_amount?.toLocaleString()}</span>
              </div>
              <Button className="w-full mt-4" size="lg" disabled={paying || loading} onClick={() => {}}>
                {paying ? "Processing..." : "Pay Now"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 