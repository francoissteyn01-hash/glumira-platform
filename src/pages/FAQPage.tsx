import { useState } from "react";
import { Link } from "react-router-dom";
import { FAQ_ITEMS } from "@/lib/constants";
export default function FAQPage() {
  const [open, setOpen] = useState<number|null>(null);
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Frequently Asked Questions</h1>
          <p className="text-sm text-gray-300 mt-1">
            New to GluMira™? Start with the <Link to="/tutorial" className="text-[var(--accent-teal)] underline hover:text-[#229aaa]">Tutorial</Link>. Can't find an answer? Ask Mira AI.
          </p>
        </div>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item,i)=>(
            <div key={i} className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
              <button type="button" onClick={()=>setOpen(open===i?null:i)} className="w-full text-left px-5 py-4 flex items-center justify-between">
                <span className="font-medium text-white text-sm">{item.q}</span>
                <span className="text-gray-300 ml-4 flex-shrink-0">{open===i?"−":"+"}</span>
              </button>
              {open===i&&<div className="px-5 pb-4"><p className="text-sm text-gray-300">{item.a}</p></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
