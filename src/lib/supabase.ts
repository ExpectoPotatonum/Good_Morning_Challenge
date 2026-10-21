import { createClient } from '@supabase/supabase-js';
import { DEMO_MODE } from './demo-config';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !key) {
  console.warn('Missing Supabase env vars');
}

const client = createClient(url || '', key || '');

export type RpcResponse = { data: unknown; error: { message: string } | null };

/**
 * Everything the app needs from Supabase: the three RPCs.
 *
 * When demo mode is on (local dev only — see `demo-config.ts`), calls are
 * answered by an in-memory fake instead of the network, so trying the full
 * check-in flow never reaches the database.
 */
export const supabase = {
  async rpc(fn: string, args: Record<string, unknown> = {}): Promise<RpcResponse> {
    if (DEMO_MODE) {
      const { demoRpc } = await import('./demo-db');
      return demoRpc(fn, args);
    }
    return client.rpc(fn as never, args as never) as unknown as Promise<RpcResponse>;
  },
};

export { DEMO_MODE };
