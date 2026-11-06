import { Clock, MapPin, Mail, Phone } from "lucide-react";

export default function UtilityBar() {
  return (
    <div className="hidden border-b border-pale bg-white md:block">
      <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-10 text-[13px] text-ink">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 font-medium"><Clock size={15} className="text-sky" /> Senin–Sabtu, 07.00–18.00</span>
          <span className="h-3.5 w-px bg-pale" />
          <span className="flex items-center gap-2"><MapPin size={15} className="text-sky" /> Kampus Sekaran, Gunungpati, Semarang</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="mailto:sipasti@fmipa.unnes.ac.id" className="flex items-center gap-2 hover:text-sky"><Mail size={15} className="text-sky" /> sipasti@fmipa.unnes.ac.id</a>
          <span className="h-3.5 w-px bg-pale" />
          <span className="flex items-center gap-2"><Phone size={15} className="text-sky" /> (024) 8508032</span>
        </div>
      </div>
    </div>
  );
}
