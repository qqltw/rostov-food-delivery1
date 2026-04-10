// Vercel serverless entry point.
// Loads the Express app; if that fails, returns a readable JSON error
// instead of letting the function crash with FUNCTION_INVOCATION_FAILED.

let app: any = null;
let loadError: Error | null = null;

try {
  const mod = await import('../server');
  app = mod.default;
} catch (err) {
  loadError = err as Error;
  console.error('Failed to load server module:', err);
}

export default async function handler(req: any, res: any) {
  if (loadError || !app) {
    res.status(500).json({
      error: 'Server failed to initialize',
      message: loadError?.message || 'Unknown error',
      stack: loadError?.stack,
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        node: process.version,
        vercel: !!process.env.VERCEL,
      },
    });
    return;
  }

  // Delegate to Express
  return app(req, res);
}
