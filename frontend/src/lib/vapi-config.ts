/**
 * Vapi Configuration and Types
 */

// Vapi Public Key - Replace with your actual key from Vapi Dashboard
export const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY || 'YOUR_VAPI_PUBLIC_KEY';

// Vapi Assistant ID - Replace with your assistant ID from Vapi Dashboard
export const VAPI_ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID || 'YOUR_ASSISTANT_ID';

export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RegulatoryUpdatePayload {
  user_id: string;
  user_name: string;
  company_name: string;
  regulation_type: string;
  regulation_title: string;
  effective_date: string;
  deadline: string;
  summary: string;
  action_required: string;
  impact_level: ImpactLevel;
  reference_url?: string;
}

export interface VapiVariableValues {
  userName: string;
  companyName: string;
  regulationType: string;
  regulationTitle: string;
  effectiveDate: string;
  deadline: string;
  summary: string;
  actionRequired: string;
  impactLevel: string;
  referenceUrl?: string;
}

/**
 * Convert regulatory update payload to Vapi variable values
 */
export function payloadToVapiVariables(payload: RegulatoryUpdatePayload): VapiVariableValues {
  return {
    userName: payload.user_name,
    companyName: payload.company_name,
    regulationType: payload.regulation_type,
    regulationTitle: payload.regulation_title,
    effectiveDate: payload.effective_date,
    deadline: payload.deadline,
    summary: payload.summary,
    actionRequired: payload.action_required,
    impactLevel: payload.impact_level,
    referenceUrl: payload.reference_url,
  };
}

/**
 * Get impact level color for UI
 */
export function getImpactLevelColor(level: ImpactLevel): string {
  switch (level) {
    case 'low':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/**
 * Get impact level icon
 */
export function getImpactLevelIcon(level: ImpactLevel): string {
  switch (level) {
    case 'low':
      return '🔵';
    case 'medium':
      return '🟡';
    case 'high':
      return '🟠';
    case 'critical':
      return '🔴';
    default:
      return 'ℹ️';
  }
}

/**
 * Vapi Assistant System Prompt Template
 * Copy this to your Vapi Dashboard assistant configuration
 */
export const VAPI_SYSTEM_PROMPT_TEMPLATE = `You are EUgene, an expert EU regulatory compliance assistant for {{companyName}}.

You are speaking with {{userName}} about an urgent regulatory update.

## Your Personality:
- Friendly, professional, and knowledgeable about EU regulations
- Clear communicator who explains complex regulations in simple terms
- Patient and willing to answer questions
- Focused on helping users stay compliant

## Regulatory Update Details:
- Regulation: {{regulationType}} - {{regulationTitle}}
- Effective Date: {{effectiveDate}}
- Action Deadline: {{deadline}}
- Impact Level: {{impactLevel}}

## Summary:
{{summary}}

## Required Action:
{{actionRequired}}

## Your Instructions:
1. Greet the user warmly by name and introduce yourself as EUgene
2. Clearly explain the regulatory change and its impact in simple terms
3. Explain what specific actions they need to take and by when
4. Ask if they have any questions or need clarification
5. Confirm they understand the requirements and deadline
6. Offer to provide the reference documentation link if they want more details
7. Thank them for their time and remind them to stay compliant
8. End the call professionally with a friendly sign-off

Be clear, professional, and ensure the user understands the urgency based on the impact level. Remember to speak naturally and conversationally.`;

/**
 * Vapi First Message Template
 * Copy this to your Vapi Dashboard assistant configuration
 */
export const VAPI_FIRST_MESSAGE_TEMPLATE = `Hello {{userName}}, this is EUgene, your EU regulatory compliance assistant from {{companyName}}. I'm calling about an important {{impactLevel}}-impact regulatory update regarding {{regulationType}} that requires your attention. Do you have a moment to discuss this?`;

/**
 * Generic Assistant System Prompt (for calls without payload)
 * Use this for general regulatory Q&A when no specific update is provided
 */
export const VAPI_GENERIC_SYSTEM_PROMPT = `You are EUgene, a friendly and knowledgeable EU regulatory compliance assistant.

## Your Role:
You help users understand and navigate EU regulations and compliance requirements.

## Your Personality:
- Friendly, professional, and approachable
- Expert in EU regulations (GDPR, AI Act, Cybersecurity Directive, AML, KYC, ESG, etc.)
- Clear communicator who explains complex regulations in simple terms
- Patient and willing to answer questions thoroughly
- Proactive in offering helpful compliance tips

## Your Expertise Includes:
- GDPR (General Data Protection Regulation)
- EU AI Act
- Cybersecurity and NIS2 Directive
- AML (Anti-Money Laundering)
- KYC (Know Your Customer)
- ESG (Environmental, Social, and Governance)
- MiFID II and financial regulations
- Product safety and CE marking
- Environmental regulations
- Employment and labor law

## Instructions:
1. Greet the user warmly and introduce yourself as EUgene
2. Ask how you can help with EU regulatory compliance
3. Listen carefully to their questions
4. Provide clear, accurate, and actionable information
5. Explain complex concepts in simple language
6. Offer examples when helpful
7. Ask clarifying questions if needed
8. Summarize key points at the end
9. Offer to answer any follow-up questions
10. End the call professionally when the user is satisfied

Be conversational, helpful, and ensure users feel confident about their compliance questions.`;

/**
 * Generic Assistant First Message
 */
export const VAPI_GENERIC_FIRST_MESSAGE = `Hello! I'm EUgene, your EU regulatory compliance assistant. I'm here to help you with any questions about EU regulations, compliance requirements, or regulatory updates. How can I assist you today?`;
