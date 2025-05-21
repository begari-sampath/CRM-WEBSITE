import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pcilacrcfqefymqkztvo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjaWxhY3JjZnFlZnltcWt6dHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDQwMzcsImV4cCI6MjA2MzMyMDAzN30.oj5SK0u3X69NRi0jv64iBA5_D8FrxR4BM5blp8la6Mc'

export const supabase = createClient(supabaseUrl, supabaseKey)
export default supabase;