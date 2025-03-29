import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TrophyIcon } from "lucide-react"

export default function PublicHeader() {
  return (
    <header className="border-b">
      <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <TrophyIcon className="h-6 w-6" />
          <span>DevCommunity</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="outline">Sign In</Button>
          </Link>
          <Link href="/login">
            <Button>Join Community</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

