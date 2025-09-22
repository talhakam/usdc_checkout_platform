"use client";

import React, { useState } from "react";
import supabase from "../../../lib/supabaseClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../../../components/ui/button";
// Provide a runtime-safe fallback in case the imported Button is undefined at runtime
const UIButton: any = (Button as any) || ((props: any) => <button {...props}>{props.children}</button>);
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
      if (data.kyc && data.kyc[0]) {
        const file = data.kyc[0] as File;
        const fileName = `${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('kyc').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { publicURL } = supabase.storage.from('kyc').getPublicUrl(fileName);
        kycUrl = publicURL;
      }

  // Insert merchant record into 'merchants' table (create this table in Supabase)
  // Mark as not registered on-chain until admin approves
  const { error: insertError } = await supabase.from('merchants').insert([{ name: data.name, store_url: data.storeUrl, wallet: data.wallet, kyc_url: kycUrl, isRegistered: false }]);
      if (insertError) throw insertError;

      setSuccess(true);
      reset();
    } catch (e: any) {
      console.error(e);
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="max-w-2xl w-full bg-white/60 p-10 rounded-lg border border-gray-200 shadow">
        <h1 className="text-2xl font-semibold mb-4">Merchant Registration</h1>
        <p className="text-gray-600 mb-6">Register your store to accept USDC payments. We'll keep your info private.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input {...register('name')} className="w-full p-2 border rounded" />
            {errors.name && <p className="text-sm text-red-600">{String(errors.name.message)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Store URL</label>
            <input {...register('storeUrl')} className="w-full p-2 border rounded" />
            {errors.storeUrl && <p className="text-sm text-red-600">{String(errors.storeUrl.message)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Wallet</label>
            <input {...register('wallet')} className="w-full p-2 border rounded" />
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
          {success && <p className="text-sm text-green-600">Registration submitted — we'll review and activate your merchant account.</p>}
        </form>
      </div>
    </div>
  );
}
