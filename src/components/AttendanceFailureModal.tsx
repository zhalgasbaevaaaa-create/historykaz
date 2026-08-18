import React from 'react';
import { XCircle, AlertCircle, RefreshCw, X } from 'lucide-react';

interface AttendanceFailureModalProps {
  errorReason: string;
  onRetry: () => void;
  onClose: () => void;
}

export const AttendanceFailureModal: React.FC<AttendanceFailureModalProps> = ({
  errorReason,
  onRetry,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border-2 border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/60 text-center relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          aria-label="Жабу"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Large Red X */}
        <div className="mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center text-white shadow-xl shadow-rose-600/40 mb-6 animate-pulse">
          <XCircle className="w-14 h-14 sm:w-16 sm:h-16 stroke-[2.5]" />
        </div>

        {/* Main Title Required: "Қайтадан тіркеліңіз!" */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-rose-400 tracking-tight leading-tight">
          Қайтадан тіркеліңіз!
        </h2>

        {/* Safe Error Explanation */}
        <div className="mt-5 bg-rose-950/40 border border-rose-800/60 rounded-2xl p-4 flex items-start gap-3 text-left">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs text-rose-300 font-bold uppercase tracking-wider">Себебі (Reason):</div>
            <p className="text-sm font-semibold text-white mt-0.5">
              {errorReason || 'Сабаққа тіркелу мүмкін болмады.'}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-4 leading-relaxed">
          Оқытушының экранындағы белсенді QR кодты камера арқылы қайта сканерлеңіз.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <button
            id="retry-scan-btn"
            onClick={onRetry}
            className="flex-1 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold py-3 px-4 rounded-xl shadow-lg shadow-rose-700/30 flex items-center justify-center gap-2 text-sm transition transform active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Қайта көру (Сканерлеу)</span>
          </button>
          <button
            id="cancel-fail-btn"
            onClick={onClose}
            className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition"
          >
            Бас тарту
          </button>
        </div>
      </div>
    </div>
  );
};
