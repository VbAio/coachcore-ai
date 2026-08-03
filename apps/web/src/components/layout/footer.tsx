import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 px-6">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-purple flex items-center justify-center text-sm font-bold">
            CC
          </div>
          <span className="font-bold text-white">CoachCore AI</span>
        </div>
        <p className="text-sm text-zinc-500">
          © {new Date().getFullYear()} CoachCore AI. Not affiliated with Valve Corporation.
        </p>
        <div className="flex gap-6 text-sm text-zinc-400">
          <Link href="/deadlock" className="hover:text-purple-400">Dashboard</Link>
          <Link href="/deadlock/replays" className="hover:text-purple-400">Upload</Link>
          <Link href="#faq" className="hover:text-purple-400">FAQ</Link>
        </div>
      </div>
    </footer>
  );
}
