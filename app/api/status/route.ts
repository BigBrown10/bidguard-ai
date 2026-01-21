import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
        return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    if (!supabase) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { data, error } = await supabase
        .from('jobs')
        .select('status, result')
        .eq('id', jobId)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        ...data,
        debug: {
            hasSigningKey: !!process.env.INNGEST_SIGNING_KEY,
            hasEventKey: !!process.env.INNGEST_EVENT_KEY,
            processingTime: Date.now()
        }
    });
}
