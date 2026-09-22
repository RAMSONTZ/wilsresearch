import Link from "next/link";
import { ArrowLeft, CircleDot } from "lucide-react";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-mark"><CircleDot size={20} /></div>
      <span className="eyebrow">Wils Research / 404</span>
      <h1>This page is<br /><em>not in the study.</em></h1>
      <p>The address may have moved, or the page may not exist. Return to the research desk and continue from there.</p>
      <Link className="button gold" href="/#home"><ArrowLeft size={16} /> Back to home</Link>
    </main>
  );
}
