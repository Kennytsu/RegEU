import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Vapi from '@vapi-ai/web';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient, RegulatoryUpdatePayload } from '@/lib/api-client';
import {
  VAPI_PUBLIC_KEY,
  VAPI_ASSISTANT_ID,
  payloadToVapiVariables,
  getImpactLevelColor,
  getImpactLevelIcon,
} from '@/lib/vapi-config';
import euStars from '@/assets/eu-stars.png';

type CallStatus = 'idle' | 'loading' | 'connecting' | 'connected' | 'ended' | 'error';

export default function VoiceCall() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [payload, setPayload] = useState<RegulatoryUpdatePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);

  const vapiRef = useRef<Vapi | null>(null);

  // Fetch payload on mount (if token provided)
  useEffect(() => {
    if (!token) {
      // No token - use generic assistant mode
      setCallStatus('idle');
      return;
    }

    const fetchPayload = async () => {
      setCallStatus('loading');
      try {
        const response = await apiClient.getVoiceCallPayload(token);

        if (response.success && response.payload) {
          setPayload(response.payload);
          setCallStatus('idle');
        } else {
          setError(response.error || 'Failed to load call information');
          setCallStatus('error');
        }
      } catch (err) {
        console.error('Error fetching payload:', err);
        setError('Failed to load call information');
        setCallStatus('error');
      }
    };

    fetchPayload();
  }, [token]);

  // Initialize Vapi
  useEffect(() => {
    if (!VAPI_PUBLIC_KEY || VAPI_PUBLIC_KEY === 'YOUR_VAPI_PUBLIC_KEY') {
      console.error('Vapi Public Key not configured');
      setError('Voice call service not configured. Please contact support.');
      setCallStatus('error');
      return;
    }

    const vapi = new Vapi(VAPI_PUBLIC_KEY);
    vapiRef.current = vapi;

    // Set up event listeners
    vapi.on('call-start', () => {
      console.log('Call started');
      setCallStatus('connected');
    });

    vapi.on('call-end', () => {
      console.log('Call ended');
      setCallStatus('ended');
    });

    vapi.on('speech-start', () => {
      console.log('Agent started speaking');
      setIsAgentSpeaking(true);
    });

    vapi.on('speech-end', () => {
      console.log('Agent stopped speaking');
      setIsAgentSpeaking(false);
    });

    vapi.on('error', (error) => {
      console.error('Vapi error:', error);
      setError('Call error occurred');
      setCallStatus('error');
    });

    return () => {
      // Cleanup: end call if component unmounts
      if (vapi) {
        vapi.stop();
      }
    };
  }, []);

  const startCall = async () => {
    if (!vapiRef.current) return;

    if (!VAPI_ASSISTANT_ID || VAPI_ASSISTANT_ID === 'YOUR_ASSISTANT_ID') {
      setError('Voice assistant not configured. Please contact support.');
      setCallStatus('error');
      return;
    }

    setCallStatus('connecting');
    setError(null);

    try {
      if (payload) {
        // Personalized mode with regulatory update
        const variableValues = payloadToVapiVariables(payload);
        await vapiRef.current.start(VAPI_ASSISTANT_ID, {
          variableValues,
        });
      } else {
        // Generic assistant mode - just start the call without variables
        await vapiRef.current.start(VAPI_ASSISTANT_ID);
      }
    } catch (err) {
      console.error('Error starting call:', err);
      setError('Failed to start call. Please try again.');
      setCallStatus('error');
    }
  };

  const endCall = () => {
    if (!vapiRef.current) return;

    vapiRef.current.stop();
    setCallStatus('ended');
  };

  // Render error state
  if (callStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Call Unavailable</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.location.href = '/'} variant="outline">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  // Render loading state
  if (callStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading call information...</p>
        </div>
      </div>
    );
  }

  // Render UI for both modes
  const hasPayload = !!payload;
  const impactColorClass = hasPayload ? getImpactLevelColor(payload.impact_level) : '';
  const impactIcon = hasPayload ? getImpactLevelIcon(payload.impact_level) : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <img src={euStars} alt="EUgene" className="w-10 h-10" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">EUgene Call</h1>
              <p className="text-sm text-gray-500">Your EU Regulatory Assistant</p>
            </div>
          </div>

          {/* Call Information - Show different content based on mode */}
          {hasPayload ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Calling:</p>
                <p className="text-lg font-medium text-gray-900">{payload.user_name}</p>
              </div>

              <div className={`p-4 rounded-lg border ${impactColorClass}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{impactIcon}</span>
                  <p className="font-semibold capitalize">{payload.impact_level} Impact</p>
                </div>
                <p className="text-sm font-medium">
                  {payload.regulation_type} - {payload.regulation_title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Effective Date</p>
                  <p className="font-medium">{new Date(payload.effective_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Action Deadline</p>
                  <p className="font-medium">{new Date(payload.deadline).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Summary:</p>
                <p className="text-sm text-gray-700">{payload.summary}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-6 rounded-lg bg-blue-50 border border-blue-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  General EU Regulatory Assistant
                </h2>
                <p className="text-sm text-gray-700">
                  I'm EUgene, your AI assistant for EU regulatory compliance.
                  I can help you understand regulations like GDPR, AI Act, Cybersecurity,
                  AML, KYC, ESG, and more. Ask me anything about EU compliance!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Call Controls */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            {callStatus === 'idle' && (
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <img src={euStars} alt="EUgene" className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">EUgene</p>
                      <p className="text-sm text-gray-500">EU Regulatory Expert</p>
                    </div>
                  </div>
                  <p className="text-gray-600">
                    {hasPayload ? (
                      <>
                        Hi {payload.user_name}! I'm EUgene, your EU regulatory assistant.
                        Click the button below to start a voice call where I'll explain this regulatory update
                        and answer any questions you may have.
                      </>
                    ) : (
                      <>
                        Hi! I'm EUgene, your EU regulatory assistant.
                        Click the button below to start a voice call and ask me anything about
                        EU regulations, compliance requirements, or regulatory updates.
                      </>
                    )}
                  </p>
                </div>
                <Button onClick={startCall} size="lg" className="gap-2">
                  <Phone className="w-5 h-5" />
                  Talk to EUgene
                </Button>
              </div>
            )}

            {callStatus === 'connecting' && (
              <div>
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <img src={euStars} alt="EUgene" className="w-10 h-10" />
                </div>
                <p className="text-gray-600 mb-4">Connecting to EUgene...</p>
                <Button onClick={endCall} variant="outline" size="sm" className="gap-2">
                  <PhoneOff className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            )}

            {callStatus === 'connected' && (
              <div>
                <div className="relative inline-block mb-6">
                  <div className={`w-28 h-28 rounded-full bg-blue-600 flex items-center justify-center ${isAgentSpeaking ? 'animate-pulse shadow-lg shadow-blue-400' : ''}`}>
                    <img src={euStars} alt="EUgene" className="w-16 h-16" />
                  </div>
                  {isAgentSpeaking && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      EUgene is speaking...
                    </div>
                  )}
                </div>
                <p className="text-lg font-medium text-gray-900 mb-1">Connected to EUgene</p>
                <p className="text-sm text-gray-500 mb-6">
                  {isAgentSpeaking ? '🎤 Speaking...' : '👂 Listening...'}
                </p>
                <Button onClick={endCall} variant="destructive" size="lg" className="gap-2">
                  <PhoneOff className="w-5 h-5" />
                  End Call
                </Button>
              </div>
            )}

            {callStatus === 'ended' && (
              <div>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <img src={euStars} alt="EUgene" className="w-12 h-12" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">Call Ended</p>
                <p className="text-gray-600 mb-1">
                  Thank you for speaking with EUgene!
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Stay informed, stay compliant.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={startCall} variant="outline">
                    Talk to EUgene Again
                  </Button>
                  <Button onClick={() => window.location.href = '/dashboard'}>
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reference Link */}
        {hasPayload && payload.reference_url && (
          <div className="mt-6 text-center">
            <a
              href={payload.reference_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              View Full Documentation →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
