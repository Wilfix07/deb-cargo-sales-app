import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

interface MobileStatusBarProps {
  title?: string;
  showTime?: boolean;
  showBattery?: boolean;
  showSignal?: boolean;
  className?: string;
}

export const MobileStatusBar: React.FC<MobileStatusBarProps> = ({
  title = 'DEB CARGO SHIPPING LLC',
  showTime = true,
  showBattery = true,
  showSignal = true,
  className = ''
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isCharging, setIsCharging] = useState(false);

  useEffect(() => {
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Get battery info if available
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);

        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });

        battery.addEventListener('chargingchange', () => {
          setIsCharging(battery.charging);
        });
      });
    }

    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    });
  };

  const getBatteryColor = () => {
    if (isCharging) return 'text-green-400';
    if (batteryLevel > 50) return 'text-white';
    if (batteryLevel > 20) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className={`status-bar flex items-center justify-between px-4 ${className}`}>
      {/* Left side - Time */}
      <div className="flex items-center space-x-2">
        {showTime && (
          <span className="text-sm font-medium">
            {formatTime(currentTime)}
          </span>
        )}
      </div>

      {/* Center - Title */}
      <div className="flex-1 text-center">
        <span className="text-xs font-medium truncate">
          {title}
        </span>
      </div>

      {/* Right side - Status indicators */}
      <div className="flex items-center space-x-1">
        {showSignal && (
          <div className="flex items-center">
            <Signal className="w-4 h-4" />
          </div>
        )}
        
        <div className="flex items-center">
          <Wifi className="w-4 h-4" />
        </div>

        {showBattery && (
          <div className="flex items-center space-x-1">
            <span className={`text-xs font-medium ${getBatteryColor()}`}>
              {batteryLevel}%
            </span>
            <div className={`w-6 h-3 border border-white rounded-sm ${getBatteryColor()}`}>
              <div 
                className={`h-full rounded-sm transition-all duration-300 ${
                  isCharging ? 'bg-green-400' : 
                  batteryLevel > 50 ? 'bg-white' :
                  batteryLevel > 20 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                style={{ width: `${batteryLevel}%` }}
              />
            </div>
            {isCharging && (
              <div className="w-1 h-2 bg-white rounded-r-sm -ml-1"></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};