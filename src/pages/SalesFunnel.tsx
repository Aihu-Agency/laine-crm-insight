import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { airtableApi } from "@/services/airtableApi";
import { Customer } from "@/types/airtable";
import { toast } from "@/hooks/use-toast";

// Phase keys used in the funnel
type PhaseKey = "Property shown" | "0-3 mo" | "3-6 mo" | "6-12 mo" | "Later";

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
    <div ref={setNodeRef}>
      {children}
    </div>
  );
};

const PhaseColumn = ({ phase, customers, title }: { phase: PhaseKey; customers: UICustomer[]; title: string }) => {
  const phaseCustomers = customers.filter((customer) => customer.phase === phase);

  const getPhaseColor = (phase: string) => {
    if (phase === "Property shown") return "bg-green-100 border-green-300";
    if (phase.includes("0-3")) return "bg-red-100 border-red-300";
    if (phase.includes("3-6")) return "bg-yellow-100 border-yellow-300";
    if (phase.includes("6-12")) return "bg-blue-100 border-blue-300";
    if (phase === "Later") return "bg-gray-100 border-gray-300";
    return "bg-gray-100 border-gray-300";
  };

  return (
    <div className={`rounded-lg p-4 min-h-96 border-2 ${getPhaseColor(phase)}`}>
      <div className="mb-4">
        <h2 className="font-semibold text-gray-800 text-lg">{title}</h2>
        <p className="text-sm text-gray-600">{phaseCustomers.length} customers</p>
      </div>

      <SortableContext items={phaseCustomers.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {phaseCustomers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

const SalesFunnel = ({ onLogout }: SalesFunnelProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
      { key: "0-3 mo", title: "0-3 Months" },
      { key: "3-6 mo", title: "3-6 Months" },
      { key: "6-12 mo", title: "6-12 Months" },
      { key: "Later", title: "Later" },
    ],
    []
  );

  const { data: customersData, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => airtableApi.getCustomers(),
  });

  // Optimistic local override of phase per customer id
  const [phaseOverrides, setPhaseOverrides] = useState<Record<string, PhaseKey>>({});

  const getPhaseFor = (c: Customer): PhaseKey => {
    const v = (c.timeOfPurchase || "").toLowerCase();
    if (v.includes("property shown")) return "Property shown";
    if (v.includes("1-3") || v.includes("0-3")) return "0-3 mo";
    if (v.includes("3-6")) return "3-6 mo";
    if (v.includes("6-12")) return "6-12 mo";
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
    return (customersData || []).map((c) => ({
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
      // Clear override after server confirms
      setPhaseOverrides((prev) => {
        const { [variables.customerId]: _, ...rest } = prev;
        return rest as Record<string, PhaseKey>;
      });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
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
    onError: () => {
      // Revert optimistic change on error
      setPhaseOverrides((prev) => ({ ...prev, ...(activeId ? { [activeId]: undefined as unknown as PhaseKey } : {}) }));
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
    } else if (targetPhase === "0-3 mo") {
      payload = { timeOfPurchase: "1-3 months" };
    } else if (targetPhase === "3-6 mo") {
      payload = { timeOfPurchase: "3-6 months" };
    } else if (targetPhase === "6-12 mo") {
      payload = { timeOfPurchase: "6-12 months" };
    } else if (targetPhase === "Later") {
      payload = { timeOfPurchase: "Later" };
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
        </div>

        {isLoading ? (
          <div className="text-gray-600">Loading customers...</div>
        ) : (
          <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
      </div>
    </div>
  );
};

export default SalesFunnel;
