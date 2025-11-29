import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { RegulatoryCard } from "@/components/shared/RegulatoryCard";
import { useLegislativeFiles, LegislativeFileItem } from "@/hooks/useMeetings";
import { useUserTopics } from "@/hooks/useUserTopics";
import { LegislativeDetailSheet } from "@/components/shared/LegislativeDetailSheet";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { REGULATORY_TOPICS } from "@/lib/topicUtils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  ArrowUpDown, 
  Columns3, 
  ToggleLeft,
  Building2,
  Calendar,
  Tags
} from "lucide-react";

// Define board columns based on legislative stages
const columns = [
  { id: 'preparatory', label: 'Preparatory', statuses: ['Preparatory phase in Parliament'] },
  { id: 'committee', label: 'Committee', statuses: ['Awaiting committee decision'] },
  { id: 'first-reading', label: '1st Reading', statuses: ['Awaiting Parliament\'s position in 1st reading', 'Awaiting Council\'s 1st reading position'] },
  { id: 'second-reading', label: '2nd Reading', statuses: ['Awaiting Parliament 2nd reading'] },
  { id: 'vote', label: 'Vote/Plenary', statuses: ['Awaiting plenary debate/vote', 'Awaiting Parliament\'s vote'] },
  { id: 'final', label: 'Final Stage', statuses: ['Awaiting signature of act', 'Awaiting final decision', 'Procedure completed, awaiting publication in Official Journal'] },
  { id: 'completed', label: 'Completed', statuses: ['Procedure completed', 'Procedure completed - delegated act enters into force', 'Procedure lapsed or withdrawn', 'Procedure rejected'] },
];

type SortOption = 'title' | 'year' | 'lastpubdate' | 'committee' | 'topics';

export default function Board() {
  const { data: legislativeItems = [], isLoading } = useLegislativeFiles(2000); // Increased limit to fetch all data
  const { data: userTopics = [], isLoading: loadingUserTopics } = useUserTopics();
  const [items, setItems] = useState<LegislativeFileItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<LegislativeFileItem | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<LegislativeFileItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>('lastpubdate');
  const [selectedCommittees, setSelectedCommittees] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns.map(c => c.id));
  const [personalized, setPersonalized] = useState(false);

  useEffect(() => {
    if (legislativeItems.length > 0) {
      setItems(legislativeItems);
      // Debug: Log topics to see what we're working with
      console.log('Legislative items with topics:', legislativeItems.map(item => ({
        title: item.title.slice(0, 50),
        subjects: item.subjects,
        topics: item.topics
      })));
    }
  }, [legislativeItems]);

  // Handle personalized toggle - apply user's topics when enabled
  useEffect(() => {
    if (personalized && userTopics.length > 0) {
      setSelectedTopics(userTopics);
    } else if (!personalized) {
      setSelectedTopics([]);
    }
  }, [personalized, userTopics]);

  // Extract unique committees and years from data
  const { allCommittees, allYears } = useMemo(() => {
    const committees = new Set<string>();
    const years = new Set<string>();
    
    legislativeItems.forEach(item => {
      if (item.committee) committees.add(item.committee);
      if (item.date) {
        const year = new Date(item.date).getFullYear().toString();
        years.add(year);
      }
    });
    
    return {
      allCommittees: Array.from(committees).sort(),
      allYears: Array.from(years).sort((a, b) => parseInt(b) - parseInt(a))
    };
  }, [legislativeItems]);

  // Use standard regulatory topics instead of dynamic extraction
  const allTopics = Array.from(REGULATORY_TOPICS);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...items];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query) ||
        item.committee?.toLowerCase().includes(query)
      );
    }

    // Committee filter
    if (selectedCommittees.length > 0) {
      filtered = filtered.filter(item => 
        item.committee && selectedCommittees.includes(item.committee)
      );
    }

    // Year filter
    if (selectedYears.length > 0) {
      filtered = filtered.filter(item => {
        const year = new Date(item.date).getFullYear().toString();
        return selectedYears.includes(year);
      });
    }

    // Topics filter
    if (selectedTopics.length > 0) {
      filtered = filtered.filter(item => {
        // Use the normalized topics from the item
        const itemTopics = item.topics || [];
        return selectedTopics.some(topic => itemTopics.includes(topic));
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'year':
          return new Date(b.date).getFullYear() - new Date(a.date).getFullYear();
        case 'lastpubdate':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'committee':
          return (a.committee || '').localeCompare(b.committee || '');
        case 'topics':
          // Sort by first topic alphabetically
          const aTopic = a.topics?.[0] || '';
          const bTopic = b.topics?.[0] || '';
          return aTopic.localeCompare(bTopic);
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, searchQuery, selectedCommittees, selectedYears, selectedTopics, sortBy]);

  const getColumnItems = (statuses: string[]) => 
    filteredAndSortedItems.filter(item => 
      item.legislativeStatus && statuses.some(s => 
        item.legislativeStatus?.toLowerCase().includes(s.toLowerCase()) ||
        s.toLowerCase().includes(item.legislativeStatus?.toLowerCase() || '')
      )
    );

  const handleDragStart = (item: LegislativeFileItem) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (columnId: string) => {
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  const handleCardClick = (item: LegislativeFileItem) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const toggleCommittee = (committee: string) => {
    setSelectedCommittees(prev =>
      prev.includes(committee)
        ? prev.filter(c => c !== committee)
        : [...prev, committee]
    );
  };

  const toggleYear = (year: string) => {
    setSelectedYears(prev =>
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  const toggleColumn = (columnId: string) => {
    setVisibleColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-3.5rem)] flex flex-col">
        {/* Header with Filters */}
        <div className="px-4 sm:px-6 py-4 border-b border-border space-y-4">
          <h1 className="text-lg font-semibold text-foreground">Legislative Board</h1>
          
          {/* Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-[400px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search legislation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-background"
              />
            </div>

            {/* Personalized Toggle */}
            <Button
              variant={personalized ? "default" : "outline"}
              size="sm"
              onClick={() => setPersonalized(!personalized)}
              className="h-9"
              disabled={loadingUserTopics || userTopics.length === 0}
            >
              <ToggleLeft className="h-4 w-4 mr-2" />
              Personalized
              {personalized && userTopics.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-foreground text-primary rounded">
                  {userTopics.length}
                </span>
              )}
            </Button>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={sortBy === 'title'}
                  onCheckedChange={() => setSortBy('title')}
                >
                  Title
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={sortBy === 'year'}
                  onCheckedChange={() => setSortBy('year')}
                >
                  Year
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={sortBy === 'lastpubdate'}
                  onCheckedChange={() => setSortBy('lastpubdate')}
                >
                  Last Publication Date
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={sortBy === 'committee'}
                  onCheckedChange={() => setSortBy('committee')}
                >
                  Committee
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={sortBy === 'topics'}
                  onCheckedChange={() => setSortBy('topics')}
                >
                  Topics
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Columns Visibility */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Columns3 className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={visibleColumns.includes(column.id)}
                    onCheckedChange={() => toggleColumn(column.id)}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Committee Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Building2 className="h-4 w-4 mr-2" />
                  Committees
                  {selectedCommittees.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                      {selectedCommittees.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[220px] max-h-[300px] overflow-y-auto">
                <DropdownMenuLabel>Filter by committees</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allCommittees.map((committee) => (
                  <DropdownMenuCheckboxItem
                    key={committee}
                    checked={selectedCommittees.includes(committee)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCommittees([...selectedCommittees, committee]);
                      } else {
                        setSelectedCommittees(selectedCommittees.filter(c => c !== committee));
                      }
                    }}
                  >
                    {committee}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Year Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Calendar className="h-4 w-4 mr-2" />
                  Years
                  {selectedYears.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                      {selectedYears.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[150px] max-h-[300px] overflow-y-auto">
                <DropdownMenuLabel>Filter by years</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allYears.map((year) => (
                  <DropdownMenuCheckboxItem
                    key={year}
                    checked={selectedYears.includes(year)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedYears([...selectedYears, year]);
                      } else {
                        setSelectedYears(selectedYears.filter(y => y !== year));
                      }
                    }}
                  >
                    {year}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Topics Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Tags className="h-4 w-4 mr-2" />
                  Topics
                  {selectedTopics.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                      {selectedTopics.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Filter by topics</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allTopics.map((topic) => (
                  <DropdownMenuCheckboxItem
                    key={topic}
                    checked={selectedTopics.includes(topic)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTopics([...selectedTopics, topic]);
                      } else {
                        setSelectedTopics(selectedTopics.filter(t => t !== topic));
                      }
                    }}
                  >
                    {topic}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 overflow-x-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Loading legislative files...
            </div>
          ) : (
            <div className="flex gap-4 min-w-max h-full">
              {columns
                .filter(column => visibleColumns.includes(column.id))
                .map((column) => {
                  const columnItems = getColumnItems(column.statuses);
                  const isOver = dragOverColumn === column.id;

                  return (
                    <div
                      key={column.id}
                      className="w-72 flex-shrink-0 flex flex-col"
                      onDragOver={(e) => handleDragOver(e, column.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={() => handleDrop(column.id)}
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-sm font-medium text-foreground">{column.label}</h3>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {columnItems.length}
                        </span>
                      </div>

                      {/* Column Content */}
                      <div
                        className={cn(
                          "flex-1 p-2 rounded-lg transition-colors space-y-2 overflow-y-auto",
                          isOver ? "bg-secondary" : "bg-muted/30"
                        )}
                      >
                        {columnItems.map((item) => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={() => handleDragStart(item)}
                            className={cn(
                              draggedItem?.id === item.id && "opacity-50"
                            )}
                          >
                            <RegulatoryCard 
                              item={item} 
                              compact 
                              draggable 
                              onClick={() => handleCardClick(item)}
                            />
                          </div>
                        ))}

                        {columnItems.length === 0 && (
                          <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
                            No items
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      <LegislativeDetailSheet
        item={selectedItem}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </AppLayout>
  );
}