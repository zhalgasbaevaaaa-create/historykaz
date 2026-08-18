import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone, CheckCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPwaPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showPrompt, setShowPrompt] = useState<boolean>(true);
  const [installed, setInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIos) {
        // Shown inline in modal
        return;
      }
      alert('Қосымшаны орнату үшін браузер мәзірінен "Қосымшаны орнату" немесе "Басты экранға қосу" тармағын таңдаңыз.');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstalled(true);
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('PWA install error:', err);
    }
  };

  if (isStandalone || installed || !showPrompt) {
    return null;
  }

  return (
    <div id="pwa-install-banner" className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto">
      <div className="bg-slate-900/95 backdrop-blur-md border border-sky-500/30 rounded-2xl p-4 shadow-2xl shadow-sky-950/50 text-slate-100 relative">
        <button
          id="pwa-dismiss-btn"
          onClick={() => setShowPrompt(false)}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
          aria-label="Жабу"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white shrink-0 shadow-md">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-100 text-base leading-tight">
              Студенттік қосымшаны орнату
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Сабаққа жылдам тіркелу үшін қосымшаны смартфоныңыздың басты экранына орнатыңыз.
            </p>
          </div>
        </div>

        {isIos && !deferredPrompt ? (
          <div className="mt-3 bg-slate-800/80 rounded-xl p-3 border border-slate-700 text-xs text-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 text-sky-400 font-semibold">
              <Share2 className="w-4 h-4" />
              <span>iPhone (Safari) орнату нұсқаулығы:</span>
            </div>
            <p className="text-slate-300 leading-normal">
              Safari браузерінде <span className="font-semibold text-white">«Бөлісу» (Share)</span> батырмасын басып, <span className="font-semibold text-sky-300">«Басты экранға қосу» (Add to Home Screen)</span> тармағын таңдаңыз.
            </p>
          </div>
        ) : (
          <div className="mt-3.5 flex gap-2">
            <button
              id="pwa-install-action-btn"
              onClick={handleInstallClick}
              className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-sky-600/30 transition transform active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Қосымшаны орнату</span>
            </button>
            <button
              id="pwa-later-btn"
              onClick={() => setShowPrompt(false)}
              className="px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Кейінірек
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
