// Supabase storage service for uploading and managing files
// Goal: to handle file uploads, retrievals, and signed URL generation


import { createClient } from '../database/universalClient'

export class StorageService {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)


  // Upload a file to a specified bucket
  async uploadMerchantDocument(
    userId: string, 
    file: File, 
    documentType: 'license' | 'identity' | 'tax'
  ) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${documentType}-${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    const { data, error } = await this.supabase.storage
      .from('merchant-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error
    return {
      path: data.path,
      fullPath: filePath,
      publicUrl: this.getPublicUrl('merchant-documents', filePath)
    }
  }
 
  // Get public URL for a file in a bucket
  private getPublicUrl(bucket: string, path: string) {
    return this.supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  }

  async getSignedUrl(bucket: string, path: string, expiresIn = 3600) { // temporary access (default 1 hour)
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)
    
    if (error) throw error
    return data.signedUrl
  }
}

export const storageService = new StorageService()