import { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import { supabase } from '../../supabase/supabaseClient';
import LeadModal from '../../components/leads/LeadModal.fixed';

// Define types locally
type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
type LeadInterest = 'website' | 'app' | 'crm' | 'both';

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  industry: string | null;
  service: string | null;
  type: string | null;
  status: LeadStatus;
  assignedTo: string | null;
  followUpDate: string | null;
  temperature: string;
  interests: LeadInterest[];
  remarks: string;
  whatsappSent: boolean;
  emailSent: boolean;
  quotationSent: boolean;
  sampleWorkSent: boolean;
  createdAt: string;
  updatedAt: string;
}

const BdaLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const leadsSubscriptionRef = useRef<any>(null);

  // Fetch current user's ID
  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  };

  // Fetch leads assigned to the current BDA
  const fetchLeads = async (bdaId?: string) => {
    const id = bdaId || userId;
    if (!id) {
      toast.error('User not authenticated');
      return;
    }
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('assignedTo', id);
    if (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to load leads');
      return;
    }
    setLeads(data || []);
  };

  // Initialize userId and leads
  useEffect(() => {
    const init = async () => {
      const id = await fetchCurrentUser();
      setUserId(id || null);
      if (id) {
        fetchLeads(id);
      }
    };
    init();
  }, []);

  // Real-time subscription for lead assignments
  useEffect(() => {
    if (!userId) return;
    // Clean up previous subscription
    if (leadsSubscriptionRef.current) {
      leadsSubscriptionRef.current.unsubscribe();
      leadsSubscriptionRef.current = null;
    }
    const subscription = supabase
      .channel('leads-assignment-bda-' + userId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `assignedTo=eq.${userId}`,
        },
        () => {
          // Re-fetch leads on any insert/update/delete for this BDA
          fetchLeads(userId);
        }
      )
      .subscribe();
    leadsSubscriptionRef.current = subscription;
    return () => {
      if (leadsSubscriptionRef.current) {
        leadsSubscriptionRef.current.unsubscribe();
        leadsSubscriptionRef.current = null;
      }
    };
  }, [userId]);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchLeads();
  };

  const handleOpenLeadModal = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleSaveLead = async (updatedLead: Lead) => {
    const leadToSave = {
      ...updatedLead,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('leads')
      .upsert(leadToSave);

    if (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead');
      return;
    }

    // Refresh leads
    const userId = await fetchCurrentUser();
    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    const { data: updatedLeads, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('assignedTo', userId);

    if (fetchError) {
      console.error('Error fetching updated leads:', fetchError);
      toast.error('Failed to refresh leads');
      return;
    }

    setLeads(updatedLeads || []);
    setIsModalOpen(false);
    setSelectedLead(null);
    toast.success('Lead updated successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">My Leads</h1>
        <button
          onClick={handleRefresh}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium shadow-sm"
          title="Refresh leads"
        >
          Refresh
        </button>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Follow-up
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">
                    No leads assigned to you.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleOpenLeadModal(lead)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-800">{lead.name}</div>
                      <div className="text-sm text-slate-500">{lead.industry}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-800">{lead.phone || 'N/A'}</div>
                      <div className="text-sm text-slate-500">{lead.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        lead.status === 'new' ? 'bg-slate-100 text-slate-800' :
                        lead.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                        lead.status === 'qualified' ? 'bg-purple-100 text-purple-800' :
                        lead.status === 'proposal' ? 'bg-amber-100 text-amber-800' :
                        lead.status === 'negotiation' ? 'bg-orange-100 text-orange-800' :
                        lead.status === 'closed_won' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {lead.status === 'closed_won' ? 'Won' :
                         lead.status === 'closed_lost' ? 'Lost' :
                         lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.followUpDate ? (
                        <div className={`text-sm ${
                          new Date(lead.followUpDate) < new Date() && 
                          format(new Date(lead.followUpDate), 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd')
                            ? 'text-red-600 font-medium'
                            : format(new Date(lead.followUpDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                              ? 'text-amber-600 font-medium'
                              : 'text-slate-800'
                        }`}>
                          {format(new Date(lead.followUpDate), 'MMM d, yyyy')}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500">Not scheduled</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">
                        {lead.updatedAt ? (
                          format(parseISO(lead.updatedAt), 'MMM d, h:mm a')
                        ) : (
                          'Unknown'
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLead && (
        <LeadModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedLead(null);
          }}
          lead={selectedLead as any}
          onSave={handleSaveLead as any}
          readOnly={true} // BDAs typically have read-only access
        />
      )}
    </div>
  );
};

export default BdaLeads;