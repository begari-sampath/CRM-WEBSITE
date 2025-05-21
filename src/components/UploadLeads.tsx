import React from 'react'
import Papa from 'papaparse'
import { supabase } from '../supabase/supabaseClient'

interface Lead {
  name: string
  email: string
  phone: string
  source?: string
  status?: string
}

const UploadLeads: React.FC = () => {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    Papa.parse<Lead>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const leads = results.data.map((lead) => ({
          ...lead,
          status: lead.status || 'new',
        }))

        const { error } = await supabase.from('leads').insert(leads)

        if (error) {
          console.error('Error uploading:', error.message)
          alert('Something went wrong!')
        } else {
          alert('Leads uploaded successfully!')
        }
      },
    })
  }

  return (
    <div>
      <h2>Upload Leads CSV</h2>
      <input type="file" accept=".csv" onChange={handleFileChange} />
    </div>
  )
}

export default UploadLeads
