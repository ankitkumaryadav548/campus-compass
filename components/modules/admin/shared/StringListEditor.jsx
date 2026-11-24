"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";

export default function StringListEditor({ value = [], onChange, label, placeholder = "Add item..." }) {
  const [newItem, setNewItem] = useState("");

  const handleAdd = () => {
    const clean = newItem.trim();
    if (!clean) return;
    onChange([...value, clean]);
    setNewItem("");
  };

  const handleRemove = (index) => {
    onChange(value.filter((_, idx) => idx !== index));
  };

  const handleEdit = (index, text) => {
    const updated = [...value];
    updated[index] = text;
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {label}
        </label>
      )}

      <div className="space-y-1.5">
        {value.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => handleEdit(idx, e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-primary-500"
            />
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="p-1 text-slate-400 hover:text-danger-600"
              title="Remove item"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
        />
        <Button type="button" variant="outline" size="sm" onClick={handleAdd} leftIcon={Plus}>
          Add
        </Button>
      </div>
    </div>
  );
}
