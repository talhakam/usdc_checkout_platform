// Supabase storage service for uploading and managing files
// Goal: to handle file uploads, retrievals, and signed URL generation


import { createClient } from '../client'

export class StorageService {
  private supabase = createClient()


  // Upload a file to a specified bucket
  async uploadMerchantDocument(
    userId: string, 
    file: File, 
    documentType: 'license' | 'identity' | 'tax'
  ) {
    if (!file || !file.name) {
      throw new Error('Invalid or missing file');
    }
    const fileExt = file.name.includes('.') ? file.name.split('.').pop() : ''
    const fileName = fileExt ? `${documentType}-${Date.now()}.${fileExt}` : `${documentType}-${Date.now()}`
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