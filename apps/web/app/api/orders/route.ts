import { NextResponse } from 'next/server'
import { adminClient } from '../../../../../apps/web/lib/database/server'

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_id, consumer_wallet, merchant_wallet, total_amount } = body;

    if (!payment_id || !consumer_wallet || !merchant_wallet || !total_amount) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    }

    const { data, error } = await adminClient.from('orders').insert({
      payment_id,
      consumer_wallet,
      merchant_wallet,
      total_amount,
      status: 'paid'
    }).select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
