import axios from 'axios'
import { BASE_URL, SUPABASE_KEY, IS_SUPABASE } from '../config/api'

// ---------------------------------------------------------------------------
// UploadService — uploads game cover images to Supabase Storage (`game-covers`)
// with automatic base64 Data URL fallback when offline or unavailable.
// ---------------------------------------------------------------------------

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const BUCKET_NAME = 'game-covers'

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

class UploadService {
  async uploadImage(file) {
    if (!file) {
      throw new Error('No file provided.')
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Allowed formats: .jpg, .jpeg, .png, .webp')
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error('File size exceeds the 5 MB limit.')
    }

    if (IS_SUPABASE && BASE_URL && SUPABASE_KEY && navigator.onLine) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const fileName = `cover_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`

      try {
        const uploadUrl = `${BASE_URL}/storage/v1/object/${BUCKET_NAME}/${fileName}`
        await axios.post(uploadUrl, file, {
          headers: {
            'Content-Type': file.type,
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          timeout: 30000,
        })

        const publicUrl = `${BASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${fileName}`
        return {
          success: true,
          data: { url: publicUrl, filename: fileName },
        }
      } catch (err) {
        console.warn('Supabase Storage upload fallback to base64 Data URL:', err)
      }
    }

    const dataUrl = await readAsDataUrl(file)
    return {
      success: true,
      data: { url: dataUrl, filename: file.name },
    }
  }
}

export default new UploadService()
