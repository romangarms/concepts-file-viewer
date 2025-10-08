import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  show: boolean;
  onHide: () => void;
}

export function Toast({ message, type, show, onHide }: ToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onHide();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  return (
    <div className={`status ${type} ${show ? 'show' : ''}`}>
      {message}
    </div>
  );
}
