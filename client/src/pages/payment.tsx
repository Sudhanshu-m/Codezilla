import { useState } from "react";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CreditCard, Wallet, IndianRupee, ArrowLeft } from "lucide-react";

interface PaymentPageState {
  counselorName: string;
  counselorId: string;
  consultationFee: number;
  duration: string;
}

export default function Payment() {
  const [, setLocation] = useLocation();
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardData, setCardData] = useState({
    name: "",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
  });

  // Get consultation details from location state or use defaults
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const counselorName = params.get("counselorName") || "Dr. Priya Sharma";
  const consultationFee = 2999; // ₹2,999 consultation fee
  const duration = "60 minutes";

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (paymentMethod === "card" && (!cardData.name || !cardData.cardNumber || !cardData.expiryMonth || !cardData.expiryYear || !cardData.cvv)) {
      alert("Please fill in all card details");
      return;
    }

    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      // Redirect to success page with counselor details
      setLocation(`/payment-success?counselorName=${encodeURIComponent(counselorName)}`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => setLocation("/guidance")}
          className="flex items-center gap-2 text-primary hover:text-blue-700 mb-6"
          data-testid="button-back-to-guidance"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Counselors
        </button>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="md:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Counselor</p>
                  <p className="font-semibold">{counselorName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Duration</p>
                  <p className="font-semibold">{duration}</p>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600">Consultation Fee:</span>
                    <span className="font-semibold">₹{consultationFee.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-600">Taxes & Charges:</span>
                    <span className="font-semibold">₹{Math.round(consultationFee * 0.18).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
                    <span className="text-lg font-bold">Total Amount:</span>
                    <span className="text-xl font-bold text-primary">₹{Math.round(consultationFee * 1.18).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Choose Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="space-y-4">
                      {/* Credit/Debit Card */}
                      <div className="border rounded-lg p-4 cursor-pointer hover:bg-slate-50" onClick={() => setPaymentMethod("card")}>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="card" id="card" />
                          <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                            <CreditCard className="w-5 h-5" />
                            <span>Credit/Debit Card</span>
                          </Label>
                        </div>
                      </div>

                      {/* UPI */}
                      <div className="border rounded-lg p-4 cursor-pointer hover:bg-slate-50" onClick={() => setPaymentMethod("upi")}>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="upi" id="upi" />
                          <Label htmlFor="upi" className="flex items-center gap-2 cursor-pointer flex-1">
                            <Wallet className="w-5 h-5" />
                            <span>UPI</span>
                          </Label>
                        </div>
                      </div>

                      {/* Net Banking */}
                      <div className="border rounded-lg p-4 cursor-pointer hover:bg-slate-50" onClick={() => setPaymentMethod("netbanking")}>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="netbanking" id="netbanking" />
                          <Label htmlFor="netbanking" className="flex items-center gap-2 cursor-pointer flex-1">
                            <Wallet className="w-5 h-5" />
                            <span>Net Banking</span>
                          </Label>
                        </div>
                      </div>

                      {/* Mobile Wallet */}
                      <div className="border rounded-lg p-4 cursor-pointer hover:bg-slate-50" onClick={() => setPaymentMethod("wallet")}>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="wallet" id="wallet" />
                          <Label htmlFor="wallet" className="flex items-center gap-2 cursor-pointer flex-1">
                            <Wallet className="w-5 h-5" />
                            <span>Mobile Wallets (PayTM, PhonePe, Google Pay)</span>
                          </Label>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>

                  {/* Card Details Form */}
                  {paymentMethod === "card" && (
                    <div className="space-y-4 border-t pt-6">
                      <div>
                        <Label htmlFor="cardholder-name">Cardholder Name</Label>
                        <Input
                          id="cardholder-name"
                          placeholder="Enter your full name"
                          value={cardData.name}
                          onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                          data-testid="input-cardholder-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="card-number">Card Number</Label>
                        <Input
                          id="card-number"
                          placeholder="1234 5678 9012 3456"
                          value={cardData.cardNumber}
                          onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
                          maxLength={16}
                          data-testid="input-card-number"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="expiry-month">MM</Label>
                          <Input
                            id="expiry-month"
                            placeholder="MM"
                            value={cardData.expiryMonth}
                            onChange={(e) => setCardData({ ...cardData, expiryMonth: e.target.value })}
                            maxLength={2}
                            data-testid="input-expiry-month"
                          />
                        </div>
                        <div>
                          <Label htmlFor="expiry-year">YY</Label>
                          <Input
                            id="expiry-year"
                            placeholder="YY"
                            value={cardData.expiryYear}
                            onChange={(e) => setCardData({ ...cardData, expiryYear: e.target.value })}
                            maxLength={2}
                            data-testid="input-expiry-year"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            placeholder="123"
                            value={cardData.cvv}
                            onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                            maxLength={3}
                            data-testid="input-cvv"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "upi" && (
                    <div className="space-y-4 border-t pt-6">
                      <div>
                        <Label htmlFor="upi-id">UPI ID</Label>
                        <Input
                          id="upi-id"
                          placeholder="yourname@upi"
                          data-testid="input-upi-id"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === "netbanking" && (
                    <div className="space-y-4 border-t pt-6">
                      <Label>Select Your Bank</Label>
                      <select className="w-full px-3 py-2 border rounded-md" data-testid="select-bank">
                        <option value="">Choose a bank</option>
                        <option value="hdfc">HDFC Bank</option>
                        <option value="icici">ICICI Bank</option>
                        <option value="sbi">SBI</option>
                        <option value="axis">Axis Bank</option>
                        <option value="kotak">Kotak Mahindra</option>
                      </select>
                    </div>
                  )}

                  {paymentMethod === "wallet" && (
                    <div className="space-y-4 border-t pt-6">
                      <Label>Select Wallet</Label>
                      <select className="w-full px-3 py-2 border rounded-md" data-testid="select-wallet">
                        <option value="">Choose a wallet</option>
                        <option value="paytm">PayTM</option>
                        <option value="phonepe">PhonePe</option>
                        <option value="googlepay">Google Pay</option>
                      </select>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-blue-700 text-white py-6 text-lg font-semibold"
                    disabled={isProcessing}
                    data-testid="button-proceed-payment"
                  >
                    {isProcessing ? "Processing Payment..." : `Pay ₹${Math.round(consultationFee * 1.18).toLocaleString("en-IN")}`}
                  </Button>

                  <p className="text-xs text-slate-500 text-center">
                    This is a secure mock payment gateway for demonstration purposes.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
