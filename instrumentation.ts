export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Avoid running background workers during Next.js build phase
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return;
    }

    const net = eval('require')('net');
    const globalObj = globalThis as any;

    // 1. Prevent duplicate run in the SAME process (due to Next.js HMR)
    if (globalObj.AMKS_SERVICES_STARTED) {
      console.log('⚡ AMKS background services already started in this process.');
      return;
    }

    // 2. Prevent duplicate run across DIFFERENT processes (due to Next.js dev workers)
    // We try to bind a TCP port. The process that successfully binds will run the background services.
    const lockPort = 40003;
    const server = net.createServer();

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚡ AMKS background services port lock (${lockPort}) is in use. Skipping initialization in worker process ${process.pid}.`);
      } else {
        console.error('❌ Error in background services lock server:', err);
      }
    });

    server.listen(lockPort, '127.0.0.1', () => {
      void (async () => {
        try {
          console.log(`🏁 Initializing AMKS background services in process ${process.pid} (port lock acquired)...`);

          const { connectToWhatsApp } = await import('./lib/whatsapp');
          const { startNotificationWorker } = await import('./lib/notifications');
          const { startCronJobs } = await import('./lib/cron');

          // Non-blocking: jangan tahan startup Next.js jika WA gagal connect
          connectToWhatsApp().catch((err) => {
            console.error('❌ WhatsApp init failed (app tetap jalan):', err);
          });

          startNotificationWorker();
          startCronJobs();

          globalObj.AMKS_SERVICES_STARTED = true;
          globalObj.AMKS_LOCK_SERVER = server;

          console.log('🏁 AMKS background services initialized successfully.');
        } catch (error) {
          console.error('❌ Failed to register instrumentation background services:', error);
          server.close();
        }
      })();
    });
  }
}
