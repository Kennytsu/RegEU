import { cn } from "@/lib/utils";
import { availableTopics } from "@/lib/mockData";
import { topicToId } from "@/lib/topicUtils";

interface TopicBadgeProps {
  topicId: string;
  className?: string;
}

export function TopicBadge({ topicId, className }: TopicBadgeProps) {
  // Try direct match first, then try converting topic name to ID
  let topic = availableTopics.find(t => t.id === topicId || t.name === topicId);
  
  // If no match, try converting the topic name to an ID
  if (!topic && topicId) {
    const convertedId = topicToId(topicId);
    topic = availableTopics.find(t => t.id === convertedId);
  }
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-muted-foreground",
        className
      )}
    >
      {topic?.name || topicId}
    </span>
  );
}
