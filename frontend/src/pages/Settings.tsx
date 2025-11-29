import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Mail, Phone, MessageSquare, Save, Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { apiClient, CompanyProfile, NotificationContact } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";

// Available regulatory topics (matching backend enum)
const REGULATORY_TOPICS = [
  "AI Act",
  "BaFin",
  "Cybersecurity",
  "GDPR",
  "AMLR",
  "ESG",
] as const;

export default function Settings() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<NotificationContact[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [companyProfiles, setCompanyProfiles] = useState<CompanyProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch user's data on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch company profiles
        const profilesResult = await apiClient.listCompanies({ user_id: user.id });

        if (profilesResult.success && profilesResult.data.length > 0) {
          setCompanyProfiles(profilesResult.data);

          // Aggregate all regulatory topics from all company profiles
          const allTopics = new Set<string>();
          profilesResult.data.forEach(profile => {
            profile.regulatory_topics?.forEach(topic => allTopics.add(topic));
          });

          setSelectedTopics(Array.from(allTopics));
        }

        // Fetch notification contacts
        const contactsResult = await apiClient.listUserContacts(user.id, true);

        if (contactsResult.success) {
          setContacts(contactsResult.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleContactUpdate = (id: string, field: keyof NotificationContact, value: any) => {
    setContacts(prev =>
      prev.map(contact =>
        contact.id === id ? { ...contact, [field]: value } : contact
      )
    );
  };

  const handleChannelToggle = (id: string, channel: 'email' | 'sms' | 'calls') => {
    setContacts(prev =>
      prev.map(contact => {
        if (contact.id === id) {
          const fieldName = `channel_${channel}` as 'channel_email' | 'channel_sms' | 'channel_calls';
          return { ...contact, [fieldName]: !contact[fieldName] };
        }
        return contact;
      })
    );
  };

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setIsSaving(true);

    try {
      // Save topics to company profiles
      if (companyProfiles.length > 0) {
        // Update the first company profile with selected topics
        // (You can modify this logic if you want to update all profiles or handle differently)
        const profileToUpdate = companyProfiles[0];
        
        await apiClient.updateCompanyProfile(profileToUpdate.id!, {
          regulatory_topics: selectedTopics,
        });
      }

      // Save all contact updates
      const updatePromises = contacts
        .filter(contact => contact.id) // Only update existing contacts
        .map(contact => {
          if (!contact.id) return Promise.resolve();

          return apiClient.updateContact(contact.id, {
            name: contact.name,
            role: contact.role,
            email: contact.email,
            phone: contact.phone,
            channel_email: contact.channel_email,
            channel_sms: contact.channel_sms,
            channel_calls: contact.channel_calls,
            frequency: contact.frequency,
            high_impact_only: contact.high_impact_only,
          });
        });

      // Create new contacts (those without IDs)
      const createPromises = contacts
        .filter(contact => !contact.id && contact.email) // New contacts with email
        .map(contact =>
          apiClient.createContact(user.id, {
            name: contact.name,
            role: contact.role,
            email: contact.email,
            phone: contact.phone,
            channel_email: contact.channel_email,
            channel_sms: contact.channel_sms,
            channel_calls: contact.channel_calls,
            frequency: contact.frequency,
            high_impact_only: contact.high_impact_only,
          })
        );

      await Promise.all([...updatePromises, ...createPromises]);

      toast.success("Settings saved successfully");

      // Refresh contacts
      const contactsResult = await apiClient.listUserContacts(user.id, true);
      if (contactsResult.success) {
        setContacts(contactsResult.data);
      }

      // Refresh company profiles
      const profilesResult = await apiClient.listCompanies({ user_id: user.id });
      if (profilesResult.success && profilesResult.data.length > 0) {
        setCompanyProfiles(profilesResult.data);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddContact = () => {
    if (!user) return;

    const newContact: NotificationContact = {
      user_id: user.id,
      name: "",
      role: "",
      email: "",
      phone: "",
      channel_email: true,
      channel_sms: false,
      channel_calls: false,
      frequency: "daily",
      high_impact_only: false,
    };
    setContacts(prev => [...prev, newContact]);
  };

  const handleRemoveContact = async (id?: string) => {
    if (!id) {
      // Remove unsaved contact (no ID)
      setContacts(prev => prev.filter(contact => contact.id !== undefined));
      return;
    }

    try {
      await apiClient.deleteContact(id);
      setContacts(prev => prev.filter(contact => contact.id !== id));
      toast.success("Contact deleted");
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-lg font-semibold text-foreground mb-6">Settings</h1>

        {companyProfiles.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold mb-1">Company Profiles</h3>
            <div className="space-y-1">
              {companyProfiles.map((profile, idx) => (
                <p key={idx} className="text-xs text-muted-foreground">
                  {profile.company_name} {profile.industry && `• ${profile.industry}`}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Topics */}
          <section>
            <h2 className="text-sm font-medium text-foreground mb-3">Regulatory Topics</h2>
            <p className="text-xs text-muted-foreground mb-3">
              Topics you're tracking based on your company profile{companyProfiles.length > 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {REGULATORY_TOPICS.map((topic) => {
                const isSelected = selectedTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    onClick={() => handleTopicToggle(topic)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-colors",
                      isSelected
                        ? "border-foreground bg-secondary"
                        : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center",
                      isSelected ? "bg-foreground border-foreground" : "border-muted-foreground"
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-background" />}
                    </div>
                    <span className="text-foreground">{topic}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Contacts */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-foreground">Notification Contacts</h2>
              <Button onClick={handleAddContact} variant="ghost" size="sm" className="gap-1">
                <Plus className="w-3 h-3" />
                Add
              </Button>
            </div>

            <div className="space-y-3">
              {contacts.map((contact, idx) => (
                <div key={contact.id || `new-${idx}`} className="p-4 rounded-lg border border-border">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Input
                      value={contact.name}
                      onChange={(e) => handleContactUpdate(contact.id!, 'name', e.target.value)}
                      placeholder="Name"
                    />
                    <Input
                      value={contact.role || ""}
                      onChange={(e) => handleContactUpdate(contact.id!, 'role', e.target.value)}
                      placeholder="Role"
                    />
                    <Input
                      type="email"
                      value={contact.email}
                      onChange={(e) => handleContactUpdate(contact.id!, 'email', e.target.value)}
                      placeholder="Email"
                    />
                    <Input
                      type="tel"
                      value={contact.phone || ""}
                      onChange={(e) => handleContactUpdate(contact.id!, 'phone', e.target.value)}
                      placeholder="Phone"
                    />
                  </div>

                  {/* Channels */}
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-xs text-muted-foreground">Channels:</span>
                    {[
                      { key: 'email' as const, icon: Mail, label: 'Email' },
                      { key: 'sms' as const, icon: MessageSquare, label: 'SMS' },
                      { key: 'calls' as const, icon: Phone, label: 'Calls' },
                    ].map((channel) => {
                      const fieldName = `channel_${channel.key}` as 'channel_email' | 'channel_sms' | 'channel_calls';
                      return (
                        <button
                          key={channel.key}
                          onClick={() => handleChannelToggle(contact.id!, channel.key)}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
                            contact[fieldName]
                              ? "bg-foreground text-background"
                              : "bg-secondary text-muted-foreground"
                          )}
                        >
                          <channel.icon className="w-3 h-3" />
                          {channel.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Options */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <select
                        value={contact.frequency}
                        onChange={(e) => handleContactUpdate(contact.id!, 'frequency', e.target.value as 'realtime' | 'daily' | 'weekly')}
                        className="px-2 py-1 rounded bg-secondary border-0 text-xs text-foreground"
                      >
                        <option value="realtime">Real-time</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>

                      <button
                        onClick={() => handleContactUpdate(contact.id!, 'high_impact_only', !contact.high_impact_only)}
                        className={cn(
                          "px-2 py-1 rounded text-xs transition-colors",
                          contact.high_impact_only
                            ? "bg-red-50 text-red-700"
                            : "bg-secondary text-muted-foreground"
                        )}
                      >
                        High impact only
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveContact(contact.id)}
                      className="p-1 text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Save */}
          <Button onClick={handleSave} className="w-full gap-2" disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
