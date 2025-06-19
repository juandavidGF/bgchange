"use client";

import { useState, useEffect } from 'react';

export function triggerCreditUpdate() {
  // This function would trigger a credit balance update
  // Implementation depends on your credit system
  console.log('Credit update triggered');
  
  // Dispatch a custom event that the CreditBalance component can listen to
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('creditUpdate'));
  }
}

interface CreditBalanceProps {
  initialCredits?: number;
}

export default function CreditBalance({ initialCredits = 0 }: CreditBalanceProps) {
  const [credits, setCredits] = useState(initialCredits);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleCreditUpdate = () => {
      // Fetch updated credit balance
      fetchCredits();
    };

    window.addEventListener('creditUpdate', handleCreditUpdate);
    
    // Initial fetch
    fetchCredits();

    return () => {
      window.removeEventListener('creditUpdate', handleCreditUpdate);
    };
  }, []);

  const fetchCredits = async () => {
    setIsLoading(true);
    try {
      // Replace with actual API call
      // const response = await fetch('/api/user/credits');
      // const data = await response.json();
      // setCredits(data.credits);
      
      // Mock implementation
      console.log('Fetching credits...');
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2 text-white">
      <span className="text-sm">Credits:</span>
      <span className={`font-bold ${isLoading ? 'animate-pulse' : ''}`}>
        {isLoading ? '...' : credits}
      </span>
      <span className="text-xs text-gray-400">💰</span>
    </div>
  );
}