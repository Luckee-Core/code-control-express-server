/**
 * CRUD API Generation Scheduler Edge Function
 * Runs every 10 minutes to process due CRUD API generation queue items
 *
 * Thin wrapper that delegates to Express backend. The Express backend:
 * - Queries for due queue items (status = 'queued')
 * - For each item: generates CRUD operation file using AI, creates PR, updates status
 * - CRUD files are created at src/data/{entity-slug}/{operation}.ts
 */

Deno.serve(async (req: Request) => {
  try {
    console.log(
      `\n🚀 CRUD API Generation Scheduler STARTED - ${new Date().toISOString()}`
    );

    const apiBaseUrl = (
      Deno.env.get('API_BASE_URL') || 'http://localhost:3000'
    ).replace(/\/$/, '');
    const endpoint = `${apiBaseUrl}/api/cron/process-all-queues`;

    console.log(`📞 Calling Express endpoint: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Express endpoint failed: ${response.status}`);
      console.error(`Error: ${errorText}`);

      return new Response(
        JSON.stringify({
          success: false,
          error: `Express endpoint failed: ${response.status} - ${errorText}`,
          processed: 0,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            Connection: 'close',
          },
        }
      );
    }

    const result = (await response.json()) as {
      crudApi?: {
        processed?: number;
        successful?: number;
        failed?: number;
      };
    };

    console.log(`\n✅ Execution Summary:`);
    console.log(`   Items processed: ${result.crudApi?.processed ?? 0}`);
    console.log(`   Successful: ${result.crudApi?.successful ?? 0}`);
    console.log(`   Failed: ${result.crudApi?.failed ?? 0}`);

    return new Response(JSON.stringify(result.crudApi || { processed: 0 }), {
      headers: {
        'Content-Type': 'application/json',
        Connection: 'close',
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`💥 FATAL ERROR: ${err.message}`);

    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'Unknown error',
        processed: 0,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          Connection: 'close',
        },
      }
    );
  }
});
