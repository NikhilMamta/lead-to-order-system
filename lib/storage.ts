import { LeadDetails, FollowUpHistory, Enquiry, User } from './types'

// Storage Keys
const STORAGE_KEYS = {
  LEADS: 'lead_to_order_leads',
  FOLLOW_UPS: 'lead_to_order_follow_ups',
  ENQUIRIES: 'lead_to_order_enquiries',
  USER: 'lead_to_order_user',
} as const

// Generic Storage Functions
export const storage = {
  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return null
    }
  },

  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error writing to localStorage:', error)
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing from localStorage:', error)
    }
  },
}

// Lead Management
export const leadStorage = {
  getAll: (): LeadDetails[] => {
    return storage.get<LeadDetails[]>(STORAGE_KEYS.LEADS) || []
  },

  getById: (id: string): LeadDetails | null => {
    const leads = leadStorage.getAll()
    return leads.find((lead) => lead.id === id) || null
  },

  add: (lead: LeadDetails): void => {
    const leads = leadStorage.getAll()
    leads.push(lead)
    storage.set(STORAGE_KEYS.LEADS, leads)
  },

  update: (id: string, updatedLead: Partial<LeadDetails>): void => {
    const leads = leadStorage.getAll()
    const index = leads.findIndex((lead) => lead.id === id)
    if (index !== -1) {
      leads[index] = { ...leads[index], ...updatedLead }
      storage.set(STORAGE_KEYS.LEADS, leads)
    }
  },

  delete: (id: string): void => {
    const leads = leadStorage.getAll()
    const filtered = leads.filter((lead) => lead.id !== id)
    storage.set(STORAGE_KEYS.LEADS, filtered)
  },
}

// Follow-up History Management
export const followUpStorage = {
  getAll: (): FollowUpHistory[] => {
    return storage.get<FollowUpHistory[]>(STORAGE_KEYS.FOLLOW_UPS) || []
  },

  getByLeadNo: (leadNo: string): FollowUpHistory[] => {
    const followUps = followUpStorage.getAll()
    return followUps.filter((fu) => fu.leadNo === leadNo)
  },

  add: (followUp: FollowUpHistory): void => {
    const followUps = followUpStorage.getAll()
    followUps.push(followUp)
    storage.set(STORAGE_KEYS.FOLLOW_UPS, followUps)
  },
}

// Enquiry Management
export const enquiryStorage = {
  getAll: (): Enquiry[] => {
    return storage.get<Enquiry[]>(STORAGE_KEYS.ENQUIRIES) || []
  },

  getById: (id: string): Enquiry | null => {
    const enquiries = enquiryStorage.getAll()
    return enquiries.find((enq) => enq.id === id) || null
  },

  add: (enquiry: Enquiry): void => {
    const enquiries = enquiryStorage.getAll()
    enquiries.push(enquiry)
    storage.set(STORAGE_KEYS.ENQUIRIES, enquiries)
  },

  update: (id: string, updatedEnquiry: Partial<Enquiry>): void => {
    const enquiries = enquiryStorage.getAll()
    const index = enquiries.findIndex((enq) => enq.id === id)
    if (index !== -1) {
      enquiries[index] = { ...enquiries[index], ...updatedEnquiry }
      storage.set(STORAGE_KEYS.ENQUIRIES, enquiries)
    }
  },

  delete: (id: string): void => {
    const enquiries = enquiryStorage.getAll()
    const filtered = enquiries.filter((enq) => enq.id !== id)
    storage.set(STORAGE_KEYS.ENQUIRIES, filtered)
  },
}

// User Management
export const userStorage = {
  get: (): User | null => {
    return storage.get<User>(STORAGE_KEYS.USER)
  },

  set: (user: User): void => {
    storage.set(STORAGE_KEYS.USER, user)
  },

  clear: (): void => {
    storage.remove(STORAGE_KEYS.USER)
  },
}

// Initialize with dummy data
export const initializeDummyData = (): void => {
  // Check if data already exists
  if (leadStorage.getAll().length > 0) return

  // Dummy Leads
  const dummyLeads: LeadDetails[] = [
    {
      id: '1',
      timestamp: new Date('2025-01-15T10:30:00').toISOString(),
      leadNo: 'LD001',
      leadReceivedName: 'John Doe',
      leadSource: 'Website',
      companyName: 'ABC Healthcare',
      phoneNumber: '+1234567890',
      personName: 'John Doe',
      location: 'New York',
      emailAddress: 'john@abchealthcare.com',
      state: 'NY',
      address: '123 Main St, New York, NY 10001',
      nob: 'Healthcare Services',
      remarks: 'Interested in bulk orders',
      planned: '2025-01-16',
      actual: '2025-01-16',
      timeDelay: '0 days',
      leadStatus: 'follow-up',
      nextFollowupDate: '2025-01-20',
      whatDidCustomerSay: 'Will review proposal and get back',
      planned1: '2025-01-20',
      actual1: '',
      timeDelay1: '',
      status1: 'pending',
    },
    {
      id: '2',
      timestamp: new Date('2025-01-14T14:20:00').toISOString(),
      leadNo: 'LD002',
      leadReceivedName: 'Sarah Smith',
      leadSource: 'Referral',
      companyName: 'XYZ Medical Center',
      phoneNumber: '+1234567891',
      personName: 'Sarah Smith',
      location: 'Los Angeles',
      emailAddress: 'sarah@xyzmedical.com',
      state: 'CA',
      address: '456 Oak Ave, Los Angeles, CA 90001',
      nob: 'Medical Equipment',
      remarks: 'Urgent requirement',
      planned: '2025-01-15',
      actual: '2025-01-15',
      timeDelay: '0 days',
      leadStatus: 'received',
      nextFollowupDate: '',
      whatDidCustomerSay: 'Confirmed order placement',
      planned1: '',
      actual1: '',
      timeDelay1: '',
      status1: 'completed',
    },
    {
      id: '3',
      timestamp: new Date('2025-01-13T09:15:00').toISOString(),
      leadNo: 'LD003',
      leadReceivedName: 'Mike Johnson',
      leadSource: 'Cold Call',
      companyName: 'Health Plus Clinic',
      phoneNumber: '+1234567892',
      personName: 'Mike Johnson',
      location: 'Chicago',
      emailAddress: 'mike@healthplus.com',
      state: 'IL',
      address: '789 Pine Rd, Chicago, IL 60601',
      nob: 'Clinic Services',
      remarks: 'Budget constraints',
      planned: '2025-01-14',
      actual: '2025-01-14',
      timeDelay: '0 days',
      leadStatus: 'cancelled',
      nextFollowupDate: '',
      whatDidCustomerSay: 'Not interested at this time',
      planned1: '',
      actual1: '',
      timeDelay1: '',
      status1: 'cancelled',
    },
  ]

  // Dummy Follow-ups
  const dummyFollowUps: FollowUpHistory[] = [
    {
      id: '1',
      timestamp: new Date('2025-01-16T11:00:00').toISOString(),
      leadNo: 'LD001',
      leadStatus: 'follow-up',
      nextFollowupDate: '2025-01-20',
      whatDidCustomerSay: 'Will review proposal and get back',
    },
    {
      id: '2',
      timestamp: new Date('2025-01-15T15:30:00').toISOString(),
      leadNo: 'LD002',
      leadStatus: 'received',
      nextFollowupDate: '',
      whatDidCustomerSay: 'Confirmed order placement',
    },
  ]

  // Dummy Enquiries
  const dummyEnquiries: Enquiry[] = [
    {
      id: '1',
      timestamp: new Date('2025-01-15T13:45:00').toISOString(),
      directNoOrLeadNo: 'LD001',
      receivedType: 'lead',
      personName: 'John Doe',
      totalPatient: 3,
      patientName: 'Patient A, Patient B, Patient C',
      patientPhoneNumber: '+1234567890',
      patientAddress: '123 Main St, New York, NY 10001',
    },
    {
      id: '2',
      timestamp: new Date('2025-01-14T16:20:00').toISOString(),
      directNoOrLeadNo: 'DIR001',
      receivedType: 'direct',
      personName: 'Jane Williams',
      totalPatient: 1,
      patientName: 'Patient D',
      patientPhoneNumber: '+1234567893',
      patientAddress: '321 Elm St, Boston, MA 02101',
    },
  ]

  // Save dummy data
  storage.set(STORAGE_KEYS.LEADS, dummyLeads)
  storage.set(STORAGE_KEYS.FOLLOW_UPS, dummyFollowUps)
  storage.set(STORAGE_KEYS.ENQUIRIES, dummyEnquiries)
}
