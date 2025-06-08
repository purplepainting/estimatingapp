import { Paintbrush } from "lucide-react"
import Link from "next/link"
import EstimateForm from "@/components/estimate-form"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Paintbrush className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">PaintPro Estimator</h1>
          </div>
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="text-blue-600 font-medium">
              New Estimate
            </Link>
            <Link href="/estimates" className="text-gray-600 hover:text-blue-600 transition-colors">
              Saved Estimates
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors">
              Pricing
            </Link>
            <Link href="/clients" className="text-gray-600 hover:text-blue-600 transition-colors">
              Clients
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create a New Estimate</h2>
            <p className="text-gray-600">
              Fill out the form below to generate a professional estimate for your painting project
            </p>
          </div>

          <EstimateForm />
        </div>
      </main>

      <footer className="bg-gray-50 border-t mt-auto">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-600 text-sm">
            © {new Date().getFullYear()} PaintPro Estimator. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
