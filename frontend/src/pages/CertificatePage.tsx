import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Award, ExternalLink, Shield, BookOpen } from 'lucide-react';
import api from '../api/client';
import type { Certificate } from '../types';

function LinkedInShareButton({ cert }: { cert: Certificate }) {
  const certUrl = `${window.location.origin}/certificate/${cert.id}`;
  const year = new Date(cert.issued_at).getFullYear();
  const month = new Date(cert.issued_at).getMonth() + 1;

  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: cert.module.title,
    organizationName: cert.organization.name,
    issueYear: String(year),
    issueMonth: String(month),
    certUrl,
    certId: cert.cert_number,
  });

  return (
    <a
      href={`https://www.linkedin.com/profile/add?${params}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2.5 bg-[#0077b5] hover:bg-[#006097] text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm"
    >
      {/* LinkedIn logo */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      Add to LinkedIn Profile
      <ExternalLink size={12} />
    </a>
  );
}

export default function CertificatePage() {
  const { certId } = useParams<{ certId: string }>();

  const { data: cert, isLoading, isError } = useQuery<Certificate>({
    queryKey: ['certificate', certId],
    queryFn: () => api.get(`/certificates/${certId}`).then(r => r.data),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !cert) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-white/50" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Certificate not found</h1>
          <p className="text-white/50 text-sm mb-6">This certificate may have been removed or the link is invalid.</p>
          <Link to="/" className="text-blue-400 hover:text-blue-300 text-sm">← Back to Nest</Link>
        </div>
      </div>
    );
  }

  const issuedDate = new Date(cert.issued_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* Certificate card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">

          {/* Gold header band */}
          <div className="h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />

          <div className="px-10 py-12 text-center relative">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.07] pointer-events-none select-none">
              <Award size={320} className="text-slate-900" />
            </div>

            {/* Org logo / brand */}
            <div className="flex justify-center mb-6">
              {cert.organization.logo_url ? (
                <img src={cert.organization.logo_url} alt={cert.organization.name} className="h-10 object-contain" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{cert.organization.name[0]}</span>
                  </div>
                  <span className="font-bold text-gray-800 text-lg">{cert.organization.name}</span>
                </div>
              )}
            </div>

            {/* Certificate of completion */}
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-500 mb-3">
              Certificate of Completion
            </p>

            <p className="text-sm text-gray-500 mb-3">This is to certify that</p>

            <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
              {cert.user.full_name}
            </h1>

            <p className="text-sm text-gray-500 mb-4">has successfully completed</p>

            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3 mb-6">
              <BookOpen size={16} className="text-blue-500 flex-shrink-0" />
              <span className="text-base font-bold text-blue-900">{cert.module.title}</span>
            </div>

            <p className="text-sm text-gray-500 mb-8">
              Issued on <strong className="text-gray-800">{issuedDate}</strong>
            </p>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-200" />
              <Award size={20} className="text-amber-400" />
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-200" />
            </div>

            {/* Footer: cert number + verify */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <Shield size={11} className="text-emerald-500" />
                <span className="font-mono">{cert.cert_number}</span>
              </div>
              <span>Verified · Nest Fledge</span>
            </div>
          </div>

          {/* Gold footer band */}
          <div className="h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />
        </div>

        {/* Action bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <LinkedInShareButton cert={cert} />
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href).then(() => alert('Link copied!'))}
            className="inline-flex items-center gap-2 border border-white/20 text-white hover:text-white hover:border-white/40 text-sm px-5 py-2.5 rounded-xl transition-colors"
            aria-label="Copy certificate link"
          >
            Copy Link
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 border border-white/20 text-white hover:text-white hover:border-white/40 text-sm px-5 py-2.5 rounded-xl transition-colors"
            aria-label="Print or save certificate as PDF"
          >
            Print / Save as PDF
          </button>
        </div>

        <p className="text-center text-slate-400 text-xs mt-5">
          Powered by{' '}
          <a href="/" className="text-slate-300 hover:text-white transition-colors">Nest Fledge</a>
        </p>
      </div>
    </div>
  );
}
