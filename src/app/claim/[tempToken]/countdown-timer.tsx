'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  expiresAt: string;
}

export function CountdownTimer({ expiresAt }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        return '00:00:00';
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!timeLeft) return null;

  return (
    <div className="text-sm text-amber-600">
      <span className="hidden sm:inline">This deck expires in </span>
      <span className="font-mono font-semibold">{timeLeft}</span>
      <span className="hidden md:inline"> — Create your free account to save it</span>
    </div>
  );
}
