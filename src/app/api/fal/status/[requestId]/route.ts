import { NextRequest, NextResponse } from 'next/server';
import { FalClient } from '@/lib/fal-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const { requestId } = params;
    const endpoint_id = request.nextUrl.searchParams.get('endpoint_id');
    
    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }
    
    if (!endpoint_id) {
      return NextResponse.json({ error: 'endpoint_id query parameter is required' }, { status: 400 });
    }

    // Initialize FAL client
    const falClient = new FalClient();
    
    // Check job status
    const status = await falClient.checkStatus(endpoint_id, requestId, true);

    // Return standardized response
    return NextResponse.json({
      requestId,
      endpoint_id,
      status: status.status, // "IN_QUEUE", "IN_PROGRESS", "COMPLETED", "FAILED"
      logs: status.logs || [],
      progress: status.progress?.percentage || 0,
      queue_position: status.queue_position || null,
      metrics: status.metrics || null,
      // Include URLs for reference
      status_url: status.status_url,
      response_url: status.response_url,
      cancel_url: status.cancel_url
    });

  } catch (error: any) {
    console.error('💥 [FAL_STATUS] Error checking job status:', error);
    
    // Handle specific error cases
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      return NextResponse.json({ 
        error: 'Job not found',
        requestId: params.requestId 
      }, { status: 404 });
    }
    
    if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
      return NextResponse.json({ 
        error: 'Authentication failed - check FAL_KEY' 
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: `Failed to check job status: ${error.message}`,
      requestId: params.requestId 
    }, { status: 500 });
  }
}
