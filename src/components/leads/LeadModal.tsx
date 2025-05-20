import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Thermometer, ClipboardCheck, Calendar, CheckSquare as SquareCheck } from 'lucide-react';
import { Lead, LeadFormData, LeadInterest, LeadStatus } from '../../types';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onSave: (lead: Lead) => void;
  readOnly?: boolean;
}

const LeadModal = ({ isOpen, onClose, lead, onSave, readOnly = false }: LeadModalProps) => {
  const [formData, setFormData] = useState<LeadFormData>({
    temperature: lead.temperature,
    interests: lead.interests,
    remarks: lead.remarks,
    followUpDate: lead.followUpDate,
    whatsappSent: lead.whatsappSent,
    emailSent: lead.emailSent,
    quotationSent: lead.quotationSent,
    sampleWorkSent: lead.sampleWorkSent,
    status: lead.status,
  });
  
  // Update form data when lead changes
  useEffect(() => {
    setFormData({
      temperature: lead.temperature,
      interests: lead.interests,
      remarks: lead.remarks,
      followUpDate: lead.followUpDate,
      whatsappSent: lead.whatsappSent,
      emailSent: lead.emailSent,
      quotationSent: lead.quotationSent,
      sampleWorkSent: lead.sampleWorkSent,
      status: lead.status,
    });
  }, [lead]);
  
  const handleInterestToggle = (interest: LeadInterest) => {
    if (formData.interests.includes(interest)) {
      setFormData({
        ...formData,
        interests: formData.interests.filter(i => i !== interest)
      });
    } else {
      setFormData({
        ...formData,
        interests: [...formData.interests, interest]
      });
    }
  };
  
  const handleSave = () => {
    const updatedLead: Lead = {
      ...lead,
      ...formData,
      updatedAt: new Date().toISOString()
    };
    
    onSave(updatedLead);
  };
  
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center max-h-[90vh] overflow-y-auto">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-3xl mx-auto transform overflow-y-auto max-h-[90vh] rounded-2xl bg-white p-3 sm:p-5 text-left align-middle shadow-xl transition-all animate-fade-in border border-gray-200">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold text-gray-800"
                  >
                    Lead Details
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700 focus:outline-none p-1 -mr-1"
                    onClick={onClose}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Lead basic info (read-only) */}
                <div className="bg-blue-50 rounded-lg border border-blue-100 p-3 mb-4">
                  <div className="grid grid-cols-12 gap-2 text-sm">
                    <div className="col-span-4 font-medium text-blue-700">Name</div>
                    <div className="col-span-8 text-gray-800 font-medium">{lead.name}</div>
                    
                    <div className="col-span-4 font-medium text-blue-700">Phone</div>
                    <div className="col-span-8 text-gray-600">{lead.phone || 'N/A'}</div>
                    
                    <div className="col-span-4 font-medium text-blue-700">Email</div>
                    <div className="col-span-8 text-gray-600 break-all">{lead.email || 'N/A'}</div>
                    
                    <div className="col-span-4 font-medium text-blue-700">Source</div>
                    <div className="col-span-8 text-gray-600">{lead.source || 'N/A'}</div>
                    
                    <div className="col-span-4 font-medium text-blue-700">Industry</div>
                    <div className="col-span-8 text-gray-600">{lead.industry || 'N/A'}</div>
                    
                    <div className="col-span-4 font-medium text-blue-700">Added On</div>
                    <div className="col-span-8 text-gray-600">
                      {new Date(lead.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border border-gray-100 p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Lead status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <ClipboardCheck className="h-4 w-4 mr-1" />
                        Lead Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as LeadStatus})}
                        disabled={readOnly}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="proposal">Proposal</option>
                        <option value="negotiation">Negotiation</option>
                        <option value="closed_won">Closed (Won)</option>
                        <option value="closed_lost">Closed (Lost)</option>
                      </select>
                    </div>
                  
                    {/* Lead temperature */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Thermometer className="h-4 w-4 mr-1" />
                        Lead Temperature
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <label className={`flex items-center justify-center p-2 border-2 rounded-md cursor-pointer transition-all duration-200 ${
                          formData.temperature === 'hot' 
                            ? 'bg-red-50 border-red-300 text-red-800 shadow-sm' 
                            : 'border-slate-300 hover:bg-slate-50'
                        }`}>
                          <input
                            type="radio"
                            name="temperature"
                            value="hot"
                            checked={formData.temperature === 'hot'}
                            onChange={() => setFormData({...formData, temperature: 'hot'})}
                            disabled={readOnly}
                            className="hidden"
                          />
                          <span className="text-sm font-medium">Hot</span>
                        </label>
                        
                        <label className={`flex items-center justify-center p-2 border-2 rounded-md cursor-pointer transition-all duration-200 ${
                          formData.temperature === 'warm' 
                            ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-sm' 
                            : 'border-slate-300 hover:bg-slate-50'
                        }`}>
                          <input
                            type="radio"
                            name="temperature"
                            value="warm"
                            checked={formData.temperature === 'warm'}
                            onChange={() => setFormData({...formData, temperature: 'warm'})}
                            disabled={readOnly}
                            className="hidden"
                          />
                          <span className="text-sm font-medium">Warm</span>
                        </label>
                        
                        <label className={`flex items-center justify-center p-2 border-2 rounded-md cursor-pointer transition-all duration-200 ${
                          formData.temperature === 'cold' 
                            ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-sm' 
                            : 'border-slate-300 hover:bg-slate-50'
                        }`}>
                          <input
                            type="radio"
                            name="temperature"
                            value="cold"
                            checked={formData.temperature === 'cold'}
                            onChange={() => setFormData({...formData, temperature: 'cold'})}
                            disabled={readOnly}
                            className="hidden"
                          />
                          <span className="text-sm font-medium">Cold</span>
                        </label>
                      </div>
                    </div>
                  
                    {/* Lead interests */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Interests
                      </label>
                      <div className="grid grid-cols-2 gap-2 -mx-1">
                        <label className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150 has-[:checked]:border-green-200 has-[:checked]:bg-green-50 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.interests.includes('website')}
                            onChange={() => handleInterestToggle('website')}
                            disabled={readOnly}
                            className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-slate-700">Website</span>
                        </label>
                        
                        <label className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150 has-[:checked]:border-green-200 has-[:checked]:bg-green-50 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.interests.includes('app')}
                            onChange={() => handleInterestToggle('app')}
                            disabled={readOnly}
                            className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-slate-700">App</span>
                        </label>
                        
                        <label className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150 has-[:checked]:border-green-200 has-[:checked]:bg-green-50 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.interests.includes('crm')}
                            onChange={() => handleInterestToggle('crm')}
                            disabled={readOnly}
                            className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-slate-700">CRM</span>
                        </label>
                        
                        <label className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150 has-[:checked]:border-green-200 has-[:checked]:bg-green-50 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.interests.includes('both')}
                            onChange={() => handleInterestToggle('both')}
                            disabled={readOnly}
                            className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-slate-700">Both</span>
                        </label>
                      </div>
                    </div>
                  
                    {/* Follow-up date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Follow-up Date
                      </label>
                      <input
                        type="date"
                        value={formData.followUpDate || ''}
                        onChange={(e) => setFormData({...formData, followUpDate: e.target.value || null})}
                        disabled={readOnly}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                      />
                    </div>
                  
                    {/* Remarks */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Remarks
                      </label>
                      <div className="bg-gray-100 p-3 rounded-md">
                        <textarea
                          rows={3}
                          value={formData.remarks}
                          onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                          disabled={readOnly}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 bg-white"
                          placeholder="Add notes about this lead..."
                        />
                      </div>
                    </div>
                  
                    {/* Action toggles */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <SquareCheck className="h-4 w-4 mr-1" />
                        Actions Taken
                      </label>
                      <div className="grid grid-cols-2 gap-2 -mx-1">
                        <label className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150 has-[:checked]:border-green-200 has-[:checked]:bg-green-50 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.whatsappSent}
                            onChange={(e) => setFormData({...formData, whatsappSent: e.target.checked})}
                            disabled={readOnly}
                            className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-slate-700">WhatsApp Sent</span>
                        </label>
                        
                        <label className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150 has-[:checked]:border-green-200 has-[:checked]:bg-green-50 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.emailSent}
                            onChange={(e) => setFormData({...formData, emailSent: e.target.checked})}
                            disabled={readOnly}
                            className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-slate-700">Email Sent</span>
                        </label>
                        
                        <label className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150 has-[:checked]:border-green-200 has-[:checked]:bg-green-50 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.quotationSent}
                            onChange={(e) => setFormData({...formData, quotationSent: e.target.checked})}
                            disabled={readOnly}
                            className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-slate-700">Quotation Sent</span>
                        </label>
                        
                        <label className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150 has-[:checked]:border-green-200 has-[:checked]:bg-green-50 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.sampleWorkSent}
                            onChange={(e) => setFormData({...formData, sampleWorkSent: e.target.checked})}
                            disabled={readOnly}
                            className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-slate-700">Sample Work Sent</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  {!readOnly && (
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={handleSave}
                    >
                      Update Lead
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default LeadModal;
