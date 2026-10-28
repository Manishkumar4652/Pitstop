'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/auth/AuthContext';
import { useLanguage } from '@/lib/i18n';

export interface LogoutButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  className = '',
  variant = 'outline',
  size = 'sm',
  fullWidth = false,
}) => {
  const router = useRouter();
  const { logout } = useAuth();
  const { isHindi } = useLanguage();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/');
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={isLoggingOut}
      onClick={handleLogout}
      className={className}
      leftIcon={<LogOut className="h-4 w-4" aria-hidden="true" />}
      aria-label={isHindi ? 'पिटस्टॉप खाते से लॉग आउट करें' : 'Log out of your PitStop account'}
    >
      {isLoggingOut
        ? isHindi
          ? 'लॉग आउट हो रहा है...'
          : 'Logging out...'
        : isHindi
        ? 'लॉग आउट'
        : 'Log Out'}
    </Button>
  );
};
