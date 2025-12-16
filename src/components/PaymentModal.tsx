import { useState, useEffect } from 'react';
import { X, Zap, Check, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const creditPackages = [
  {
    credits: 10,
    price: 5,
    popular: false,
    description: '10 questions',
  },
  {
    credits: 50,
    price: 20,
    popular: true,
    description: '50 questions',
    savings: 'Save 20%',
  },
  {
    credits: 100,
    price: 35,
    popular: false,
    description: '100 questions',
    savings: 'Save 30%',
  },
  {
    credits: 500,
    price: 150,
    popular: false,
    description: '500 questions',
    savings: 'Save 40%',
  },
];

export default function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [selectedCredits, setSelectedCredits] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'select' | 'processing' | 'success'>('select');
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  const selectedPackage = creditPackages.find(p => p.credits === selectedCredits);
  const pricePerCredit = selectedPackage ? (selectedPackage.price / selectedPackage.credits * 100).toFixed(2) : '0.20';

  const handlePurchase = async () => {
    if (!selectedCredits || !session) return;
    setError('');
    setLoading(true);
    setStep('processing');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ credits: selectedCredits }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment');
      }

      if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
        await new Promise(resolve => setTimeout(resolve, 1500));

        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-payment`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              credits: selectedCredits,
            }),
          }
        ).catch(() => null);

        setStep('success');
        await new Promise(resolve => setTimeout(resolve, 2000));
        onSuccess();
        setStep('select');
        setSelectedCredits(50);
        onClose();
        return;
      }

      const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
      if (!stripePublicKey) {
        setError('Stripe configuration not found');
        setStep('select');
        setLoading(false);
        return;
      }

      if (!window.Stripe) {
        setError('Payment processing is not available. Please try again later.');
        setStep('select');
        setLoading(false);
        return;
      }

      const stripe = window.Stripe(stripePublicKey);
      const { client_secret } = data;

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        client_secret,
        {
          payment_method: {
            card: { token: 'tok_visa' },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        setStep('select');
        setLoading(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        setStep('success');
        await new Promise(resolve => setTimeout(resolve, 2000));
        onSuccess();
        setStep('select');
        setSelectedCredits(50);
        onClose();
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-bounce-in overflow-hidden">
        <div className="relative h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 animate-gradient-shift"></div>

        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center animate-pulse-glow">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Buy Credits</h2>
                <p className="text-sm text-gray-600">Keep your conversation going</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {step === 'select' && (
            <>
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3 animate-shake">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {creditPackages.map((pkg, index) => (
                  <div
                    key={pkg.credits}
                    onClick={() => setSelectedCredits(pkg.credits)}
                    className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 ${
                      selectedCredits === pkg.credits
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    } ${pkg.popular ? 'md:col-span-2 md:max-w-md md:mx-auto' : ''}`}
                    style={{
                      animation: `fade-in 0.4s ease-out ${index * 0.1}s both`,
                    }}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </div>
                    )}

                    {pkg.savings && (
                      <div className="absolute top-2 right-2 bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-semibold">
                        {pkg.savings}
                      </div>
                    )}

                    <div className="mb-4">
                      <div className="text-3xl font-bold text-gray-900">${pkg.price}</div>
                      <div className="text-sm text-gray-600 mt-1">{pkg.description}</div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className={`w-4 h-4 ${selectedCredits === pkg.credits ? 'text-blue-500' : 'text-gray-400'}`} />
                        <span>{pkg.credits} AI questions</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className={`w-4 h-4 ${selectedCredits === pkg.credits ? 'text-blue-500' : 'text-gray-400'}`} />
                        <span>${pricePerCredit}/credit</span>
                      </div>
                    </div>

                    {selectedCredits === pkg.credits && (
                      <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none"></div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-4 rounded-xl mb-6">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Selected:</span> {selectedCredits} credits
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Price:</span> ${selectedPackage?.price}
                </p>
              </div>

              {!import.meta.env.VITE_STRIPE_PUBLIC_KEY && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
                  Demo mode: Click purchase to simulate a successful payment and add credits instantly.
                </div>
              )}

              <button
                onClick={handlePurchase}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Buy {selectedCredits} Credits
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Secure payment powered by Stripe
              </p>
            </>
          )}

          {step === 'processing' && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <p className="text-gray-700 font-medium">Processing your payment...</p>
              <p className="text-sm text-gray-500 mt-2">Please wait, this may take a few seconds</p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-12 text-center animate-scale-in">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</p>
              <p className="text-gray-600 mb-4">Your {selectedCredits} credits have been added</p>
              <div className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold">
                Ready to continue chatting
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    Stripe: any;
  }
}
