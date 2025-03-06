// src/lib/hooks/storeSignup.tsx
'use server'

import { getSupabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function storeSignup(email: string) {
  try {
    // Create Supabase server client
    const supabase = getSupabase()
    
    // Insert the signup request
    const { data, error } = await supabase
      .from('chitrack_access_request')
      .insert([
        { email: email.toLowerCase() }
      ])
      .select()

    if (error) {
      if (error.code === '23505') { // Unique violation
        return { success: false, message: 'This email has already requested access.' }
      }
      console.error('Error storing signup:', error)
      return { success: false, message: 'Failed to store signup request.' }
    }

    // Revalidate the home page
    revalidatePath('/')
    
    return { success: true, message: 'Thank you for your interest! We\'ll notify you when access is available.' }
  } catch (error) {
    console.error('Error in storeSignup:', error)
    return { success: false, message: 'An unexpected error occurred.' }
  }
}
