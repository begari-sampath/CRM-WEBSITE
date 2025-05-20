import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, Circle, Info, PhoneCall, Mail, FileText, FileCheck } from 'lucide-react';
import { generateMockDashboardMetrics, generateCalendarEvents, mockLeads, mockActivities } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { format, parseISO, isToday } from 'date-fns';
import { Lead } from '../../types';

const BdaDashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(generateMockDashboardMetrics(user?.id));
  const [calendarEvents, setCalendarEvents] = useState(generateCalendarEvents(user?.id));
  
  // Store leads in state so we can update them
  const [leads, setLeads] = useState(() => {
    // Filter leads assigned to current BDA
    return mockLeads.filter(lead => lead.assignedBdaId === user?.id)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  });
  
  // Store today's activities
  const [todayActivities, setTodayActivities] = useState(() => {
    return mockActivities
      .filter(activity => {
        const activityDate = parseISO(activity.timestamp);
        return isToday(activityDate) && activity.performedById === user?.id;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  });
  
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
    
    // Create a new activity for this update
    const newActivity = {
      id: `activity-${Date.now()}`,
      leadId: updatedLead.id,
      leadName: updatedLead.name,
      action: moveToBottom ? 'Updated lead and moved to bottom' : 'Updated lead information',
      performedBy: user?.name || 'Unknown User',
      performedById: user?.id || 'unknown',
      timestamp: format(now, 'yyyy-MM-dd\'T\'HH:mm:ss')
    };
    
    // Add the new activity to today's activities
    setTodayActivities(prev => [newActivity, ...prev]);
    
    // Update metrics with the new activity
    setMetrics(prevMetrics => ({
      ...prevMetrics,
      recentActivity: [newActivity, ...prevMetrics.recentActivity.slice(0, 19)] // Keep last 20 activities
    }));
  };
  
  // Function to move a lead to the bottom of the list
  const moveLeadToBottom = (leadId: string) => {
    const leadToMove = leads.find(lead => lead.id === leadId);
    if (leadToMove) {
      updateLead(leadToMove, true);
    }
  };
  
  // Function to add a remark to a lead
  const addRemarkToLead = (leadId: string, remark: string) => {
    const leadToUpdate = leads.find(lead => lead.id === leadId);
    if (leadToUpdate) {
      const updatedLead = {
        ...leadToUpdate,
        remarks: remark
      };
      updateLead(updatedLead);
    }
  };
  
  // Count today's and overdue follow-ups
  const todayFollowUps = calendarEvents.filter(event => event.status === 'today').length;
  const overdueFollowUps = calendarEvents.filter(event => event.status === 'overdue').length;
  
  // Get follow-ups for today
  const todayEvents = calendarEvents.filter(event => event.status === 'today');
  
  // Simulate data refresh (e.g., websocket or polling)
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(generateMockDashboardMetrics(user?.id));
      setCalendarEvents(generateCalendarEvents(user?.id));
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, [user?.id]);
  
  // Calculate status distribution percentages
  const statusPercentages = (() => {
    const total = Object.values(metrics.leadsByStatus || {}).reduce((sum, count) => sum + count, 0);
    if (total === 0) return {};
    
    return Object.entries(metrics.leadsByStatus || {}).reduce((acc, [status, count]) => {
      acc[status] = Math.round((count / total) * 100);
      return acc;
    }, {} as Record<string, number>);
  })();
  
  // Statistics cards data
  const statsCards = [
    { 
      title: 'Total Leads', 
      value: metrics.totalLeads, 
      icon: CheckCircle2, 
      color: 'bg-blue-500',
      description: 'Assigned to you' 
    },
    { 
      title: 'Today\'s Follow-ups', 
      value: todayFollowUps, 
      icon: Calendar, 
      color: 'bg-amber-500',
      description: 'Due today' 
    },
    { 
      title: 'Overdue Follow-ups', 
      value: overdueFollowUps, 
      icon: Clock, 
      color: 'bg-red-500',
      description: 'Need immediate attention' 
    },
    { 
      title: 'New Leads', 
      value: metrics.newLeads, 
      icon: Circle, 
      color: 'bg-green-500',
      description: 'Not contacted yet' 
    },
  ];

  // No need for this variable anymore as we're using the leads state

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">Welcome back, {user?.name}</h1>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">Here's what's happening with your leads today.</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center">
            <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <Info className="w-4 h-4 mr-1" />
              {todayFollowUps} follow-ups today
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statsCards.map((card, index) => (
          <div 
            key={index}
            className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 flex items-start space-x-3 sm:space-x-4 border border-slate-200 hover:shadow-md transition-shadow"
          >
            <div className={`p-2 sm:p-3 rounded-full ${card.color}`}>
              <card.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-slate-500">{card.title}</p>
              <p className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-800">{card.value}</p>
              <p className="text-xs text-slate-500 mt-0.5 sm:mt-1 hidden sm:block">{card.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Status overview and Today's follow-ups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Status overview */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 lg:col-span-1">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-medium text-slate-800">Lead Status Overview</h2>
          </div>
          <div className="p-6 space-y-4">
            {Object.entries(statusPercentages).map(([status, percentage]) => {
              const getStatusColor = (status: string) => {
                switch(status) {
                  case 'new': return 'bg-slate-500';
                  case 'contacted': return 'bg-blue-500';
                  case 'qualified': return 'bg-purple-500';
                  case 'proposal': return 'bg-amber-500';
                  case 'negotiation': return 'bg-orange-500';
                  case 'closed_won': return 'bg-green-500';
                  case 'closed_lost': return 'bg-red-500';
                  default: return 'bg-slate-300';
                }
              };
              
              const getStatusLabel = (status: string) => {
                switch(status) {
                  case 'closed_won': return 'Won';
                  case 'closed_lost': return 'Lost';
                  default: return status.charAt(0).toUpperCase() + status.slice(1);
                }
              };
              
              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-slate-800">
                      {getStatusLabel(status)}
                    </div>
                    <div className="text-sm text-slate-500">{percentage}%</div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full">
                    <div 
                      className={`h-full rounded-full ${getStatusColor(status)}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            
            <hr className="border-slate-200" />
            
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-800">Follow-up Status</h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span>Overdue</span>
                </div>
                <div className="text-sm font-medium">{overdueFollowUps}</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                  <span>Today</span>
                </div>
                <div className="text-sm font-medium">{todayFollowUps}</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span>Upcoming</span>
                </div>
                <div className="text-sm font-medium">
                  {calendarEvents.filter(event => event.status === 'upcoming').length}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Today's follow-ups */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 lg:col-span-2">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-medium text-slate-800">Today's Follow-ups</h2>
          </div>
          
          <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
            {todayEvents.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="text-slate-400 mb-2">
                  <Calendar className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-1">No follow-ups for today</h3>
                <p className="text-sm text-slate-500">
                  Check the calendar for upcoming follow-ups.
                </p>
              </div>
            ) : (
              todayEvents.map((event) => {
                // Find the corresponding lead to get more details
                const lead = mockLeads.find(l => l.id === event.leadId);
                
                return (
                  <div key={event.id} className="px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-800">{event.title}</div>
                        <div className="text-xs text-amber-600 font-medium mb-1">Due today</div>
                        {lead && (
                          <div className="text-xs text-slate-600 space-y-1">
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1 text-slate-400" />
                              <span>{lead.email}</span>
                            </div>
                            <div className="flex items-center">
                              <PhoneCall className="h-3 w-3 mr-1 text-slate-400" />
                              <span>{lead.phone}</span>
                            </div>
                            {lead.remarks && (
                              <div className="flex items-start">
                                <Info className="h-3 w-3 mr-1 text-slate-400 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-2">{lead.remarks}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-sm text-slate-500 font-medium">
                          {format(event.date, 'h:mm a')}
                        </div>
                        {lead && (
                          <div className="flex items-center mt-2 space-x-2">
                            {lead.whatsappSent && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">WhatsApp</span>
                            )}
                            {lead.emailSent && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">Email</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      
      {/* Recently updated leads */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-medium text-slate-800">Recently Updated Leads</h2>
          <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
            {leads.length} leads total
          </div>
        </div>
        <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
          {leads.length === 0 ? (
            <div className="px-4 sm:px-6 py-8 text-center">
              <div className="text-slate-400 mb-2">
                <CheckCircle2 className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-1">No leads assigned yet</h3>
              <p className="text-sm text-slate-500">
                Leads assigned to you will appear here.
              </p>
            </div>
          ) : (
            leads.map((lead) => (
              <div key={lead.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-slate-800">{lead.name}</div>
                      <div className="ml-2">
                        {lead.temperature === 'hot' && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-xs">Hot</span>
                        )}
                        {lead.temperature === 'warm' && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-xs">Warm</span>
                        )}
                        {lead.temperature === 'cold' && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">Cold</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1 mt-1">
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-1 text-slate-400" />
                        <span>{lead.email}</span>
                      </div>
                      <div className="flex items-center">
                        <PhoneCall className="h-3 w-3 mr-1 text-slate-400" />
                        <span>{lead.phone}</span>
                      </div>
                      <div className="flex items-start">
                        <Info className="h-3 w-3 mr-1 text-slate-400 mt-0.5 flex-shrink-0" />
                        {lead.remarks ? (
                          <div className="flex flex-col w-full">
                            <div className="bg-gray-100 p-2 rounded-md mb-1 text-gray-800">
                              <span className="line-clamp-2">{lead.remarks}</span>
                            </div>
                            <button 
                              onClick={() => {
                                const newRemark = prompt('Update remarks:', lead.remarks);
                                if (newRemark !== null) {
                                  addRemarkToLead(lead.id, newRemark);
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800 text-xs mt-1 self-end"
                            >
                              Edit Remarks
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              const newRemark = prompt('Add remarks:');
                              if (newRemark) {
                                addRemarkToLead(lead.id, newRemark);
                              }
                            }}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            Add Remarks
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        lead.status === 'new' ? 'bg-slate-100 text-slate-800' :
                        lead.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                        lead.status === 'qualified' ? 'bg-purple-100 text-purple-800' :
                        lead.status === 'proposal' ? 'bg-amber-100 text-amber-800' :
                        lead.status === 'negotiation' ? 'bg-orange-100 text-orange-800' :
                        lead.status === 'closed_won' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1).replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      Updated {format(parseISO(lead.updatedAt), 'MMM d, h:mm a')}
                    </div>
                    <div className="flex items-center mt-2 space-x-2">
                      {lead.followUpDate && isToday(parseISO(lead.followUpDate)) && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Follow-up today
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering parent click events
                          moveLeadToBottom(lead.id);
                        }}
                        className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs flex items-center transition-colors"
                        title="Move this lead to the bottom of the list"
                      >
                        Move to Bottom
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Today's activity */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-medium text-slate-800">Today's Activity</h2>
          <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
            {todayActivities.length} activities today
          </div>
        </div>
        <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
          {todayActivities.length === 0 ? (
            <div className="px-4 sm:px-6 py-4 text-center text-sm text-slate-500">
              No activities recorded today
            </div>
          ) : (
            todayActivities.map((activity, index) => (
              <div key={index} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start">
                  <div className="mr-3 sm:mr-4 mt-0.5 flex-shrink-0">
                    {activity.action.includes('phone') || activity.action.includes('call') ? (
                      <PhoneCall className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                    ) : activity.action.includes('email') ? (
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                    ) : activity.action.includes('quotation') ? (
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                    ) : activity.action.includes('follow-up') ? (
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                    ) : activity.action.includes('sample') ? (
                      <FileCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                      <p className="text-sm text-slate-800 truncate">
                        <span className="font-medium">{activity.leadName}</span>
                        <span className="text-slate-600"> - {activity.action}</span>
                      </p>
                      <div className="text-xs text-slate-500 mt-1 sm:mt-0 sm:ml-2 flex-shrink-0">
                        {format(parseISO(activity.timestamp), 'MMM d, h:mm a')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BdaDashboard;