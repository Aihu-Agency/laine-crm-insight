import { useEffect, useMemo, useState } from "react";
import { usePersistedFilters } from "@/hooks/usePersistedFilters";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  pointerWithin,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { airtableApi } from "@/services/airtableApi";
import { Customer } from "@/types/airtable";
import { toast } from "@/hooks/use-toast";
import CustomerFilters from "@/components/CustomerFilters";
import { CustomerFiltersValue } from "@/types/filters";

// Phase keys used in the funnel
type PhaseKey = "Property shown" | "1-3 mo" | "3-6 mo" | "6-12 mo" | "Later" | "Unclear" | "Not Specified";

interface SalesFunnelProps {
  onLogout?: () => void;
}

// UI model for rendering cards
interface UICustomer {
  id: string;
  fullName: string;
  phase: PhaseKey;
  location?: string;
  budgetRange?: string;
  salesperson?: string;
}

const CustomerCard = ({ customer, isDragging = false }: { customer: UICustomer; isDragging?: boolean }) => {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: customer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } as React.CSSProperties;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/customers/${customer.id}?from=sales-funnel`);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="mb-3 cursor-pointer hover:shadow-md transition-all duration-200 bg-white border border-gray-200"
    >
      <div {...listeners} className="p-2 cursor-grab active:cursor-grabbing flex justify-center">
        <div className="text-gray-400 select-none">⋮⋮</div>
      </div>
      <CardContent className="p-4 pt-0" onClick={handleClick}>
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-800 text-sm">{customer.fullName}</h3>
          <div className="text-xs text-gray-600 space-y-1">
            {customer.location ? <div>📍 {customer.location}</div> : null}
            {customer.budgetRange ? <div>💰 {customer.budgetRange}</div> : null}
            {customer.salesperson ? <div>👤 {customer.salesperson}</div> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DroppableColumn = ({ id, children }: { id: PhaseKey; children: React.ReactNode }) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="min-h-96">
      {children}
    </div>
  );
};

const PhaseColumn = ({ phase, customers, title }: { phase: PhaseKey; customers: UICustomer[]; title: string }) => {
  const phaseCustomers = customers.filter((customer) => customer.phase === phase);

  const getPhaseColor = (phase: string) => {
    if (phase === "Property shown") return "bg-green-100 border-green-300";
    if (phase.includes("1-3") || phase.includes("0-3")) return "bg-red-100 border-red-300";
    if (phase.includes("3-6")) return "bg-yellow-100 border-yellow-300";
    if (phase.includes("6-12")) return "bg-blue-100 border-blue-300";
    if (phase === "Later") return "bg-gray-100 border-gray-300";
    if (phase === "Unclear") return "bg-purple-100 border-purple-300";
    if (phase === "Not Specified") return "bg-orange-100 border-orange-300";
    return "bg-gray-100 border-gray-300";
  };

  return (
    <div className={`rounded-lg p-4 min-h-96 border-2 ${getPhaseColor(phase)}`}>
      <div className="mb-4">
        <h2 className="font-semibold text-gray-800 text-lg">{title}</h2>
        <p className="text-sm text-gray-600">{phaseCustomers.length} customers</p>
      </div>

      <div className="space-y-3">
        {phaseCustomers.map((customer) => (
          <CustomerCard key={customer.id} customer={customer} />
        ))}
      </div>
    </div>
  );
};

const SalesFunnel = ({ onLogout }: SalesFunnelProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pageSize, setPageSize] = useState(25);
  const [visitedOffsets, setVisitedOffsets] = useState<(string | undefined)[]>([undefined]);

  const DEFAULT_FILTERS: CustomerFiltersValue = {
    search: "",
    location: "",
    salesperson: "__all__",
    timeOfPurchase: "",
  };

  const [filters, setFilters] = usePersistedFilters<CustomerFiltersValue>('sales-funnel-filters', DEFAULT_FILTERS);

  const currentOffset = visitedOffsets[visitedOffsets.length - 1];

  const buildFilterFormula = () => {
    const conditions: string[] = [];
    
    if (filters.search) {
      conditions.push(`OR(FIND(LOWER("${filters.search}"), LOWER({First name})), FIND(LOWER("${filters.search}"), LOWER({Last name})))`);
    }
    if (filters.location) {
      conditions.push(`FIND("${filters.location}", {Areas of interest})`);
    }
    if (filters.salesperson && filters.salesperson !== "__all__") {
      conditions.push(`{Sales person} = "${filters.salesperson}"`);
    }
    if (filters.timeOfPurchase) {
      if (filters.timeOfPurchase === "__not_specified__") {
        conditions.push(`NOT({Time of purchase})`);
      } else {
        conditions.push(`{Time of purchase} = "${filters.timeOfPurchase}"`);
      }
    }
    
    return conditions.length > 0 ? `AND(${conditions.join(", ")})` : undefined;
  };

  // SEO: title + meta description
  useEffect(() => {
    document.title = "Sales Funnel | Laine CRM";
    const meta = document.querySelector('meta[name="description"]') || document.createElement("meta");
    meta.setAttribute("name", "description");
    meta.setAttribute("content", "Sales Funnel: track customers by phase and timeline.");
    if (!meta.parentNode) document.head.appendChild(meta);
  }, []);

  const phases: { key: PhaseKey; title: string }[] = useMemo(
    () => [
      { key: "Property shown", title: "Property Shown" },
      { key: "1-3 mo", title: "1-3 Months" },
      { key: "3-6 mo", title: "3-6 Months" },
      { key: "6-12 mo", title: "6-12 Months" },
      { key: "Later", title: "Later" },
      { key: "Unclear", title: "Unclear" },
      { key: "Not Specified", title: "Not Specified (Temp)" },
    ],
    []
  );

  const { data, isLoading } = useQuery({
    queryKey: ["customers-funnel", pageSize, currentOffset, filters],
    queryFn: () => airtableApi.getCustomers({ 
      limit: Math.min(pageSize, 100), // Airtable max is 100 per request
      offset: currentOffset,
      filterFormula: buildFilterFormula()
    }),
    staleTime: 60 * 1000,
  });

  const customersData = (data?.customers || []) as Customer[];
  const currentPage = visitedOffsets.length;

  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value));
    setVisitedOffsets([undefined]);
  };

  const handleFiltersChange = (newFilters: CustomerFiltersValue) => {
    setFilters(newFilters);
    setVisitedOffsets([undefined]); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      location: "",
      salesperson: "__all__",
      timeOfPurchase: "",
    });
    setVisitedOffsets([undefined]);
  };

  const handlePreviousPage = () => {
    if (visitedOffsets.length > 1) {
      setVisitedOffsets((prev) => prev.slice(0, -1));
    }
  };

  const handleNextPage = () => {
    const nextOffset = data?.offset;
    if (nextOffset) {
      setVisitedOffsets((prev) => [...prev, nextOffset]);
    }
  };

  // Optimistic local override of phase per customer id
  const [phaseOverrides, setPhaseOverrides] = useState<Record<string, PhaseKey>>({});

  const getPhaseFor = (c: Customer): PhaseKey => {
    const v = (c.timeOfPurchase || "").toLowerCase();
    if (!v) return "Not Specified"; // empty - from Pipedrive migration
    if (v.includes("property shown")) return "Property shown";
    if (v.includes("1-3") || v.includes("0-3")) return "1-3 mo";
    if (v.includes("3-6")) return "3-6 mo";
    if (v.includes("6-12")) return "6-12 mo";
    if (v.includes("unclear")) return "Unclear"; // explicitly marked as unclear
    if (v.includes("later")) return "Later";
    return "Later";
  };

  const formatBudget = (c: Customer): string | undefined => {
    const { minPrice, maxPrice } = c;
    if (minPrice && maxPrice) return `€${minPrice.toLocaleString()} - €${maxPrice.toLocaleString()}`;
    if (minPrice) return `€${minPrice.toLocaleString()}+`;
    if (maxPrice) return `Up to €${maxPrice.toLocaleString()}`;
    return undefined;
  };

  const uiCustomers: UICustomer[] = useMemo(() => {
    return (customersData || [])
      .filter(c => !c.archived) // Filter out archived customers
      .map((c) => ({
        id: c.id,
        fullName: `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Unnamed",
        phase: phaseOverrides[c.id] || getPhaseFor(c),
        location: c.areasOfInterest,
        budgetRange: formatBudget(c),
        salesperson: c.salesperson,
      }));
  }, [customersData, phaseOverrides]);

  const [activeId, setActiveId] = useState<string | null>(null);

  const updateCustomerMutation = useMutation({
    mutationFn: ({ customerId, data }: { customerId: string; data: Partial<Customer>; targetPhase?: PhaseKey }) =>
      airtableApi.updateCustomer(customerId, data),
    onSuccess: async (_, variables) => {
      // Refetch lists so UI reflects server state
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["customers-funnel"] }),
        queryClient.invalidateQueries({ queryKey: ["customers-page"] }),
      ]);

      // Clear optimistic override after refetch
      setPhaseOverrides((prev) => {
        const { [variables.customerId]: _, ...rest } = prev;
        return rest as Record<string, PhaseKey>;
      });

      // If moved to Property shown, create a Customer Action entry
      if ((variables as any).targetPhase === "Property shown") {
        const today = new Date().toISOString().slice(0, 10);
        try {
          await airtableApi.createCustomerAction(variables.customerId, {
            actionDescription: "Property shown",
            actionDate: today,
          });
        } catch (e) {
          console.warn("Failed to create action after moving to Property shown", e);
        }
      }
      toast({ title: "Updated", description: "Customer updated" });
    },
    onError: (_, variables) => {
      // Revert optimistic change on error
      setPhaseOverrides((prev) => {
        const { [variables.customerId]: _, ...rest } = prev;
        return rest as Record<string, PhaseKey>;
      });
      toast({ title: "Error", description: "Failed to update customer", variant: "destructive" });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const determineTargetPhase = (overId: string | number | undefined, activeCustomer: UICustomer): PhaseKey => {
    if (!overId) return activeCustomer.phase;
    // If dropping over a phase column id
    if (typeof overId === "string" && phases.some((p) => p.key === overId)) {
      return overId as PhaseKey;
    }
    // If dropping over another customer, use their phase
    const overCustomer = uiCustomers.find((c) => c.id === overId);
    if (overCustomer) return overCustomer.phase;
    return activeCustomer.phase;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const overId = over?.id as string | undefined;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const activeCustomer = uiCustomers.find((c) => c.id === (active.id as string));
    if (!activeCustomer) {
      setActiveId(null);
      return;
    }

    const targetPhase = determineTargetPhase(overId, activeCustomer);
    if (targetPhase === activeCustomer.phase) {
      setActiveId(null);
      return;
    }

    // Optimistically apply phase change
    setPhaseOverrides((prev) => ({ ...prev, [activeCustomer.id]: targetPhase }));

    // Prepare payload for persistence
    let payload: Partial<Customer> = {};
    if (targetPhase === "Property shown") {
      payload = { timeOfPurchase: "Property shown" };
    } else if (targetPhase === "1-3 mo") {
      payload = { timeOfPurchase: "1-3 months" };
    } else if (targetPhase === "3-6 mo") {
      payload = { timeOfPurchase: "3-6 months" };
    } else if (targetPhase === "6-12 mo") {
      payload = { timeOfPurchase: "6-12 months" };
    } else if (targetPhase === "Later") {
      payload = { timeOfPurchase: "Later" };
    } else if (targetPhase === "Unclear") {
      payload = { timeOfPurchase: "Unclear" };
    } else if (targetPhase === "Not Specified") {
      // Clear the field to represent not specified
      payload = { timeOfPurchase: "" } as any;
    }

    updateCustomerMutation.mutate({ customerId: activeCustomer.id, data: payload, targetPhase });

    setActiveId(null);
  };

  const activeCustomer = uiCustomers.find((c) => c.id === activeId);

  return (
    <div className="min-h-screen bg-laine-grey">
      <Navigation onLogout={onLogout} />

      <div className="container mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Sales Funnel</h1>
            <button
              className="bg-laine-mint hover:bg-laine-mint/90 text-gray-800 px-4 py-2 rounded font-medium"
              onClick={() => navigate("/customers/add")}
            >
              + Add new customer
            </button>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <CustomerFilters 
              value={filters} 
              onChange={handleFiltersChange} 
              onClear={handleClearFilters}
            />
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border mb-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Showing {customersData.length} customers on this page
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Per page:</span>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm text-gray-600 px-2">
                Page {currentPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!data?.offset}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-gray-600">Loading customers...</div>
        ) : (
          <DndContext collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
              {phases.map((phase) => (
                <DroppableColumn key={phase.key} id={phase.key}>
                  <SortableContext items={uiCustomers.filter((c) => c.phase === phase.key).map((c) => c.id)} strategy={verticalListSortingStrategy}>
                    <PhaseColumn phase={phase.key} customers={uiCustomers} title={phase.title} />
                  </SortableContext>
                </DroppableColumn>
              ))}
            </div>

            <DragOverlay>{activeCustomer ? <CustomerCard customer={activeCustomer} isDragging /> : null}</DragOverlay>
          </DndContext>
        )}

        {/* Bottom Pagination Controls */}
        {!isLoading && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border mt-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Showing {customersData.length} customers on this page
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm text-gray-600 px-2">
                Page {currentPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!data?.offset}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesFunnel;
