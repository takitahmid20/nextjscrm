/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CRMProvider } from '../context/CRMContext';
import MainLayoutContent from '../components/MainLayoutContent';
import '../index.css';

export const metadata = {
  title: 'Centric CRM | Enterprise Dashboard Suite',
  description: 'Enterprise CRM suite built with Next.js App Router.',
};

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
      </head>
      <body>
        <CRMProvider>
          <MainLayoutContent>
            {children}
          </MainLayoutContent>
        </CRMProvider>
      </body>
    </html>
  );
}
