import { useState } from 'react';
import { 
  ArrowUpDown, 
  Search, 
  Filter, 
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  Calendar
} from 'lucide-react';
import { mockLeads } from '../../data/mockData';
import { Lead, LeadStatus } from '../../types';
import { format, isToday, isBefore } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import LeadModal from '../../components/leads/LeadModal';

const BdaLeads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>(mockLeads.filter(lead => lead.assignedBdaId === user?.id));
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof Lead>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [temperatureFilter, setTemperatureFilter] = useState<string>('all');
  
  // Handle sorting
  const handleSort = (key: keyof Lead) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };
  
  // Function to update a lead
  const updateLead = (updatedLead: Lead, moveToBottom: boolean = false) => {
    // Update the lead with the current timestamp
    const now = new Date();
    const leadWithTimestamp = {
      ...updatedLead,
      updatedAt: format(now, 'yyyy-MM-dd\'T\'HH:mm:ss')
    };
    
    // Update the leads array
    setLeads(prevLeads => {
      // Remove the old lead
      const filteredLeads = prevLeads.filter(lead => lead.id !== leadWithTimestamp.id);
      
      if (moveToBottom) {
        // Add the updated lead at the end (move to bottom)
        return [...filteredLeads, leadWithTimestamp];
      } else {
        // Add the updated lead at the beginning (newest first)
        return [leadWithTimestamp, ...filteredLeads];
      }
    });
    
    toast.success(moveToBottom ? 'Lead updated and moved to bottom' : 'Lead updated successfully');
  };
  
  // Function to move a lead to the bottom of the list
  const moveLeadToBottom = (leadId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent opening the lead modal
    }
    
    const leadToMove = leads.find(lead => lead.id === leadId);
    if (leadToMove) {
      updateLead(leadToMove, true);
    }
  };
  
  // We're not using this function anymore since we removed the remarks feature
  // but keeping the implementation in case we need it in the future
  
  // Filter and sort leads
  const filteredLeads = leads
    .filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           lead.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           lead.phone.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesTemperature = temperatureFilter === 'all' || lead.temperature === temperatureFilter;
      
      return matchesSearch && matchesStatus && matchesTemperature;
    })
    .sort((a, b) => {
      let valueA = a[sortBy];
      let valueB = b[sortBy];
      
      // Handle null values
      if (valueA === null) valueA = '';
      if (valueB === null) valueB = '';
      
      // Handle date strings
      if (typeof valueA === 'string' && (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'followUpDate')) {
        return sortDirection === 'asc' 
          ? new Date(valueA).getTime() - new Date(valueB as string).getTime()
          : new Date(valueB as string).getTime() - new Date(valueA).getTime();
      }
      
      // Handle other string comparisons
      if (typeof valueA === 'string') {
        return sortDirection === 'asc'
          ? valueA.localeCompare(valueB as string)
          : (valueB as string).localeCompare(valueA);
      }
      
      return 0;
    });
  
  // Handle opening lead modal
  const handleOpenLeadModal = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };
  
  // Get follow-up status class
  const getFollowUpStatusClass = (followUpDate: string | null) => {
    if (!followUpDate) return '';
    
    const date = new Date(followUpDate);
    if (isBefore(date, new Date()) && !isToday(date)) {
      return 'text-red-600 font-medium';
    } 
    if (isToday(date)) {
      return 'text-amber-600 font-medium';
    }
    return 'text-slate-800';
  };
  
  // Get temperature badge class
  const getTemperatureBadgeClass = (temperature: string) => {
    switch (temperature) {
      case 'hot':
        return 'bg-red-100 text-red-800';
      case 'warm':
        return 'bg-amber-100 text-amber-800';
      case 'cold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">My Leads</h1>
        <p className="text-slate-500 mt-1">Manage and track your assigned leads</p>
      </div>
      
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search leads..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md text-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            className="flex items-center space-x-1 text-sm text-white border border-blue-600 bg-blue-600 rounded-md px-3 py-2 hover:bg-blue-700 hover:border-blue-700 transition-colors"
            onClick={() => {
              // Reset all filters and show all leads
              setLeads(mockLeads.filter(lead => lead.assignedBdaId === user?.id));
              setStatusFilter('all');
              setTemperatureFilter('all');
              toast.success('Filters reset');
            }}
          >
            <span>Reset Filters</span>
          </button>
          
          <button
            className="flex items-center space-x-1 text-sm text-slate-600 border border-slate-300 rounded-md px-3 py-2 bg-white hover:bg-slate-50"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      {/* Filters panel */}
      {filtersOpen && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
              className="block w-full rounded-md border-slate-300 shadow-sm 
                       focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
              <option value="closed_won">Closed (Won)</option>
              <option value="closed_lost">Closed (Lost)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Temperature
            </label>
            <select
              value={temperatureFilter}
              onChange={(e) => setTemperatureFilter(e.target.value)}
              className="block w-full rounded-md border-slate-300 shadow-sm 
                       focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
            >
              <option value="all">All Temperatures</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
              <option value="">Not Set</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Filter cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Today's follow-ups */}
        <button 
          onClick={() => {
            setStatusFilter('all');
            // Filter to only show today's follow-ups
            setLeads(mockLeads.filter(lead => 
              lead.assignedBdaId === user?.id && 
              lead.followUpDate && 
              isToday(new Date(lead.followUpDate))
            ));
            toast.success('Filtered to Today\'s Follow-ups');
          }}
          className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 flex items-center justify-between w-full hover:bg-amber-100 transition-colors duration-200"
        >
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-full mr-2 sm:mr-3 flex-shrink-0">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-amber-800 text-sm sm:text-base">Today's Follow-ups</h3>
              <p className="text-xs sm:text-sm text-amber-700">
                {leads.filter(lead => lead.followUpDate && isToday(new Date(lead.followUpDate))).length} leads
              </p>
            </div>
          </div>
        </button>
        
        {/* Overdue follow-ups */}
        <button 
          onClick={() => {
            setStatusFilter('all');
            // Filter to only show overdue follow-ups
            setLeads(mockLeads.filter(lead => 
              lead.assignedBdaId === user?.id && 
              lead.followUpDate && 
              isBefore(new Date(lead.followUpDate), new Date()) && 
              !isToday(new Date(lead.followUpDate))
            ));
            toast.success('Filtered to Overdue Follow-ups');
          }}
          className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-center justify-between w-full hover:bg-red-100 transition-colors duration-200"
        >
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-full mr-2 sm:mr-3 flex-shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-red-800 text-sm sm:text-base">Overdue Follow-ups</h3>
              <p className="text-xs sm:text-sm text-red-700">
                {leads.filter(lead => lead.followUpDate && isBefore(new Date(lead.followUpDate), new Date()) && !isToday(new Date(lead.followUpDate))).length} leads
              </p>
            </div>
          </div>
        </button>
        
        {/* Closed deals */}
        <button 
          onClick={() => {
            setStatusFilter('closed_won');
            setLeads(mockLeads.filter(lead => 
              lead.assignedBdaId === user?.id && 
              lead.status === 'closed_won'
            ));
            toast.success('Filtered to Closed Deals');
          }}
          className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 flex items-center justify-between w-full hover:bg-green-100 transition-colors duration-200"
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-full mr-2 sm:mr-3 flex-shrink-0">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-green-800 text-sm sm:text-base">Closed Deals</h3>
              <p className="text-xs sm:text-sm text-green-700">
                {leads.filter(lead => lead.status === 'closed_won').length} leads
              </p>
            </div>
          </div>
        </button>
      </div>
      
      {/* Leads table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full divide-y divide-slate-200">
            <colgroup>
              <col className="w-1/4" />
              <col className="w-1/4" />
              <col className="w-1/6" />
              <col className="w-1/6" />
              <col className="w-1/6" />
              <col />
            </colgroup>
            <thead className="bg-slate-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    <span className="whitespace-nowrap">Name</span>
                    <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1 flex-shrink-0" />
                  </div>
                </th>
                <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <span className="whitespace-nowrap">Contact</span>
                </th>
                <th 
                  scope="col" 
                  className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    <span className="whitespace-nowrap">Status</span>
                    <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1 flex-shrink-0" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('temperature')}
                >
                  <div className="flex items-center">
                    <span className="whitespace-nowrap">Temp</span>
                    <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1 flex-shrink-0" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('followUpDate')}
                >
                  <div className="flex items-center">
                    <span className="whitespace-nowrap">Follow-up</span>
                    <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1 flex-shrink-0" />
                  </div>
                </th>
                <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <span className="whitespace-nowrap">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">
                    No leads found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleOpenLeadModal(lead)}
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-slate-800">{lead.name}</div>
                      <div className="text-xs sm:text-sm text-slate-500">{lead.industry}</div>

                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-slate-800 truncate max-w-[100px] sm:max-w-none">{lead.phone}</div>
                      <div className="text-xs sm:text-sm text-slate-500 truncate max-w-[100px] sm:max-w-none">{lead.email}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 py-0.5 sm:py-1 text-xs font-semibold ${
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
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {lead.temperature ? (
                        <span className={`inline-flex rounded-full px-2 py-0.5 sm:py-1 text-xs font-semibold ${getTemperatureBadgeClass(lead.temperature)}`}>
                          {lead.temperature.charAt(0).toUpperCase() + lead.temperature.slice(1)}
                        </span>
                      ) : (
                        <span className="text-xs sm:text-sm text-slate-500">Not set</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {lead.followUpDate ? (
                        <div className={`text-xs sm:text-sm ${getFollowUpStatusClass(lead.followUpDate)}`}>
                          {format(new Date(lead.followUpDate), 'MMM d, yyyy')}
                        </div>
                      ) : (
                        <div className="text-xs sm:text-sm text-slate-500">Not scheduled</div>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center justify-between flex-wrap gap-1 sm:gap-2">
                        <div className="flex space-x-1">
                          {lead.whatsappSent && (
                            <span className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full" title="WhatsApp Sent"></span>
                          )}
                          {lead.emailSent && (
                            <span className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full" title="Email Sent"></span>
                          )}
                          {lead.quotationSent && (
                            <span className="w-2 h-2 sm:w-3 sm:h-3 bg-amber-500 rounded-full" title="Quotation Sent"></span>
                          )}
                          {lead.sampleWorkSent && (
                            <span className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-500 rounded-full" title="Sample Work Sent"></span>
                          )}
                        </div>
                        <button
                          onClick={(e) => moveLeadToBottom(lead.id, e)}
                          className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs flex items-center transition-colors whitespace-nowrap"
                          title="Move this lead to the bottom of the list"
                        >
                          <span className="hidden sm:inline">Move to Bottom</span>
                          <span className="sm:hidden">Move Down</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Lead Modal */}
      {selectedLead && (
        <LeadModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
          onSave={(updatedLead) => {
            // If lead status is closed_lost, remove it from the table
            if (updatedLead.status === 'closed_lost') {
              // Remove the lead from state
              setLeads(prevLeads => prevLeads.filter(lead => lead.id !== updatedLead.id));
              toast.success('Lead marked as lost and removed from the list');
              setIsModalOpen(false);
              setSelectedLead(null);
            } else {
              // Otherwise update the lead using our updateLead function
              updateLead(updatedLead);
              setIsModalOpen(false);
              setSelectedLead(null);
            }
          }}
          readOnly={false}
        />
      )}
    </div>
  );
};

export default BdaLeads;