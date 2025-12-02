// nextjs-app/app/mutual/success/page.tsx

"use client";

import { CheckCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SubscriptionSuccessPage() {
    // Read the 'plan' parameter passed from the checkout page
    const searchParams = useSearchParams();
    const planName = searchParams.get('plan') || 'your new plan';
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="p-10 bg-white rounded-xl shadow-2xl max-w-lg w-full text-center border-t-8 border-green-500">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                
                <h1 className="text-3xl font-bold text-gray-800 mb-3">Subscription Confirmed!</h1>
                
                <p className="text-xl text-gray-600 mb-6">
                    Welcome to the **{planName}** plan! Your payment was successful and your account has been upgraded.
                </p>
                
                <p className="text-sm text-gray-500 mb-8">
                    You can now access all features of your membership. An email receipt will follow shortly.
                </p>

                <div className="space-y-4">
                    {/* Link to a user's main area */}
                    <Link href="/handyman/handyDashboard" 
                          className="block w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                    >
                        Go to Dashboard
                    </Link>
                    
                </div>
            </div>
        </div>
    );
}