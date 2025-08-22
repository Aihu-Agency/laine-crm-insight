export interface AreaNode {
  label: string;
  value: string;
  children?: AreaNode[];
}

export const areasTree: AreaNode[] = [
  {
    label: "COSTA DEL SOL",
    value: "COSTA DEL SOL",
    children: [
      {
        label: "Alhaurin",
        value: "Alhaurin",
        children: [
          { label: "Alhaurín de la Torre", value: "Alhaurín de la Torre" },
          { label: "Alhaurín el Grande", value: "Alhaurín el Grande" },
          { label: "Alhaurin Golf", value: "Alhaurin Golf" },
          { label: "Coín", value: "Coín" },
          { label: "Lauro Golf", value: "Lauro Golf" }
        ]
      },
      {
        label: "Benahavís",
        value: "Benahavís",
        children: [
          { label: "El Madroñal", value: "El Madroñal" },
          { label: "El Paraiso", value: "El Paraiso" },
          { label: "La Zagaleta", value: "La Zagaleta" },
          { label: "Los Flamingos", value: "Los Flamingos" },
          { label: "Monte Halcones", value: "Monte Halcones" }
        ]
      },
      {
        label: "Benalmadena",
        value: "Benalmadena",
        children: [
          { label: "Arroyo de la Miel", value: "Arroyo de la Miel" },
          { label: "Benalmadena Costa", value: "Benalmadena Costa" },
          { label: "Benalmadena Pueblo", value: "Benalmadena Pueblo" },
          { label: "La Capellania", value: "La Capellania" },
          { label: "Torremuelle", value: "Torremuelle" },
          { label: "Torrequebrada", value: "Torrequebrada" }
        ]
      },
      {
        label: "Estepona",
        value: "Estepona",
        children: [
          { label: "Atalaya", value: "Atalaya" },
          { label: "Benamara", value: "Benamara" },
          { label: "Cancelada", value: "Cancelada" },
          { label: "Costalita", value: "Costalita" },
          { label: "El Presidente", value: "El Presidente" },
          { label: "Hacienda del Sol", value: "Hacienda del Sol" },
          { label: "La Atalaya", value: "La Atalaya" },
          { label: "New Golden Mile", value: "New Golden Mile" },
          { label: "Selwo", value: "Selwo" },
          { label: "Valle Romano", value: "Valle Romano" }
        ]
      },
      {
        label: "Fuengirola",
        value: "Fuengirola",
        children: [
          { label: "Carvajal", value: "Carvajal" },
          { label: "Los Boliches", value: "Los Boliches" },
          { label: "Los Pacos", value: "Los Pacos" },
          { label: "Torreblanca", value: "Torreblanca" }
        ]
      },
      {
        label: "Málaga",
        value: "Málaga",
        children: [
          { label: "Olletas", value: "Olletas" },
          { label: "Guadalmar", value: "Guadalmar" },
          { label: "Perchel Norte", value: "Perchel Norte" },
          { label: "Centro Histórico", value: "Centro Histórico" },
          { label: "Cerrado de Calderón", value: "Cerrado de Calderón" },
          { label: "Churriana", value: "Churriana" },
          { label: "Ciudad Jardín", value: "Ciudad Jardín" },
          { label: "El Ejido", value: "El Ejido" },
          { label: "El Palo", value: "El Palo" },
          { label: "Gibralfaro", value: "Gibralfaro" },
          { label: "La Cala del Moral", value: "La Cala del Moral" },
          { label: "La Heredia", value: "La Heredia" },
          { label: "La Merced", value: "La Merced" },
          { label: "La Trinidad", value: "La Trinidad" },
          { label: "La Victoria", value: "La Victoria" },
          { label: "Limonar", value: "Limonar" },
          { label: "Los Tilos", value: "Los Tilos" },
          { label: "Málaga Centro", value: "Málaga Centro" },
          { label: "Málaga Este", value: "Málaga Este" },
          { label: "Malagueta", value: "Malagueta" },
          { label: "Montes de Málaga", value: "Montes de Málaga" },
          { label: "Paseo Marítimo Oeste", value: "Paseo Marítimo Oeste" },
          { label: "Pedregalejo", value: "Pedregalejo" },
          { label: "Perchel Sur", value: "Perchel Sur" },
          { label: "Puerto de la Torre", value: "Puerto de la Torre" },
          { label: "Rincón de la Victoria", value: "Rincón de la Victoria" },
          { label: "Teatinos", value: "Teatinos" },
          { label: "Torre del Mar", value: "Torre del Mar" }
        ]
      },
      {
        label: "Marbella",
        value: "Marbella",
        children: [
          { label: "Altos de los Monteros", value: "Altos de los Monteros" },
          { label: "Artola", value: "Artola" },
          { label: "Bahía de Marbella", value: "Bahía de Marbella" },
          { label: "Bel Air", value: "Bel Air" },
          { label: "Cabopino", value: "Cabopino" },
          { label: "Carib Playa", value: "Carib Playa" },
          { label: "Cortijo Blanco", value: "Cortijo Blanco" },
          { label: "Costabella", value: "Costabella" },
          { label: "El Rosario", value: "El Rosario" },
          { label: "Elviria", value: "Elviria" },
          { label: "Guadalmina Alta", value: "Guadalmina Alta" },
          { label: "Guadalmina Baja", value: "Guadalmina Baja" },
          { label: "Hacienda Las Chapas", value: "Hacienda Las Chapas" },
          { label: "La Mairena", value: "La Mairena" },
          { label: "Las Chapas", value: "Las Chapas" },
          { label: "Los Monteros", value: "Los Monteros" },
          { label: "Marbesa", value: "Marbesa" },
          { label: "Nagüeles", value: "Nagüeles" },
          { label: "Puerto Banús", value: "Puerto Banús" },
          { label: "Puerto de Cabopino", value: "Puerto de Cabopino" },
          { label: "Reserva de Marbella", value: "Reserva de Marbella" },
          { label: "Río Real", value: "Río Real" },
          { label: "San Pedro de Alcántara", value: "San Pedro de Alcántara" },
          { label: "Santa Clara", value: "Santa Clara" },
          { label: "Sierra Blanca", value: "Sierra Blanca" },
          { label: "The Golden Mile", value: "The Golden Mile" }
        ]
      },
      {
        label: "Mijas",
        value: "Mijas",
        children: [
          { label: "Buena Vista", value: "Buena Vista" },
          { label: "Campo Mijas", value: "Campo Mijas" },
          { label: "Cerros del Aguila", value: "Cerros del Aguila" },
          { label: "El Hornillo", value: "El Hornillo" },
          { label: "Entrerrios", value: "Entrerrios" },
          { label: "Mijas Golf", value: "Mijas Golf" },
          { label: "Valtocado", value: "Valtocado" }
        ]
      },
      {
        label: "Mijas Costa",
        value: "Mijas Costa",
        children: [
          { label: "Calahonda", value: "Calahonda" },
          { label: "Calanova Golf", value: "Calanova Golf" },
          { label: "Calypso", value: "Calypso" },
          { label: "El Chaparral", value: "El Chaparral" },
          { label: "El Coto", value: "El Coto" },
          { label: "El Faro", value: "El Faro" },
          { label: "La Cala", value: "La Cala" },
          { label: "La Cala Golf", value: "La Cala Golf" },
          { label: "La Cala Hills", value: "La Cala Hills" },
          { label: "Las Lagunas", value: "Las Lagunas" },
          { label: "Miraflores", value: "Miraflores" },
          { label: "Riviera del Sol", value: "Riviera del Sol" },
          { label: "Sierrezuela", value: "Sierrezuela" },
          { label: "Torrenueva", value: "Torrenueva" }
        ]
      },
      {
        label: "Nueva Andalucía",
        value: "Nueva Andalucía",
        children: [
          { label: "Aloha", value: "Aloha" },
          { label: "Bajondillo", value: "Bajondillo" },
          { label: "El Pinillo", value: "El Pinillo" },
          { label: "La Campana", value: "La Campana" },
          { label: "La Quinta", value: "La Quinta" },
          { label: "Las Brisas", value: "Las Brisas" },
          { label: "Los Almendros", value: "Los Almendros" },
          { label: "Los Arqueros", value: "Los Arqueros" },
          { label: "Montemar", value: "Montemar" },
          { label: "Playamar", value: "Playamar" }
        ]
      },
      {
        label: "Torremolinos",
        value: "Torremolinos",
        children: [
          { label: "La Carihuela", value: "La Carihuela" },
          { label: "Los Alamos", value: "Los Alamos" },
          { label: "Torremolinos Centro", value: "Torremolinos Centro" }
        ]
      },
      {
        label: "Muu Costa del Sol",
        value: "Muu Costa del Sol"
      }
    ]
  },
  {
    label: "COSTA BLANCA",
    value: "COSTA BLANCA",
    children: [
      {
        label: "Torrevieja",
        value: "Torrevieja",
        children: [
          { label: "La Siesta", value: "La Siesta" },
          { label: "Mil Palmeras", value: "Mil Palmeras" },
          { label: "Cabo Roig", value: "Cabo Roig" },
          { label: "Urbanización El Raso", value: "Urbanización El Raso" },
          { label: "Playa de los Locos", value: "Playa de los Locos" },
          { label: "La Florida", value: "La Florida" },
          { label: "La Veleta", value: "La Veleta" },
          { label: "Playa del Cura", value: "Playa del Cura" },
          { label: "Aguas Nuevas", value: "Aguas Nuevas" },
          { label: "La Mata", value: "La Mata" },
          { label: "Los Locos", value: "Los Locos" },
          { label: "La Zenia", value: "La Zenia" },
          { label: "Los Balcones", value: "Los Balcones" },
          { label: "Punta Prima", value: "Punta Prima" },
          { label: "Villamartin", value: "Villamartin" },
          { label: "Orihuela Costa", value: "Orihuela Costa" }
        ]
      },
      {
        label: "Torrevieja lähialueet",
        value: "Torrevieja lähialueet",
        children: [
          { label: "Las Ramblas Golf", value: "Las Ramblas Golf" },
          { label: "Vista Bella Golf", value: "Vista Bella Golf" },
          { label: "Gran Alacant", value: "Gran Alacant" },
          { label: "Lomas de Cabo Roig", value: "Lomas de Cabo Roig" },
          { label: "Los Dolses", value: "Los Dolses" },
          { label: "Finestrat", value: "Finestrat" },
          { label: "San Miguel de Salinas", value: "San Miguel de Salinas" },
          { label: "Santa Pola", value: "Santa Pola" },
          { label: "Pilar de la Horadada", value: "Pilar de la Horadada" },
          { label: "Quesada", value: "Quesada" },
          { label: "La Herrada", value: "La Herrada" },
          { label: "Rojales", value: "Rojales" },
          { label: "Campoamor", value: "Campoamor" }
        ]
      },
      {
        label: "Muu costa blanca",
        value: "Muu costa blanca"
      }
    ]
  }
];

// Helper function to flatten the tree for validation and normalization
export function flattenAreasTree(nodes: AreaNode[]): string[] {
  const result: string[] = [];
  
  function traverse(nodes: AreaNode[]) {
    for (const node of nodes) {
      result.push(node.value);
      if (node.children) {
        traverse(node.children);
      }
    }
  }
  
  traverse(nodes);
  return result;
}

// Normalize area names for comparison (handle accents, spacing)
export function normalizeAreaName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/\s+/g, " "); // Normalize spaces
}

// Get all valid area values for validation
export const allValidAreas = flattenAreasTree(areasTree);

// Normalize and validate area selections
export function normalizeAndValidateAreas(areas: string[]): string[] {
  const normalizedValidAreas = allValidAreas.map(normalizeAreaName);
  
  return areas
    .map(area => area.trim())
    .filter(area => {
      if (!area) return false;
      const normalized = normalizeAreaName(area);
      const index = normalizedValidAreas.indexOf(normalized);
      return index !== -1;
    })
    .map(area => {
      const normalized = normalizeAreaName(area);
      const index = normalizedValidAreas.indexOf(normalized);
      return index !== -1 ? allValidAreas[index] : area;
    });
}