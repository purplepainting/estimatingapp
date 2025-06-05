import { ArrowLeft, UserPlus, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function ClientsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Clients</h1>
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
            <h2 className="text-2xl font-bold text-gray-900">Your Clients</h2>
            <Button className="flex items-center gap-1">
              <UserPlus className="h-4 w-4" />
              Add Client
            </Button>
          </div>

          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Clients Yet</h3>
              <p className="text-gray-600 mb-4">
                You haven't added any clients yet. Add your first client to get started.
              </p>
              <Button>Add Your First Client</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
