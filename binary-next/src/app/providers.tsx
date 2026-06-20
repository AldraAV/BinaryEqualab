"use client";
import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { CalculatorProvider } from '../contexts/CalculatorContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CalculatorProvider>
          {children}
        </CalculatorProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
