import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t mt-12 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600">
        <p>© {new Date().getFullYear()} GSOS TATHAASTU. All rights reserved.</p>
        <div className="flex gap-4 mt-2 sm:mt-0">
          <Link href="/privacy" className="hover:text-indigo-600">Privacy</Link>
          <Link href="/terms" className="hover:text-indigo-600">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
