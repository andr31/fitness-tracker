'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Theme } from '@/lib/emojis';

interface CountdownTimerProps {
  theme?: Theme;
}

export default function CountdownTimer({ theme = 'cartoon' }: CountdownTimerProps) {
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });
  const [editingEndDate, setEditingEndDate] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const [mounted, setMounted] = useState(false);

  const fetchEndDate = async () => {
    try {
      const response = await fetch('/api/competition');
      if (response.ok) {
        const data = await response.json();
        // Parse the UTC date and use it directly (JS Date handles timezone conversion)
        setEndDate(new Date(data.endDate));
      } else {
        // Clear competition date if not found (e.g., new session)
        setEndDate(null);
      }
    } catch (error) {
      console.error('Error fetching competition end date:', error);
      setEndDate(null);
    }
  };

  const updateEndDate = async () => {
    if (!dateInput) return;
    
    try {
      const response = await fetch('/api/competition', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endDate: dateInput }),
      });
      
      if (response.ok) {
        await fetchEndDate();
        setEditingEndDate(false);
      }
    } catch (error) {
      console.error('Error updating competition end date:', error);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchEndDate();
  }, []);

  useEffect(() => {
    if (!endDate) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds, isExpired: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg p-6 shadow-lg border mb-6"
      style={{
        background:
          theme === 'christmas'
            ? 'linear-gradient(to bottom right, rgba(127, 29, 29, 0.6), rgba(20, 83, 45, 0.4))'
            : 'linear-gradient(to bottom right, rgb(31, 41, 55), rgb(17, 24, 39))',
        borderColor:
          theme === 'christmas' ? 'rgb(239, 68, 68)' : 'rgb(55, 65, 81)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          ⏰ Competition Countdown
        </h2>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setEditingEndDate(!editingEndDate);
            if (!editingEndDate && endDate) {
              // Format as local datetime-local string (no timezone conversion)
              const year = endDate.getFullYear();
              const month = String(endDate.getMonth() + 1).padStart(2, '0');
              const day = String(endDate.getDate()).padStart(2, '0');
              const hours = String(endDate.getHours()).padStart(2, '0');
              const minutes = String(endDate.getMinutes()).padStart(2, '0');
              setDateInput(`${year}-${month}-${day}T${hours}:${minutes}`);
            }
          }}
          className="text-white hover:text-yellow-300 transition-colors text-sm"
        >
          {editingEndDate ? '✕' : '✏️'}
        </motion.button>
      </div>

      {editingEndDate ? (
        <div className="flex items-center gap-2">
          <input
            type="datetime-local"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className="flex-1 px-3 py-2 rounded text-sm bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-yellow-500"
            autoFocus
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={updateEndDate}
            className="px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white font-bold text-sm"
          >
            Save
          </motion.button>
        </div>
      ) : (
        <>
          {!endDate ? (
            <div className="text-center py-4">
              <p className="text-lg text-gray-300">No competition end date set</p>
              <p className="text-sm text-gray-400 mt-2">Click the ✏️ to set a deadline!</p>
            </div>
          ) : timeRemaining.isExpired ? (
            <div className="text-center">
              <p className="text-3xl font-bold mb-2">🎉</p>
              <p className="text-xl font-bold text-white">Competition Ended!</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Days', value: timeRemaining.days },
                { label: 'Hours', value: timeRemaining.hours },
                { label: 'Minutes', value: timeRemaining.minutes },
                { label: 'Seconds', value: timeRemaining.seconds },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  className="text-center p-3 rounded-lg"
                  style={{
                    backgroundColor:
                      theme === 'christmas'
                        ? 'rgba(20, 83, 45, 0.4)'
                        : 'rgba(55, 65, 81, 0.5)',
                  }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{
                    duration: 1,
                    repeat: item.label === 'Seconds' ? Infinity : 0,
                    ease: 'easeInOut',
                  }}
                >
                  <div
                    className="text-3xl font-bold mb-1"
                    style={{
                      color:
                        theme === 'christmas'
                          ? 'rgb(252, 165, 165)'
                          : 'rgb(147, 197, 253)',
                    }}
                  >
                    {item.value.toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-white opacity-70">{item.label}</div>
                </motion.div>
              ))}
            </div>
          )}
          {endDate && (
            <p className="text-center text-sm text-white opacity-70 mt-4">
              {mounted ? endDate.toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : 'Loading...'}
            </p>
          )}
        </>
      )}
    </motion.div>
  );
}
