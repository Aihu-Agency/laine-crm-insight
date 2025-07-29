import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";

interface Customer {
  id: number;
  fullName: string;
  phase: string;
  location: string;
  budgetRange: string;
  salesperson: string;
  lastContact: string;
}

interface SalesFunnelProps {
  onLogout?: () => void;
}

const CustomerCard = ({ customer, isDragging = false }: { customer: Customer; isDragging?: boolean }) => {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: customer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/customers/${customer.id}`);
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
            <div>📍 {customer.location}</div>
            <div>💰 {customer.budgetRange}</div>
            <div>👤 {customer.salesperson}</div>
            <div className="text-gray-500">Last: {customer.lastContact}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PhaseColumn = ({ phase, customers, title }: { phase: string; customers: Customer[]; title: string }) => {
  const phaseCustomers = customers.filter(customer => customer.phase === phase);

  const getPhaseColor = (phase: string) => {
    if (phase.includes("0-3")) return "bg-red-100 border-red-300";
    if (phase.includes("3-6")) return "bg-yellow-100 border-yellow-300";
    if (phase.includes("6-12")) return "bg-blue-100 border-blue-300";
    return "bg-gray-100 border-gray-300";
  };

  return (
    <div className={`rounded-lg p-4 min-h-96 border-2 ${getPhaseColor(phase)}`}>
      <div className="mb-4">
        <h2 className="font-semibold text-gray-800 text-lg">{title}</h2>
        <p className="text-sm text-gray-600">{phaseCustomers.length} customers</p>
      </div>
      
      <SortableContext items={phaseCustomers.map(c => c.id)} strategy={verticalListSortingStrategy}>
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
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: 1,
      fullName: "Mikko Tuominen",
      phase: "0-3 mo",
      location: "Marbella",
      budgetRange: "€300k - €400k",
      salesperson: "Laura",
      lastContact: "2 days ago"
    },
    {
      id: 2,
      fullName: "Anna Korhonen",
      phase: "3-6 mo",
      location: "Estepona",
      budgetRange: "€250k - €350k",
      salesperson: "Anna",
      lastContact: "1 week ago"
    },
    {
      id: 3,
      fullName: "Petri Hakala",
      phase: "6-12 mo",
      location: "Fuengirola",
      budgetRange: "€200k - €300k",
      salesperson: "Mikko",
      lastContact: "3 days ago"
    },
    {
      id: 4,
      fullName: "Sari Laakso",
      phase: "0-3 mo",
      location: "Torremolinos",
      budgetRange: "€400k - €500k",
      salesperson: "Laura",
      lastContact: "5 days ago"
    },
    {
      id: 5,
      fullName: "Jukka Nieminen",
      phase: "3-6 mo",
      location: "Marbella",
      budgetRange: "€350k - €450k",
      salesperson: "Anna",
      lastContact: "1 day ago"
    },
    {
      id: 6,
      fullName: "Liisa Mäkinen",
      phase: "0-3 mo",
      location: "Benalmádena",
      budgetRange: "€180k - €280k",
      salesperson: "Sari",
      lastContact: "4 days ago"
    },
    {
      id: 7,
      fullName: "Tero Jokinen",
      phase: "6-12 mo",
      location: "Mijas",
      budgetRange: "€500k - €600k",
      salesperson: "Mikko",
      lastContact: "2 weeks ago"
    },
    {
      id: 8,
      fullName: "Kirsi Salonen",
      phase: "3-6 mo",
      location: "Marbella",
      budgetRange: "€320k - €420k",
      salesperson: "Laura",
      lastContact: "6 days ago"
    },
    {
      id: 9,
      fullName: "Ville Heikkinen",
      phase: "0-3 mo",
      location: "Estepona",
      budgetRange: "€280k - €380k",
      salesperson: "Anna",
      lastContact: "3 days ago"
    },
    {
      id: 10,
      fullName: "Marja Virtanen",
      phase: "12+ mo",
      location: "Fuengirola",
      budgetRange: "€450k - €550k",
      salesperson: "Sari",
      lastContact: "1 month ago"
    },
    {
      id: 11,
      fullName: "Markus Rantala",
      phase: "0-3 mo",
      location: "Torremolinos",
      budgetRange: "€300k - €400k",
      salesperson: "Laura",
      lastContact: "1 week ago"
    },
    {
      id: 12,
      fullName: "Tiina Källi",
      phase: "3-6 mo",
      location: "Mijas",
      budgetRange: "€380k - €480k",
      salesperson: "Mikko",
      lastContact: "5 days ago"
    },
    {
      id: 13,
      fullName: "Otso Lindfors",
      phase: "6-12 mo",
      location: "Benalmádena",
      budgetRange: "€220k - €320k",
      salesperson: "Anna",
      lastContact: "2 weeks ago"
    },
    {
      id: 14,
      fullName: "Tommi Perälä",
      phase: "0-3 mo",
      location: "Marbella",
      budgetRange: "€600k - €700k",
      salesperson: "Sari",
      lastContact: "4 days ago"
    },
    {
      id: 15,
      fullName: "Elina Koskinen",
      phase: "3-6 mo",
      location: "Estepona",
      budgetRange: "€250k - €350k",
      salesperson: "Laura",
      lastContact: "1 week ago"
    }
  ]);

  const [activeId, setActiveId] = useState<number | null>(null);

  const phases = [
    { key: "0-3 mo", title: "0-3 Months" },
    { key: "3-6 mo", title: "3-6 Months" },
    { key: "6-12 mo", title: "6-12 Months" },
    { key: "12+ mo", title: "12+ Months" }
  ];

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    // Find the customer being moved
    const activeCustomer = customers.find(c => c.id === active.id);
    if (!activeCustomer) {
      setActiveId(null);
      return;
    }

    // Determine the target phase from the droppable area
    const overId = over.id;
    let targetPhase = activeCustomer.phase;

    // Check if we're dropping over a phase column
    if (typeof overId === "string" && phases.some(p => p.key === overId)) {
      targetPhase = overId;
    } else {
      // If dropping over another customer, find their phase
      const overCustomer = customers.find(c => c.id === overId);
      if (overCustomer) {
        targetPhase = overCustomer.phase;
      }
    }

    // Update the customer's phase
    setCustomers(customers.map(customer => 
      customer.id === active.id 
        ? { ...customer, phase: targetPhase }
        : customer
    ));

    setActiveId(null);
  };

  const activeCustomer = customers.find(c => c.id === activeId);

  return (
    <div className="min-h-screen bg-laine-grey">
      <Navigation onLogout={onLogout} />
      
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Sales Funnel</h1>
        </div>

        <DndContext
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {phases.map((phase) => (
              <div key={phase.key}>
                <SortableContext items={customers.filter(c => c.phase === phase.key).map(c => c.id)} strategy={verticalListSortingStrategy}>
                  <PhaseColumn
                    phase={phase.key}
                    customers={customers}
                    title={phase.title}
                  />
                </SortableContext>
              </div>
            ))}
          </div>

          <DragOverlay>
            {activeCustomer ? (
              <CustomerCard customer={activeCustomer} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default SalesFunnel;