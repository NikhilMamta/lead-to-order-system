// Lead Details Types
export interface LeadDetails {
  id: string
  timestamp: string
  leadNo: string
  leadReceivedName: string
  leadSource: string
  companyName: string
  phoneNumber: string
  personName: string
  location: string
  emailAddress: string
  state: string
  address: string
  nob: string // Nature of Business
  remarks: string
  planned: string
  actual: string
  timeDelay: string
  leadStatus: 'follow-up' | 'received' | 'cancelled'
  nextFollowupDate: string
  whatDidCustomerSay: string
  planned1: string
  actual1: string
  timeDelay1: string
  status1: string
}

// Follow-up History Types
export interface FollowUpHistory {
  id: string
  timestamp: string
  leadNo: string
  leadStatus: 'follow-up' | 'received' | 'cancelled'
  nextFollowupDate: string
  whatDidCustomerSay: string
}

// Enquiry Types
export interface Enquiry {
  id: string
  timestamp: string
  directNoOrLeadNo: string
  receivedType: 'direct' | 'lead'
  personName: string
  totalPatient: number
  patientName: string
  patientPhoneNumber: string
  patientAddress: string
}

// User Types
export interface User {
  id: string
  username: string
  email: string
}
