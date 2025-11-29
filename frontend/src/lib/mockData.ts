export interface Company {
  id: string;
  name: string;
  website: string;
  sector: string;
  description: string;
  keywords: string[];
  topics: string[];
}

export interface RegulatoryItem {
  id: string;
  title: string;
  type: 'meeting' | 'proposal' | 'regulation';
  date: string;
  summary: string;
  impact: 'high' | 'medium' | 'low';
  status: 'backlog' | 'in-review' | 'action-needed' | 'done';
  topics: string[];
  source: string;
  legislativeStatus?: string;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  channels: {
    email: boolean;
    sms: boolean;
    calls: boolean;
  };
  frequency: 'realtime' | 'daily' | 'weekly';
  highImpactOnly: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const availableTopics = [
  { id: 'ai-act', name: 'AI Act', description: 'Artificial Intelligence regulations' },
  { id: 'bafin', name: 'BaFin', description: 'Federal Financial Supervisory Authority' },
  { id: 'cybersecurity', name: 'Cybersecurity', description: 'NIS2 and cyber regulations' },
  { id: 'gdpr', name: 'GDPR', description: 'General Data Protection Regulation' },
  { id: 'amlr', name: 'AMLR', description: 'Anti-Money Laundering Regulations' },
  { id: 'esg', name: 'ESG', description: 'Environmental, Social, Governance' },
  // Additional topics
  { id: 'mica', name: 'MiCA', description: 'Markets in Crypto-Assets' },
  { id: 'dma', name: 'DMA', description: 'Digital Markets Act' },
  { id: 'dsa', name: 'DSA', description: 'Digital Services Act' },
  { id: 'health-data', name: 'Health Data', description: 'European Health Data Space' },
  { id: 'fintech', name: 'Fintech', description: 'Financial technology regulations' },
  { id: 'ecommerce', name: 'E-Commerce', description: 'Digital commerce regulations' },
];

export const mockCompany: Company = {
  id: '1',
  name: 'TechVenture AI',
  website: 'https://techventure.ai',
  sector: 'AI & Machine Learning',
  description: 'AI-powered healthcare diagnostics platform using machine learning for early disease detection.',
  keywords: ['AI', 'healthcare', 'diagnostics', 'machine learning', 'medtech'],
  topics: ['ai-act', 'gdpr', 'health-data'],
};

export const mockRegulatoryItems: RegulatoryItem[] = [
  {
    id: '1',
    title: 'AI Act Implementation Guidelines Published',
    type: 'regulation',
    date: '2024-02-15',
    summary: 'The European Commission has published detailed implementation guidelines for the AI Act, clarifying requirements for high-risk AI systems in healthcare.',
    impact: 'high',
    status: 'action-needed',
    topics: ['ai-act'],
    source: 'https://ec.europa.eu/ai-act',
  },
  {
    id: '2',
    title: 'European Parliament Vote on Health Data Space',
    type: 'meeting',
    date: '2024-02-20',
    summary: 'Upcoming vote on the European Health Data Space regulation that will affect how health data can be processed and shared across borders.',
    impact: 'high',
    status: 'in-review',
    topics: ['health-data', 'gdpr'],
    source: 'https://europarl.europa.eu',
  },
  {
    id: '3',
    title: 'GDPR Enforcement Update Q1 2024',
    type: 'meeting',
    date: '2024-01-30',
    summary: 'European Data Protection Board meeting to discuss enforcement priorities and new guidance on AI and data processing.',
    impact: 'medium',
    status: 'done',
    topics: ['gdpr', 'ai-act'],
    source: 'https://edpb.europa.eu',
  },
  {
    id: '4',
    title: 'AI Liability Directive Proposal',
    type: 'proposal',
    date: '2024-03-01',
    summary: 'New proposal addressing liability rules for AI systems, particularly relevant for healthcare AI applications.',
    impact: 'medium',
    status: 'backlog',
    topics: ['ai-act'],
    source: 'https://ec.europa.eu',
  },
  {
    id: '5',
    title: 'Medical Device Regulation AI Addendum',
    type: 'regulation',
    date: '2024-02-10',
    summary: 'Technical specifications for AI-powered medical devices under the MDR framework.',
    impact: 'high',
    status: 'action-needed',
    topics: ['ai-act', 'health-data'],
    source: 'https://ec.europa.eu/health',
  },
  {
    id: '6',
    title: 'Cross-border Health Data Transfer Guidelines',
    type: 'proposal',
    date: '2024-02-25',
    summary: 'Draft guidelines for secure health data transfers between EU member states.',
    impact: 'low',
    status: 'in-review',
    topics: ['health-data', 'gdpr'],
    source: 'https://ec.europa.eu',
  },
];

export const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Chief Compliance Officer',
    email: 'sarah.chen@techventure.ai',
    phone: '+49 123 456 7890',
    channels: { email: true, sms: true, calls: false },
    frequency: 'realtime',
    highImpactOnly: false,
  },
  {
    id: '2',
    name: 'Michael Weber',
    role: 'CEO',
    email: 'michael.weber@techventure.ai',
    phone: '+49 123 456 7891',
    channels: { email: true, sms: false, calls: true },
    frequency: 'daily',
    highImpactOnly: true,
  },
  {
    id: '3',
    name: 'Dr. Anna Schmidt',
    role: 'Head of Regulatory Affairs',
    email: 'anna.schmidt@techventure.ai',
    phone: '+49 123 456 7892',
    channels: { email: true, sms: true, calls: true },
    frequency: 'realtime',
    highImpactOnly: false,
  },
];
