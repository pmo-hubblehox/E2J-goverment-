import { useEffect, useRef, useState } from 'react';
import { Video, Mic, RefreshCw, Check } from 'lucide-react';
import { uploadFile } from '../services/uploadFile';

const PRIMARY = '#3F41D1';
const BORDER = '#E2E8F0';
const TEXT = '#1E293B';
const SUB = '#64748B';

const MAX_SECONDS = 90;

type Phase = 'idle' | 'requesting-permission' | 'preview-ready' | 'recording' | 'recorded' | 'uploading' | 'error';

interface IntroVideoRecorderProps {
  studentName: string;
  onComplete: (introVideoUrl: string | undefined) => void;
}

export default function IntroVideoRecorder({ studentName, onComplete }: IntroVideoRecorderProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(MAX_SECONDS);
  const [uploadError, setUploadError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const objectUrlRef = useRef<string>('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const startCamera = async () => {
    if (typeof MediaRecorder === 'undefined') {
      setErrorMsg("Video recording isn't supported in this browser. You can skip this step.");
      setPhase('error');
      return;
    }
    setPhase('requesting-permission');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true });
      streamRef.current = stream;
      setPhase('preview-ready');
    } catch {
      setErrorMsg('Camera/microphone access was denied. Please allow access and try again, or skip this step.');
      setPhase('error');
    }
  };

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      blobRef.current = blob;
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      stopStream();
      setPhase('recorded');
    };
    recorderRef.current = recorder;
    recorder.start();
    setSecondsLeft(MAX_SECONDS);
    setPhase('recording');
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          recorderRef.current?.stop();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stop();
  };

  const reRecord = () => {
    if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = ''; }
    blobRef.current = null;
    startCamera();
  };

  const useThisVideo = async () => {
    const blob = blobRef.current;
    if (!blob) return;
    setPhase('uploading');
    setUploadError('');
    try {
      const file = new File([blob], 'intro-video.webm', { type: blob.type || 'video/webm' });
      const { url } = await uploadFile(file, 'student', studentName || 'unknown', 'intro-video');
      onComplete(url);
    } catch {
      setUploadError('Failed to upload video. You can retry or skip this step.');
      setPhase('recorded');
    }
  };

  const skip = () => {
    stopStream();
    onComplete(undefined);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '8px 0' }}>
      <p style={{ fontSize: '13px', color: SUB, textAlign: 'center', margin: 0 }}>
        Record a short intro video for the employer (optional, max {MAX_SECONDS} seconds).
      </p>

      {phase === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '32px 0' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Video size={30} color={PRIMARY} />
          </div>
          <button onClick={startCamera}
            style={{ padding: '10px 26px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Start Camera
          </button>
          <button onClick={skip} style={{ background: 'none', border: 'none', color: SUB, fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
            Skip this step
          </button>
        </div>
      )}

      {phase === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '24px 0' }}>
          <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#B91C1C', fontSize: '13px', maxWidth: '380px', textAlign: 'center' }}>
            {errorMsg}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={startCamera} style={{ padding: '9px 20px', borderRadius: '100px', border: `1.5px solid ${PRIMARY}`, background: '#fff', color: PRIMARY, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Try Again
            </button>
            <button onClick={skip} style={{ padding: '9px 20px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', color: TEXT, fontSize: '13px', cursor: 'pointer' }}>
              Skip this step
            </button>
          </div>
        </div>
      )}

      {phase === 'requesting-permission' && (
        <div style={{ padding: '40px 0', color: SUB, fontSize: '13px' }}>Requesting camera access…</div>
      )}

      {(phase === 'preview-ready' || phase === 'recording') && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
          <div style={{ position: 'relative', width: '320px', height: '240px', borderRadius: '12px', overflow: 'hidden', background: '#1E293B' }}>
            <video ref={el => {
              (videoRef as any).current = el;
              if (el && streamRef.current && el.srcObject !== streamRef.current) {
                el.srcObject = streamRef.current;
                el.play().catch(() => {});
              }
            }} muted autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            {phase === 'recording' && (
              <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.55)', borderRadius: '100px', padding: '4px 10px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
                <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}>{formatTime(secondsLeft)}</span>
              </div>
            )}
          </div>
          {phase === 'preview-ready' ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={startRecording} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px', borderRadius: '100px', border: 'none', background: '#16A34A', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                <Mic size={14} /> Start Recording
              </button>
              <button onClick={skip} style={{ padding: '10px 20px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', color: TEXT, fontSize: '13px', cursor: 'pointer' }}>
                Skip
              </button>
            </div>
          ) : (
            <button onClick={stopRecording} style={{ padding: '10px 24px', borderRadius: '100px', border: 'none', background: '#EF4444', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Stop Recording
            </button>
          )}
        </div>
      )}

      {(phase === 'recorded' || phase === 'uploading') && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
          <video ref={el => {
            (playbackRef as any).current = el;
            if (el && objectUrlRef.current && el.src !== objectUrlRef.current) {
              el.src = objectUrlRef.current;
            }
          }} controls style={{ width: '320px', height: '240px', borderRadius: '12px', background: '#000' }} />
          {uploadError && (
            <div style={{ padding: '8px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#B91C1C', fontSize: '12px' }}>{uploadError}</div>
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={reRecord} disabled={phase === 'uploading'}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px', borderRadius: '100px', border: `1.5px solid ${PRIMARY}`, background: '#fff', color: PRIMARY, fontSize: '13px', fontWeight: 600, cursor: phase === 'uploading' ? 'not-allowed' : 'pointer', opacity: phase === 'uploading' ? 0.6 : 1 }}>
              <RefreshCw size={13} /> Re-record
            </button>
            <button onClick={useThisVideo} disabled={phase === 'uploading'}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 24px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: phase === 'uploading' ? 'not-allowed' : 'pointer', opacity: phase === 'uploading' ? 0.7 : 1 }}>
              {phase === 'uploading' ? 'Uploading…' : <><Check size={14} /> Use This Video</>}
            </button>
            <button onClick={skip} disabled={phase === 'uploading'} style={{ padding: '9px 20px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', color: TEXT, fontSize: '13px', cursor: phase === 'uploading' ? 'not-allowed' : 'pointer' }}>
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
