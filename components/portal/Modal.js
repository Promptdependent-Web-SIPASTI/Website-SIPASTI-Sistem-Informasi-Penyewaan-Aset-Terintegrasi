"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function Modal({ judul, tutup, children, lebar = "max-w-lg" }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && tutup();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [tutup]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-navy/60 p-4" onClick={tutup}>
      <motion.div role="dialog" aria-modal="true" aria-label={judul} initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }} onClick={(e) => e.stopPropagation()} className={`my-auto w-full ${lebar} rounded-2xl bg-white p-7 shadow-pop`}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-navy">{judul}</h2>
          <button type="button" onClick={tutup} aria-label="Tutup" className="flex size-9 items-center justify-center rounded-full bg-soft text-navy hover:bg-pale"><X size={17} /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
