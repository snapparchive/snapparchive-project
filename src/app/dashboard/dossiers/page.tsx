import { Suspense } from "react"
import DossiersClient from "@/components/dossiers/DossiersClient"

export default function Page() {
  return (
    <Suspense fallback={<div>Loading dossiers...</div>}>
      <DossiersClient />
    </Suspense>
  )
}