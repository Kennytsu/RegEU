import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook to fetch the user's selected regulatory topics from their company profiles
 */
export function useUserTopics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user_topics", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const profilesResult = await apiClient.listCompanies({ user_id: user.id });

      if (profilesResult.success && profilesResult.data.length > 0) {
        // Aggregate all regulatory topics from all company profiles
        const allTopics = new Set<string>();
        profilesResult.data.forEach(profile => {
          profile.regulatory_topics?.forEach(topic => allTopics.add(topic));
        });

        return Array.from(allTopics);
      }

      return [];
    },
    enabled: !!user, // Only run query if user is logged in
  });
}

