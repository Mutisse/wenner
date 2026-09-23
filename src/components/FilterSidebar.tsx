import { ChevronDown, Star } from "lucide-react";
import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { Slider } from "./ui/slider";

export interface Filters {
  gender: string[];
  categories: string[];
  colors: string[];
  priceRange: [number, number];
  rating: number[];
}

interface FilterSection {
  title: string;
  key: keyof Omit<Filters, "priceRange" | "rating">;
  options?: string[];
}

const filterSections: FilterSection[] = [
  {
    title: "Gênero",
    key: "gender",
    options: ["Masculino", "Feminino", "Unissex"],
  },
  {
    title: "Categorias",
    key: "categories",
    options: [
      "Camisetas",
      "Vestidos",
      "Casacos",
      "Calças",
      "Blazers",
      "Calçados",
      "Carteiras",
      "Jaquetas",
      "Saias",
      "Moletons",
    ],
  },
  {
    title: "Cores",
    key: "colors",
    options: [
      "Preto",
      "Branco",
      "Azul",
      "Vermelho",
      "Azul Marinho",
      "Cinza",
      "Bege",
    ],
  },
];
interface FilterSidebarProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

export const FilterSidebar = ({
  filters,
  onFilterChange,
}: FilterSidebarProps) => {
  const colorNameToHex: Record<string, string> = {
    Preto: "#000000",
    Branco: "#FFFFFF",
    Azul: "#0000FF",
    Vermelho: "#FF0000",
    "Azul Marinho": "#000080",
    Cinza: "#808080",
    Bege: "#F5DEB3",
  };
  const handleCheckboxChange = (
    key: keyof Omit<Filters, "priceRange" | "rating">,
    value: string
  ) => {
    // For colors, store hex values instead of display names
    const valueToUse =
      key === "colors" ? colorNameToHex[value] ?? value : value;
    const currentValues = filters[key];
    const newValues = currentValues.includes(valueToUse)
      ? currentValues.filter((v) => v !== valueToUse)
      : [...currentValues, valueToUse];

    onFilterChange({ ...filters, [key]: newValues });
  };

  const handleRatingChange = (rating: number) => {
    const newRatings = filters.rating.includes(rating)
      ? filters.rating.filter((r) => r !== rating)
      : [...filters.rating, rating];

    onFilterChange({ ...filters, rating: newRatings });
  };

  const handlePriceChange = (value: number[]) => {
    onFilterChange({ ...filters, priceRange: [value[0], value[1]] });
  };

  const handleClearAll = () => {
    onFilterChange({
      gender: [],
      categories: [],
      colors: [],
      priceRange: [0, 100000],
      rating: [],
    });
  };

  return (
    <aside className="w-full lg:w-64 bg-sidebar border-r border-sidebar-border p-6 space-y-4 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-sidebar-foreground">Filtro</h2>
      </div>

      {/* Filter Sections */}
      {filterSections.map((section) => (
        <Collapsible key={section.title} defaultOpen className="space-y-2">
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sidebar-foreground hover:text-sidebar-primary transition-colors">
            <span className="font-medium">{section.title}</span>
            <ChevronDown className="w-4 h-4 transition-transform ui-expanded:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2">
            {section.key === "colors"
              ? section.options?.map((option) => {
                  const hex = colorNameToHex[option] ?? option;
                  const checked = filters.colors.includes(hex);
                  return (
                    <label
                      key={option}
                      title={option}
                      className="flex items-center gap-3 py-2 cursor-pointer group w-full"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          handleCheckboxChange(section.key, option)
                        }
                        className="sr-only"
                        aria-label={`${option} color`}
                      />
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full border border-border transition-all ${
                              checked ? "ring-2 ring-accent" : ""
                            }`}
                            style={{ backgroundColor: hex }}
                          />
                          <span className="text-sm text-sidebar-foreground group-hover:text-sidebar-primary transition-colors">
                            {option}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })
              : section.options?.map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 py-1.5 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={filters[section.key].includes(option)}
                      onChange={() => handleCheckboxChange(section.key, option)}
                      className="w-4 h-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-0"
                    />
                    <span className="text-sm text-sidebar-foreground group-hover:text-sidebar-primary transition-colors">
                      {option}
                    </span>
                  </label>
                ))}
          </CollapsibleContent>
        </Collapsible>
      ))}

      {/* Price Range */}
      <Collapsible defaultOpen className="space-y-4">
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sidebar-foreground hover:text-sidebar-primary transition-colors">
          <span className="font-medium">Preço</span>
          <ChevronDown className="w-4 h-4 transition-transform ui-expanded:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <Slider
            value={filters.priceRange}
            onValueChange={handlePriceChange}
            max={200}
            step={10}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{filters.priceRange[0]} MZN</span>
            <span>{filters.priceRange[1]} MZN</span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Rating */}
      <Collapsible defaultOpen className="space-y-2">
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sidebar-foreground hover:text-sidebar-primary transition-colors">
          <span className="font-medium">Avaliação</span>
          <ChevronDown className="w-4 h-4 transition-transform ui-expanded:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <label
              key={rating}
              className="flex items-center gap-2 py-1.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={filters.rating.includes(rating)}
                onChange={() => handleRatingChange(rating)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-0"
              />
              <div className="flex items-center gap-1">
                {Array.from({ length: rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
                <span className="text-sm text-sidebar-foreground group-hover:text-sidebar-primary transition-colors ml-1">
                  & acima
                </span>
              </div>
            </label>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Clear All Button */}
      <Button
        variant="outline"
        className="w-full mt-6 border-sale text-sale hover:bg-sale hover:text-sale-foreground transition-colors"
        onClick={handleClearAll}
      >
        Limpar tudo
      </Button>
    </aside>
  );
};
