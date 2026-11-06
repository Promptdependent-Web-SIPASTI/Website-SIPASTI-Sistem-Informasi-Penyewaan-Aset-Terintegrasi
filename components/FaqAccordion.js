"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function FaqAccordion({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-4">
      {items.map((it, i) => {
        const aktif = open === i;
        return (
          <div key={it.q} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 p-5 shadow-sm">
            <button
              type="button"
              onClick={() => setOpen(aktif ? -1 : i)}
              aria-expanded={aktif}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <span className="text-base font-bold text-navy">{it.q}</span>
              <span className={`flex size-7 shrink-0 items-center justify-center rounded-full transition-colors ${aktif ? "bg-sun text-navy" : "bg-soft text-navy"}`}>
                {aktif ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {aktif && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p className="mt-4 border-t border-slate-200 pt-4 text-sm leading-relaxed text-ink">{it.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
