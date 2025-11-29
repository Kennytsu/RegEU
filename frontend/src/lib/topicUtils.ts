// Utility functions for mapping topics
export const REGULATORY_TOPICS = [
  "AI Act",
  "BaFin",
  "Cybersecurity",
  "GDPR",
  "AMLR",
  "ESG",
] as const;

// Map database subject strings to standardized regulatory topics
export function mapSubjectToTopic(subject: string): string | null {
  if (!subject) return null;
  
  const normalized = subject.trim().toLowerCase();
  
  // Check for AI Act
  if (normalized.includes('ai act') || normalized === 'ai-act' || normalized === 'ai_act') {
    return "AI Act";
  }
  
  // Check for BaFin
  if (normalized.includes('bafin')) {
    return "BaFin";
  }
  
  // Check for Cybersecurity
  if (normalized.includes('cybersecurity') || normalized.includes('cyber security') || 
      normalized.includes('cyber-security')) {
    return "Cybersecurity";
  }
  
  // Check for GDPR
  if (normalized.includes('gdpr') || normalized.includes('data protection') || 
      normalized.includes('privacy')) {
    return "GDPR";
  }
  
  // Check for AMLR (AML/KYC)
  if (normalized.includes('amlr') || normalized.includes('aml') || 
      normalized.includes('kyc') || normalized.includes('anti-money laundering') || 
      normalized.includes('know your customer')) {
    return "AMLR";
  }
  
  // Check for ESG
  if (normalized.includes('esg') || normalized.includes('environmental') || 
      normalized.includes('sustainability') || normalized.includes('climate')) {
    return "ESG";
  }

  return null;
}

// Filter and map subjects to standard topics
export function normalizeTopics(subjects: string[] = []): string[] {
  const mappedTopics = subjects
    .map(mapSubjectToTopic)
    .filter((topic): topic is string => topic !== null);
  
  // Remove duplicates
  return Array.from(new Set(mappedTopics));
}

// Convert topic to kebab-case ID for TopicBadge
export function topicToId(topic: string): string {
  const idMap: Record<string, string> = {
    "AI Act": "ai-act",
    "BaFin": "bafin",
    "Cybersecurity": "cybersecurity",
    "GDPR": "gdpr",
    "AMLR": "amlr",
    "ESG": "esg",
  };
  
  return idMap[topic] || topic.toLowerCase().replace(/\s+/g, '-');
}

