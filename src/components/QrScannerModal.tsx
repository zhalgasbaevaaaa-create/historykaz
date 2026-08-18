import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Camera,
  X,
  AlertCircle,
  Zap,
  RotateCcw,
  Upload,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { useAuth } from '../firebase/authContext';
import { AttendanceRecord } from '../types';

interface QrScannerModalProps {
  onSuccess: (record: AttendanceRecord) => void;
  onFailure: (errorReason: string) => void;
  onClose: () => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  onSuccess,
  onFailure,
  onClose
}) => {
  const { currentUser, currentStudent } = useAuth();
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState<boolean>(false);

  const qrRegionId = 'html5qr-code-full-region';
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const hasHandledScan = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    hasHandledScan.current = false;

    const startScanner = async () => {
      try {
        setScannerError(null);
        setIsScanning(true);

        // Check media devices support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setScannerError('Браузер камерамен жұмыс істеуді қолдамайды. Заманауи браузер пайдаланыңыз.');
          setIsScanning(false);
          return;
        }

        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          setScannerError('Құрылғыдан жұмыс істейтін камера табылмады.');
          setIsScanning(false);
          return;
        }

        if (isMounted) {
          setCameras(devices);
          // Prefer back / environment camera on mobile
          const backCam = devices.find(d => /back|rear|environment/i.test(d.label)) || devices[0];
          setActiveCameraId(backCam.id);

          const html5QrCode = new Html5Qrcode(qrRegionId, {
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            verbose: false
          });
          html5QrCodeRef.current = html5QrCode;

          const config = {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          };

          await html5QrCode.start(
            backCam.id,
            config,
            (decodedText) => {
              if (!hasHandledScan.current) {
                hasHandledScan.current = true;
                handleQrResult(decodedText);
              }
            },
            () => {
              // Ignore standard frame miss errors
            }
          );
        }
      } catch (err: any) {
        console.error('Camera QR scanner init error:', err);
        let msg = 'Камераға рұқсат берілмеді немесе камера бос емес.';
        if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission denied')) {
          msg = 'Камераға рұқсат беріңіз. Браузер параметрлерінен камераға рұқсатты қосыңыз.';
        } else if (err?.name === 'NotFoundError') {
          msg = 'Камера табылмады.';
        } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          msg = 'Камера тек қауіпсіз HTTPS байланысында жұмыс істейді.';
        }
        setScannerError(msg);
        setIsScanning(false);
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Stop scanner note:', e);
      }
    }
  };

  const handleQrResult = async (qrPayloadString: string) => {
    setIsValidating(true);
    await stopScanner();

    try {
      if (!currentUser?.email) {
        throw new Error('Google аккаунт расталмаған.');
      }

      let parsed: any;
      try {
        parsed = JSON.parse(qrPayloadString);
      } catch {
        throw new Error('QR код жарамсыз.');
      }

      if (!parsed.sessionId || !parsed.lessonId || !parsed.expiresAt) {
        throw new Error('QR код жарамсыз.');
      }
      if (Date.now() > Number(parsed.expiresAt)) {
        throw new Error('QR кодтың мерзімі аяқталған.');
      }
      if (currentStudent?.status && currentStudent.status !== 'Active') {
        throw new Error('Сіздің профиліңіз бұғатталған. Оқытушыға хабарласыңыз.');
      }
      if (parsed.group && currentStudent?.group && parsed.group !== currentStudent.group && parsed.group !== 'ALL') {
        throw new Error(`Бұл сабақ тек ${parsed.group} тобына арналған.`);
      }

      const nowObj = new Date();
      const dateStr = [
        String(nowObj.getDate()).padStart(2, '0'),
        String(nowObj.getMonth() + 1).padStart(2, '0'),
        nowObj.getFullYear()
      ].join('.');
      const timeStr = [
        String(nowObj.getHours()).padStart(2, '0'),
        String(nowObj.getMinutes()).padStart(2, '0'),
        String(nowObj.getSeconds()).padStart(2, '0')
      ].join(':');

      const attendanceRecord: AttendanceRecord = {
        id: `${parsed.lessonId}_${currentStudent?.studentId || 'ST-2026-001'}`,
        lessonId: parsed.lessonId,
        sessionId: parsed.sessionId,
        qrToken: parsed.token || '',
        studentId: currentStudent?.studentId || 'ST-2026-001',
        studentName: currentStudent?.fullName || currentUser.displayName || 'Студент',
        studentEmail: currentUser.email,
        group: currentStudent?.group || 'CS-2101',
        subject: parsed.subject || 'Сабақ',
        teacherId: parsed.teacherId || 'T-01',
        teacherName: parsed.teacherName || 'Оқытушы',
        date: dateStr,
        time: timeStr,
        timestamp: Date.now(),
        status: 'Қатысты',
        sheetsSyncStatus: 'Synced',
        sheetsSyncedAt: new Date().toISOString()
      };

      const { saveAttendanceRecord } = await import('../firebase/firestoreService');
      await saveAttendanceRecord(attendanceRecord);
      onSuccess(attendanceRecord);
    } catch (error: any) {
      console.error('Validation API error:', error);
      onFailure(error.message || 'Сабаққа тіркелу мүмкін болмады.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsValidating(true);
      const html5QrCode = new Html5Qrcode('qr-temp-file-scan');
      const decodedText = await html5QrCode.scanFile(file, true);
      handleQrResult(decodedText);
    } catch (err) {
      setScannerError('Суреттен QR код табылмады. Қайта түсіріп көріңіз.');
      setIsValidating(false);
    }
  };

  const handleSwitchCamera = async () => {
    if (cameras.length <= 1 || !html5QrCodeRef.current) return;
    const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCam = cameras[nextIndex];

    try {
      await stopScanner();
      setActiveCameraId(nextCam.id);
      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };
      await html5QrCodeRef.current.start(
        nextCam.id,
        config,
        (decodedText) => {
          if (!hasHandledScan.current) {
            hasHandledScan.current = true;
            handleQrResult(decodedText);
          }
        },
        () => {}
      );
    } catch (e) {
      console.warn('Switch camera error:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-slate-950 text-center relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-left">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base leading-tight">
                QR кодты сканерлеңіз
              </h3>
              <p className="text-[11px] text-slate-400">Оқытушы ұсынған QR кодқа бағыттаңыз</p>
            </div>
          </div>

          <button
            id="close-scanner-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            aria-label="Жабу"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Viewport Area */}
        <div className="relative my-4 flex-1 min-h-[280px] sm:min-h-[320px] bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
          <div id={qrRegionId} className="w-full h-full" />
          <div id="qr-temp-file-scan" className="hidden" />

          {/* Real-time Laser and Target Overlay */}
          {!scannerError && !isValidating && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-56 h-56 border-2 border-sky-400/80 rounded-2xl relative shadow-lg shadow-sky-500/30">
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-sky-400 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-sky-400 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-sky-400 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-sky-400 rounded-br-lg" />

                {/* Animated Scan Line */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-scan-line shadow-[0_0_8px_#38bdf8]" />
              </div>
            </div>
          )}

          {/* Validating Spinner Overlay */}
          {isValidating && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-sky-400 p-6 z-20">
              <Loader2 className="w-12 h-12 animate-spin" />
              <div className="font-extrabold text-white text-base">QR тексерілуде...</div>
              <p className="text-xs text-slate-300">Серверлік криптографиялық аутентификация</p>
            </div>
          )}

          {/* Error Message Screen */}
          {scannerError && (
            <div className="absolute inset-0 bg-slate-900 p-6 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-white text-sm mb-1">Камера қатесі</h4>
              <p className="text-xs text-rose-300 mb-4 leading-relaxed max-w-xs">{scannerError}</p>

              {/* Fallback Upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition"
              >
                <Upload className="w-4 h-4" />
                <span>QR код суретін жүктеу</span>
              </button>
            </div>
          )}
        </div>

        {/* Controls and Footer */}
        <div className="flex items-center justify-between gap-2 pt-1 text-xs">
          {cameras.length > 1 && (
            <button
              onClick={handleSwitchCamera}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Камера ауыстыру</span>
            </button>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition ml-auto"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Суреттен оқу</span>
          </button>
        </div>

        <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>15 минуттық бір реттік қауіпсіз сессия</span>
        </div>
      </div>
    </div>
  );
};
