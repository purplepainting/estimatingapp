import { ArrowLeft, FileText, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import EstimatesList from "@/components/estimates-list"

export default function EstimatesPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Saved Estimates</h1>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Estimates</h2>
            <Link href="/">
              <Button className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                New Estimate
              </Button>
            </Link>
          </div>

          <EstimatesList />
        </div>
      </main>
    </div>
  )
}
