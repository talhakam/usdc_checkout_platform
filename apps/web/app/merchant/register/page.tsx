"use client";

import React, { useState } from "react";
import supabase from "../../../lib/supabaseClient";
import type { Database } from '@shared/types/types'
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../../../components/ui/button";
// Use the imported Button component directly. Avoid `any` to keep eslint happy.
const UIButton = Button;
import Link from "next/link";

const MerchantSchema = z.object({
  name: z.string().min(2, "Enter a valid name"),
  storeUrl: z.string().url("Enter a valid URL"),
  wallet: z.string().min(42).max(42),
  kyc: z.any().optional(),
});

type MerchantForm = z.infer<typeof MerchantSchema>;

export default function MerchantRegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<MerchantForm>({
    resolver: zodResolver(MerchantSchema),
  });

  const onSubmit = async (data: MerchantForm) => {
    setLoading(true);
    setError(null);
    try {
      let kycUrl = null;
      if (data.kyc && (data.kyc as unknown as File[])[0]) {
        const file = (data.kyc as unknown as File[])[0];
        const fileName = `${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('kyc').upload(fileName, file);
        if (uploadError) throw uploadError;
        // getPublicUrl returns { data: { publicUrl: string } }
        const { data: publicData } = supabase.storage.from('kyc').getPublicUrl(fileName);
        kycUrl = publicData?.publicUrl ?? null;
      }


  // Mark as not registered on-chain until admin approves
  // cast insert payload to any to work around a typing mismatch where the table type
  // may not be inferred correctly in this workspace's supabase client types.
  const insertPayload: Database['public']['Tables']['merchants']['Insert'][] = [
    { name: data.name, store_url: data.storeUrl ?? null, wallet: data.wallet, kyc_url: kycUrl ?? null, isRegistered: false }
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional: supabase typing mismatch workaround for insert payload
  const { error: insertError } = await supabase.from('merchants').insert(insertPayload as any);
      if (insertError) throw insertError;

      setSuccess(true);
      reset();
    } catch (e: unknown) {
        console.error(e);
        const m = e instanceof Error ? e.message : String(e);
        setError(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="max-w-2xl w-full bg-surface/60 p-10 rounded-lg border border-border shadow">
        <h1 className="text-2xl font-semibold mb-4">Merchant Registration</h1>
  <p className="text-muted mb-6">Register your store to accept USDC payments. We&apos;ll keep your info private.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input {...register('name')} className="w-full p-2 border rounded text-black" />
            {errors.name && <p className="text-sm text-red-600">{String(errors.name.message)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Store URL</label>
            <input {...register('storeUrl')} className="w-full p-2 border rounded text-black" />
            {errors.storeUrl && <p className="text-sm text-red-600">{String(errors.storeUrl.message)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Wallet</label>
            <input {...register('wallet')} className="w-full p-2 border rounded text-black" />
            {errors.wallet && <p className="text-sm text-red-600">{String(errors.wallet.message)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">KYC file (optional)</label>
            <input type="file" {...register('kyc')} className="w-full" />
          </div>

          <div className="flex items-center gap-3">
            <UIButton type="submit" className="bg-blue-600 text-white" disabled={loading}>{loading ? 'Submitting...' : 'Register'}</UIButton>
            <Link href="/" className="text-sm text-gray-600">Back</Link>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">Registration submitted — we&apos;ll review and activate your merchant account.</p>}
        </form>
      </div>
    </div>
  );
}
