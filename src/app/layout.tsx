/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { ConfirmProvider } from '../context/ConfirmContext';
import { CRMProvider } from '../context/CRMContext';
import MainLayoutContent from '../components/MainLayoutContent';
import Toaster from '../components/Toaster';
import '../index.css';

export const metadata = {
  title: 'Centric CRM | Enterprise Dashboard Suite',
  description: 'Enterprise CRM suite built with Next.js App Router.',
};

// Applied before hydration so there's no flash of the wrong theme — mirrors
// the logic in ThemeContext.tsx (localStorage override, else OS preference).
const THEME_INIT_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('crm_theme');
    var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <ConfirmProvider>
                <CRMProvider>
                  <MainLayoutContent>
                    {children}
                  </MainLayoutContent>
                </CRMProvider>
                <Toaster />
              </ConfirmProvider>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
