import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { TopicBadge } from "./TopicBadge";
import { 
  ExternalLink, 
  Users, 
  FileText, 
  Eye,
  MessageSquare,
  Bell,
  Calendar,
  Building,
  Tag
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { LegislativeFileItem } from "@/hooks/useMeetings";
import { Badge } from "@/components/ui/badge";

interface LegislativeDetailSheetProps {
  item: LegislativeFileItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LegislativeDetailSheet({
  item,
  open,
  onOpenChange,
}: LegislativeDetailSheetProps) {
  if (!item) return null;

  const hasDocuments = item.documents && item.documents.length > 0;
  const hasKeyEvents = item.keyEvents && item.keyEvents.length > 0;
  const hasKeyPlayers = item.keyPlayers && item.keyPlayers.length > 0;
  const hasSubjects = item.subjects && item.subjects.length > 0;
  const hasTopics = item.topics && item.topics.length > 0;

  const year = item.date ? new Date(item.date).getFullYear() : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
        {/* Sticky Header */}
        <SheetHeader className="p-5 pb-4 border-b border-border space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {item.legislativeStatus && (
              <StatusBadge status={item.legislativeStatus} />
            )}
            <Badge variant="secondary" className="font-mono text-[10px]">
              {item.id}
            </Badge>
            {year && (
              <Badge variant="outline" className="text-[10px]">
                {year}
              </Badge>
            )}
          </div>
          <SheetTitle className="text-base font-semibold leading-snug text-left">
            {item.title}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-5 space-y-5">
            {/* Quick Actions - Top for easy access */}
            <div className="flex gap-2 flex-wrap">
              {item.detailsLink && (
                <Button size="sm" asChild className="gap-1.5">
                  <a href={item.detailsLink} target="_blank" rel="noopener noreferrer">
                    <Eye className="w-3.5 h-3.5" />
                    View on EP
                  </a>
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-1.5" disabled>
                <MessageSquare className="w-3.5 h-3.5" />
                Ask AI
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" disabled>
                <Bell className="w-3.5 h-3.5" />
                Follow
              </Button>
            </div>

            {/* Overview Section */}
            <section className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Overview
              </h3>
              <div className="grid gap-2">
                <InfoRow 
                  icon={Calendar} 
                  label="Last Updated" 
                  value={new Date(item.date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })} 
                />
                {item.committee && (
                  <InfoRow icon={Building} label="Committee" value={item.committee} />
                )}
                {item.rapporteur && (
                  <InfoRow icon={Users} label="Rapporteur" value={item.rapporteur} />
                )}
              </div>
            </section>

            {/* Regulatory Topics */}
            {hasTopics && (
              <section className="space-y-3">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  Regulatory Topics
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {item.topics!.map((topic, idx) => (
                    <TopicBadge key={idx} topicId={topic} />
                  ))}
                </div>
              </section>
            )}

            {/* Subjects */}
            {hasSubjects && (
              <section className="space-y-3">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  Subjects
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {item.subjects!.map((subject, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs font-normal">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Accordion for expandable sections */}
            <Accordion type="multiple" className="space-y-2">
              {/* Key Events */}
              {hasKeyEvents && (
                <AccordionItem value="events" className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      Key Events
                      <Badge variant="secondary" className="ml-1 text-[10px]">
                        {item.keyEvents!.length}
                      </Badge>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="space-y-3 pt-1">
                      {item.keyEvents!.slice(0, 10).map((event, idx) => (
                        <div key={idx} className="group relative pl-4 before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-border">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <p className="text-sm text-foreground leading-snug">
                                {event.event}
                              </p>
                              {event.date && (
                                <p className="text-xs text-muted-foreground">
                                  {new Date(event.date).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>
                              )}
                            </div>
                            {(event.link || event.summary_link) && (
                              <a
                                href={event.summary_link || event.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Documents */}
              {hasDocuments && (
                <AccordionItem value="documents" className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      Documents
                      <Badge variant="secondary" className="ml-1 text-[10px]">
                        {item.documents!.length}
                      </Badge>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="space-y-1 pt-1">
                      {item.documents!.map((doc, idx) => {
                        const docLink = doc.link || doc.summary_link;
                        const docTitle = doc.title || doc.type || `Document ${idx + 1}`;
                        const hasValidLink = docLink && docLink !== "#" && docLink.startsWith('http');
                        
                        return hasValidLink ? (
                          <a
                            key={idx}
                            href={docLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2 -mx-2 rounded-md hover:bg-muted transition-colors group"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground truncate">
                                {docTitle}
                              </p>
                              {doc.date && (
                                <p className="text-xs text-muted-foreground">
                                  {new Date(doc.date).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>
                              )}
                            </div>
                            <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />
                          </a>
                        ) : (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 -mx-2 rounded-md text-muted-foreground"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">
                                {docTitle}
                              </p>
                              {doc.date && (
                                <p className="text-xs">
                                  {new Date(doc.date).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>
                              )}
                            </div>
                            <span className="text-xs ml-2 shrink-0">(No link)</span>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Key Players */}
              {hasKeyPlayers && (
                <AccordionItem value="players" className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      Key Players
                      <Badge variant="secondary" className="ml-1 text-[10px]">
                        {item.keyPlayers!.length}
                      </Badge>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="space-y-2 pt-1">
                      {item.keyPlayers!.map((player, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-2 -mx-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Building className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {player.institution || player.name}
                            </p>
                            {player.role && (
                              <p className="text-xs text-muted-foreground">{player.role}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 flex items-start justify-between gap-4">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground text-right">{value}</span>
      </div>
    </div>
  );
}
