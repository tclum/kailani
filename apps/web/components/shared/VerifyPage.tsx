'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ShieldCheck, ShieldX, Clock, Upload, CheckCircle2, AlertCircle, FileText,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type VerifStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface VerifRequest {
  id: string;
  status: VerifStatus;
  idImageUrl: string;
  selfieUrl?: string | null;
  adminNote?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
}

export function VerifyPage() {
  const [request, setRequest] = useState<VerifRequest | null | 'loading'>('loading');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch<VerifRequest | null>('/api/verification/me')
      .then(setRequest)
      .catch(() => setRequest(null));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { setError('Please select an ID image to upload'); return; }

    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('idImage', file);
      const res = await fetch(`${API}/api/verification/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Submission failed'); return; }
      setRequest(data);
      setSuccess(true);
    } catch {
      setError('Submission failed — please try again');
    } finally {
      setUploading(false);
    }
  }

  if (request === 'loading') {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 rounded-full border-4 border-pink-300 border-t-pink-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)', boxShadow: '0 4px 14px rgba(236,72,153,0.3)' }}
        >
          <ShieldCheck size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Identity Verification</h1>
          <p className="text-sm text-muted-foreground">Verified profiles earn more trust and higher visibility</p>
        </div>
      </div>

      {/* Status card */}
      {request && <StatusCard request={request} />}

      {/* No request yet — show upload form */}
      {!request && !success && (
        <div className="rounded-2xl border bg-card p-6 space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileText size={18} className="text-pink-500" />
            </div>
            <div>
              <h2 className="font-semibold">Submit your ID</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Upload a clear photo of a government-issued ID (passport, driver's licence, or national ID card).
                Your documents are stored securely and only reviewed by Kailani admins.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-200">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <UploadField label="ID Document *" hint="Passport, driver's licence, or government ID · Max 5 MB" ref={fileRef} />

            <p className="text-xs text-muted-foreground">
              🔒 Your ID is stored securely and is never shown publicly. It is only used to confirm your identity.
            </p>

            <button
              type="submit"
              disabled={uploading}
              className="w-full h-12 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg,#ec4899,#be185d)',
                boxShadow: '0 4px 16px rgba(236,72,153,0.3)',
              }}
            >
              {uploading ? 'Uploading…' : 'Submit for Verification'}
            </button>
          </form>
        </div>
      )}

      {/* Rejected — allow resubmit */}
      {request?.status === 'REJECTED' && (
        <div className="rounded-2xl border bg-card p-6 space-y-5">
          <h2 className="font-semibold">Resubmit your ID</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-200">
                <AlertCircle size={15} /> {error}
              </div>
            )}
            <UploadField label="New ID Document *" hint="Upload a clearer photo — ensure all text is readable · Max 5 MB" ref={fileRef} />
            <button
              type="submit"
              disabled={uploading}
              className="w-full h-12 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}
            >
              {uploading ? 'Uploading…' : 'Resubmit'}
            </button>
          </form>
        </div>
      )}

      {/* How it works */}
      {!request && (
        <div className="rounded-2xl border bg-card p-6">
          <h3 className="font-semibold mb-4">How verification works</h3>
          <ol className="space-y-3 text-sm text-muted-foreground">
            {[
              ['Upload your ID', 'Supported: passport, driver\'s licence, national ID card'],
              ['Admin review', 'Our team reviews your submission within 1–2 business days'],
              ['Get verified', 'Approved profiles receive a pink ✓ Verified badge and unlock full platform access'],
            ].map(([title, desc], i) => (
              <li key={i} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-foreground">{title}</p>
                  <p>{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function StatusCard({ request }: { request: VerifRequest }) {
  if (request.status === 'APPROVED') {
    return (
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(22,163,74,0.06))', border: '1px solid rgba(34,197,94,0.2)' }}
      >
        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 size={24} className="text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-green-700">Verification approved</p>
          <p className="text-sm text-green-600/80 mt-0.5">
            Your identity is verified. A pink ✓ badge now appears on your profile.
          </p>
          {request.reviewedAt && (
            <p className="text-xs text-green-600/60 mt-1">
              Approved {new Date(request.reviewedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (request.status === 'PENDING') {
    return (
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)' }}
      >
        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Clock size={24} className="text-amber-600" />
        </div>
        <div>
          <p className="font-semibold text-amber-700">Verification under review</p>
          <p className="text-sm text-amber-600/80 mt-0.5">
            Your documents are being reviewed. We'll notify you by email within 1–2 business days.
          </p>
          <p className="text-xs text-amber-600/60 mt-1">
            Submitted {new Date(request.submittedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  }

  if (request.status === 'REJECTED') {
    return (
      <div
        className="rounded-2xl p-5 flex items-start gap-4"
        style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
      >
        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <ShieldX size={24} className="text-red-500" />
        </div>
        <div>
          <p className="font-semibold text-red-700">Verification not approved</p>
          {request.adminNote && (
            <p className="text-sm text-red-600/90 mt-1">
              <strong>Reason:</strong> {request.adminNote}
            </p>
          )}
          <p className="text-sm text-red-600/70 mt-1.5">
            Please resubmit with a clearer document using the form below.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

import React from 'react';

const UploadField = React.forwardRef<HTMLInputElement, { label: string; hint: string }>(
  function UploadField({ label, hint }, ref) {
    const [fileName, setFileName] = useState('');
    const [preview, setPreview] = useState<string | null>(null);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">{label}</label>
        <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border hover:border-pink-300 transition-colors cursor-pointer p-6 bg-muted/30">
          {preview ? (
            <div className="relative w-full max-w-xs aspect-video rounded-xl overflow-hidden">
              <Image src={preview} alt="Preview" fill className="object-cover" />
            </div>
          ) : (
            <>
              <Upload size={28} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground text-center">
                {fileName || 'Click to select a file'}
              </span>
            </>
          )}
          {fileName && <span className="text-xs text-pink-500 font-medium">{fileName}</span>}
          <input
            ref={ref}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleChange}
          />
        </label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    );
  }
);
