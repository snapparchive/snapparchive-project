// app/api/logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { logToDatabase } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { logs } = await request.json();

    if (!logs || !Array.isArray(logs)) {
      return NextResponse.json(
        { error: 'Invalid logs data' },
        { status: 400 }
      );
    }

    const validLogs = logs.filter(log => 
      log.timestamp && 
      log.level && 
      log.category && 
      log.message
    );

    if (validLogs.length === 0) {
      return NextResponse.json(
        { error: 'No valid logs to insert' },
        { status: 400 }
      );
    }

    await logToDatabase(validLogs);

    return NextResponse.json({ 
      success: true, 
      inserted: validLogs.length 
    });

  } catch (error) {
    console.error('Error saving logs:', error);
    return NextResponse.json(
      { error: 'Failed to save logs' },
      { status: 500 }
    );
  }
}