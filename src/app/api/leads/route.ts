/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextResponse } from 'next/server';

// Mock server-side database reference for illustration
// This is exactly where real Database connections (Prisma, Firestore, PostgreSQL, Spanner, etc.) will reside
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: "Centric CRM Server API: Connection Successful.",
      timestamp: new Date().toISOString(),
      note: "Connect your production database queries here.",
      data: []
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate and save the lead to your database here...
    // const savedLead = await database.lead.create({ data: body });

    return NextResponse.json({
      success: true,
      message: "Lead created successfully in database.",
      data: body
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
