import React, { useState, useEffect } from 'react';
import { Download, Share2, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPwaPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(ua));

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setInstalled(true);
          setShowPrompt(false);
        }
        setDeferredPrompt(null);
      } catch {
        setShowHelp(true);
      }
      return;
    }
    setShowHelp(true);
  };

  if (isStandalone || installed || !showPrompt) return null;

  return (
    <div id="pwa-install-banner" className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto">
      <div className="bg-slate-900/95 backdrop-blur-md border border-sky-500/30 rounded-2xl p-4 shadow-2xl text-slate-100 relative">
        <button
          onClick={() => setShowPrompt(false)}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
          aria-label="Жабу"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-100 text-base leading-tight">Қосымшаны телефонға орнату</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Басты экранға белгіше қойылады. Play Store керек емес.
            </p>
          </div>
        </div>

        {isIos || showHelp || !deferredPrompt ? (
          <div className="mt-3 bg-slate-800/80 rounded-xl p-3 border border-slate-700 text-xs text-slate-200 space-y-2">
            {isIos ? (
              <>
                <div className="flex items-center gap-2 text-sky-400 font-semibold">
                  <Share2 className="w-4 h-4" />
                  iPhone (тек Safari)
                </div>
                <p>1. Төмендегі <b>Бөлісу</b> (квадрат + стрелка) батырмасын басыңыз</p>
                <p>2. <b>Басты экранға қосу</b> / Add to Home Screen</p>
                <p>3. <b>Қосу</b></p>
              </>
            ) : (
              <>
                <p className="font-semibold text-sky-300">Android — Chrome:</p>
                <p>1. Оң жақ жоғарғы <b>⋮</b> мәзір</p>
                <p>2. <b>Басты экранға қосу</b> немесе <b>Қосымшаны орнату</b></p>
                <p>3. <b>Орнату</b></p>
                <p className="text-slate-400">Telegram ішінен емес, Chrome-мен ашыңыз.</p>
              </>
            )}
          </div>
        ) : null}

        {!isIos && (
          <button
            id="pwa-install-action-btn"
            onClick={handleInstallClick}
            className="mt-3 w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            <span>{deferredPrompt ? 'Қосымшаны орнату' : 'Қалай орнату керек'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
