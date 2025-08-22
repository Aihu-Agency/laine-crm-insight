import React, { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AreaNode } from "@/constants/areas-tree";

interface HierarchicalMultiSelectProps {
  tree: AreaNode[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

interface TreeNodeProps {
  node: AreaNode;
  selected: string[];
  onChange: (selected: string[]) => void;
  level: number;
}

function TreeNode({ node, selected, onChange, level }: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isSelected = selected.includes(node.value);
  const hasChildren = node.children && node.children.length > 0;

  const handleToggleSelection = (checked: boolean) => {
    if (checked) {
      onChange([...selected, node.value]);
    } else {
      onChange(selected.filter(value => value !== node.value));
    }
  };

  const handleToggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="w-full">
      <div 
        className={cn(
          "flex items-center gap-2 py-1 px-2 hover:bg-muted/50 rounded-sm",
          level === 0 && "font-medium",
          level === 1 && "ml-4",
          level === 2 && "ml-8"
        )}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={handleToggleOpen}
          >
            {isOpen ? (
              <Minus className="h-3 w-3" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
          </Button>
        ) : (
          <div className="h-4 w-4" />
        )}
        
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleToggleSelection}
          className="h-4 w-4"
        />
        
        <label 
          className={cn(
            "text-sm cursor-pointer flex-1",
            level === 0 && "font-medium"
          )}
          onClick={() => handleToggleSelection(!isSelected)}
        >
          {node.label}
        </label>
      </div>

      {hasChildren && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent className="space-y-0">
            {node.children?.map((child) => (
              <TreeNode
                key={child.value}
                node={child}
                selected={selected}
                onChange={onChange}
                level={level + 1}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

export function HierarchicalMultiSelect({
  tree,
  selected,
  onChange,
  placeholder = "Select areas",
  className
}: HierarchicalMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedCount = selected.length;
  const displayText = selectedCount === 0 
    ? placeholder 
    : `${selectedCount} selected`;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={cn(
            "w-full justify-between text-left font-normal",
            selectedCount === 0 && "text-muted-foreground",
            className
          )}
        >
          {displayText}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <ScrollArea className="h-[300px]">
          <div className="p-4">
            <div className="space-y-1">
              {tree.map((node) => (
                <TreeNode
                  key={node.value}
                  node={node}
                  selected={selected}
                  onChange={onChange}
                  level={0}
                />
              ))}
            </div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}