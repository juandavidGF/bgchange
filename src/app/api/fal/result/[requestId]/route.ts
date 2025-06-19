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
    
    // Get job result
    const result = await falClient.getResult(endpoint_id, requestId);

    // Return standardized response
    return NextResponse.json({
      data: result.data, // The actual output from FAL (video, images, etc.)
      requestId: result.requestId,
      endpoint_id,
      model: endpoint_id,
      status: 'completed',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('💥 [FAL_RESULT] Error fetching job result:', error);
    
    // Handle specific error cases
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      return NextResponse.json({ 
        error: 'Job result not found - job may not be completed yet',
        requestId: params.requestId 
      }, { status: 404 });
    }
    
    if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
      return NextResponse.json({ 
        error: 'Authentication failed - check FAL_KEY' 
      }, { status: 401 });
    }
    
    if (error.message?.includes('job not completed') || error.message?.includes('still processing')) {
      return NextResponse.json({ 
        error: 'Job is still processing - check status first',
        requestId: params.requestId 
      }, { status: 202 }); // 202 Accepted - still processing
    }
    
    return NextResponse.json({ 
      error: `Failed to fetch job result: ${error.message}`,
      requestId: params.requestId 
    }, { status: 500 });
  }
}
