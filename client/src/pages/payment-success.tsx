import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home } from "lucide-react";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();

  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const counselorName = params.get("counselorName") || "Dr. Priya Sharma";
  const profileId = localStorage.getItem('currentProfileId');

  useEffect(() => {
    // Store the consultation booking in localStorage and Airtable
    if (profileId && counselorName) {
      const bookings = JSON.parse(localStorage.getItem('consultationBookings') || '[]');
      const newBooking = {
        id: Math.random().toString(36).substring(7),
        profileId,
        counselorName,
        amount: 3539,
        paymentStatus: "completed",
        bookedAt: new Date().toISOString(),
      };
      bookings.push(newBooking);
      localStorage.setItem('consultationBookings', JSON.stringify(bookings));
      console.log("✓ Consultation booking saved to localStorage:", newBooking);

      // Save to Airtable via API
      fetch('/api/consultation-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          counselorName,
          amount: 3539,
        }),
      })
        .then((res) => res.json())
        .then(() => console.log("✓ Consultation booking saved to Airtable"))
        .catch((error) => console.error("Failed to save to Airtable:", error));
    }
  }, [profileId, counselorName]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md border-2 border-green-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
          </div>
          <CardTitle className="text-2xl text-green-600">Payment Successful! ✓</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Counselor</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{counselorName}</p>
            </div>
            <div className="border-t border-green-200 dark:border-green-800 pt-3">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Consultation Booked For</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">60 Minutes</p>
            </div>
            <div className="border-t border-green-200 dark:border-green-800 pt-3">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Amount Paid</p>
              <p className="text-xl font-bold text-green-600">₹3,539</p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-semibold">Confirmation email has been sent</span> to your registered email address with consultation details and meeting link.
            </p>
          </div>

          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <p>✓ Consultation has been booked successfully</p>
            <p>✓ You will receive a confirmation SMS shortly</p>
            <p>✓ Meeting details will be shared 24 hours before the session</p>
          </div>

          <Button
            onClick={() => setLocation("/")}
            className="w-full bg-primary hover:bg-blue-700 text-white py-6 text-lg font-semibold flex items-center justify-center gap-2"
            data-testid="button-go-home"
          >
            <Home className="w-5 h-5" />
            Go to Homepage
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
