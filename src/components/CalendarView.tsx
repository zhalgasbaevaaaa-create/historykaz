import React, { useEffect } from 'react';
import { ChevronLeft, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';

interface CalendarViewProps {
  onBack: () => void;
}

const CAL_URL = 'https://calendar.google.com/calendar/u/0/r';

export const CalendarView: React.FC<CalendarViewProps> = ({ onBack }) => {
  useEffect(() => {
    window.open(CAL_URL, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-slate-100">
      <div className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            aria-label="Артқа"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-sky-400" />
            <span>Google күнтізбе</span>
          </h2>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-8 text-center space-y-4">
        <p className="text-sm text-slate-300">Google Calendar жаңа терезеде ашылады.</p>
        <a
          href={CAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold px-5 py-3 rounded-2xl"
        >
          <ExternalLink className="w-4 h-4" />
          Күнтізбені ашу
        </a>
        <iframe
          title="Google Calendar"
          src="https://calendar.google.com/calendar/embed?hl=kk&height=600&wkst=2&bgcolor=%230f172a&ctz=Asia%2FAlmaty&showTitle=0&showPrint=0&showTz=0"
          className="w-full h-[520px] rounded-2xl border border-slate-800 bg-slate-900"
        />
      </div>
    </div>
  );
};
