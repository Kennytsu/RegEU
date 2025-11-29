import { RegulatoryItem } from "@/lib/mockData";
import { TopicBadge } from "./TopicBadge";
import { StatusBadge } from "./StatusBadge";
import { Calendar, ExternalLink, FileText, Users, Gavel } from "lucide-react";
import { cn } from "@/lib/utils";

interface RegulatoryCardProps {
  item: RegulatoryItem;
  compact?: boolean;
  className?: string;
  draggable?: boolean;
  onClick?: () => void;
}

const typeIcons = {
  meeting: Users,
  proposal: FileText,
  regulation: Gavel,
};

export function RegulatoryCard({ item, compact = false, className, draggable, onClick }: RegulatoryCardProps) {
  const TypeIcon = typeIcons[item.type];
  
  // Check if item has committee (from LegislativeFileItem)
  const committee = 'committee' in item ? (item as any).committee : null;

  return (
    <div
      className={cn(
        "group bg-card border border-border rounded-lg p-4 transition-all hover:border-muted-foreground/30",
        draggable && "cursor-grab active:cursor-grabbing",
        onClick && "cursor-pointer hover:bg-muted/50",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <TypeIcon className="w-3.5 h-3.5" />
          <span className="text-xs font-mono">{item.id}</span>
        </div>
      </div>

      <h3 className={cn(
        "font-medium text-foreground mb-2",
        compact ? "text-sm line-clamp-2" : "text-sm"
      )}>
        {item.title}
      </h3>

      {!compact && item.summary && !item.legislativeStatus && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {item.summary}
        </p>
      )}

      {/* Committee badge */}
      {committee && (
        <div className="mb-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {committee}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
        <Calendar className="w-3 h-3" />
        <span>{new Date(item.date).toLocaleDateString('en-EU', { 
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })}</span>
      </div>

      {/* Topic badges - show up to 3 */}
      {item.topics && item.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.topics.slice(0, compact ? 2 : 3).map((topic) => (
            <TopicBadge key={topic} topicId={topic} />
          ))}
          {item.topics.length > (compact ? 2 : 3) && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-muted-foreground">
              +{item.topics.length - (compact ? 2 : 3)} more
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex-1" />
        
        {!onClick && (
          <a
            href={item.source}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}