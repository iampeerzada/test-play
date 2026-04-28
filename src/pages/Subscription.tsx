import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { buildApiUrl } from '../utils/api';
import { Check } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function Subscription() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPlans();
    
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, [user]);

  const fetchPlans = async () => {
    try {
      const qs = user?.resellerId ? `?resellerId=${user.resellerId}` : '';
      const res = await fetch(buildApiUrl(`/api/plans${qs}`));
      const data = await res.json();
      if (data.success) {
        setPlans(data.plans || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handlePurchase = async (plan: any) => {
    if (!user) return;
    try {
      const orderRes = await fetch(buildApiUrl('/api/razorpay/order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, planId: plan.id })
      });
      const orderData = await orderRes.json();
      
      if (!orderData.success) {
        alert('Failed to initialize payment.');
        return;
      }
      
      const options = {
        key: 'rzp_live_RmMPzyo61J8piH',
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "iFastX IPTV",
        description: `Upgrade to ${plan.name}`,
        order_id: orderData.order.id, // This is the order ID generated in backend
        handler: async function (response: any) {
          // Verify payment on backend
          const verifyRes = await fetch(buildApiUrl('/api/razorpay/verify'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user.id,
              planId: plan.id
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
             login(verifyData.user); // update local user auth state
             alert('Payment successful!');
             navigate('/');
          } else {
             alert('Payment verification failed.');
          }
        },
        prefill: {
          name: user.name,
          contact: user.phone
        },
        theme: {
          color: "#dc2626"
        }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert('Payment Failed: ' + response.error.description);
      });
      rzp.open();
      
    } catch (err) {
      console.error(err);
      alert('Network error. Try again.');
    }
  };

  if (loading) {
     return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading plans...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0f1014] text-white py-12 px-4 relative">
       <div className="max-w-6xl mx-auto flex flex-col items-center">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-gray-400 mb-12 text-center">Unlock unlimited movies and live TV with our premium subscription plans.</p>
          
          <div className="flex flex-wrap items-center justify-center gap-8 w-full">
            {plans.map(p => (
               <div key={p.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-sm w-full flex flex-col items-center">
                 <h2 className="text-2xl font-bold mb-2">{p.name}</h2>
                 <div className="text-4xl font-bold mb-6">₹{p.price}</div>
                 <ul className="space-y-3 mb-8 w-full text-gray-300">
                    <li className="flex items-center gap-2"><Check className="w-5 h-5 text-red-500" /> {p.durationDays} Days Access</li>
                    <li className="flex items-center gap-2"><Check className="w-5 h-5 text-red-500" /> HD & 4K Quality</li>
                    <li className="flex items-center gap-2"><Check className="w-5 h-5 text-red-500" /> Watch on any device</li>
                 </ul>
                 <button onClick={() => handlePurchase(p)} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-full transition shadow-lg">
                    Subscribe Now
                 </button>
               </div>
            ))}
            {plans.length === 0 && (
               <div className="text-gray-400">No plans currently available. Please check back later.</div>
            )}
          </div>
       </div>
    </div>
  );
}
