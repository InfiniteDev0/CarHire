/** Print shell — always light, no workspace chrome, so PDFs come out clean. */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-white text-neutral-900">{children}</div>;
}
