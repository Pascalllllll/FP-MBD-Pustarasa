// Decorative blobs, absolute/z-0 above bg-paper but below content.
// A negative/fixed z-index would paint behind <body> instead.
export default function AmbientBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div
        className="animate-blob absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgb(var(--color-library)) 0%, transparent 70%)' }}
      />
      <div
        className="animate-blob absolute -bottom-40 -left-24 h-[26rem] w-[26rem] rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgb(var(--color-canteen)) 0%, transparent 70%)', animationDelay: '-9s' }}
      />
      <div
        className="animate-blob absolute bottom-1/4 right-0 h-72 w-72 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgb(var(--color-library)) 0%, transparent 70%)', animationDelay: '-15s' }}
      />
    </div>
  );
}
