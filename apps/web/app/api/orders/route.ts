import { NextResponse } from 'next/server'
import { adminClient } from '../../../../../apps/web/lib/database/server'

type OrderPayload = {
  payment_id: string;
  consumer_wallet: string;
  merchant_wallet: string;
  total_amount: number;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderPayload;
    const { payment_id, consumer_wallet, merchant_wallet, total_amount } = body;

    if (!payment_id || !consumer_wallet || !merchant_wallet || !total_amount) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    }

  const insertRows = [{ payment_id, consumer_wallet, merchant_wallet, total_amount, status: 'paid' }];
  // Pass the table name as a type parameter so the client uses the correct table mapping.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional: supabase typing mismatch workaround for insert payload
  const { data, error } = await adminClient.from('orders').insert(insertRows as any).select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
