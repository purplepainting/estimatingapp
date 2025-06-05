"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Download, Printer, Share2, Trash2 } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import type { Estimate } from "@/types/estimate"

export default function EstimateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load the estimate from localStorage
    const savedEstimates = JSON.parse(localStorage.getItem("paintEstimates") || "[]")
    const foundEstimate = savedEstimates.find((est: Estimate) => est.id === params.id)

    if (foundEstimate) {
      setEstimate(foundEstimate)
    }
    setLoading(false)
  }, [params.id])

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this estimate?")) {
      const savedEstimates = JSON.parse(localStorage.getItem("paintEstimates") || "[]")
      const updatedEstimates = savedEstimates.filter((est: Estimate) => est.id !== params.id)
      localStorage.setItem("paintEstimates", JSON.stringify(updatedEstimates))

      toast({
        title: "Estimate deleted",
        description: "The estimate has been removed from your saved estimates.",
      })

      router.push("/estimates")
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading estimate...</div>
  }

  if (!estimate) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Estimate Not Found</h2>
        <p className="mb-6">The estimate you're looking for doesn't exist or has been deleted.</p>
        <Link href="/estimates">
          <Button>View All Estimates</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b sticky top-0 z-10 print:hidden">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-gray-900">Estimate #{estimate.id.slice(0, 8)}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/estimates">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6 print:hidden">
            <h2 className="text-2xl font-bold text-gray-900">Estimate Details</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-1">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} className="flex items-center gap-1">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          <Card className="mb-8 print:shadow-none print:border-none">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6 print:mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">PaintPro Estimator</h3>
                  <p className="text-gray-600">Professional Painting Services</p>
                  <p className="text-gray-600">123 Main Street, Anytown, USA</p>
                  <p className="text-gray-600">contact@paintpro.example.com</p>
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Estimate</h3>
                  <p className="text-gray-600">#{estimate.id.slice(0, 8)}</p>
                  <p className="text-gray-600">Date: {new Date(estimate.createdAt).toLocaleDateString()}</p>
                  <p className="text-gray-600">Valid until: {new Date(estimate.validUntil).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mb-6 print:mb-8">
                <h4 className="font-bold text-gray-900 mb-2">Client Information</h4>
                <p className="text-gray-800">{estimate.clientName}</p>
                <p className="text-gray-600">{estimate.clientEmail}</p>
                <p className="text-gray-600">{estimate.clientPhone}</p>
                <p className="text-gray-600">{estimate.projectAddress}</p>
              </div>

              <div className="mb-6 print:mb-8">
                <h4 className="font-bold text-gray-900 mb-2">Project Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">Project Category:</p>
                    <p className="text-gray-800 font-medium">{estimate.projectCategory}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Project Type:</p>
                    <p className="text-gray-800 font-medium">{estimate.projectType}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Start Date:</p>
                    <p className="text-gray-800 font-medium">{estimate.startDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Paint Quality:</p>
                    <p className="text-gray-800 font-medium">{estimate.paintQuality}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6 print:mb-8">
                <h4 className="font-bold text-gray-900 mb-2">Rooms & Areas</h4>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-gray-600">Room/Area</th>
                      <th className="text-left py-2 text-gray-600">Dimensions</th>
                      <th className="text-left py-2 text-gray-600">Surface Type</th>
                      <th className="text-right py-2 text-gray-600">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimate.rooms.map((room, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 text-gray-800">{room.name}</td>
                        <td className="py-3 text-gray-800">
                          {room.width}' × {room.length}' × {room.height}'
                        </td>
                        <td className="py-3 text-gray-800">{room.surfaceType}</td>
                        <td className="py-3 text-gray-800 text-right">{formatCurrency(room.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mb-6 print:mb-8">
                <h4 className="font-bold text-gray-900 mb-2">Cost Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Materials:</span>
                    <span className="text-gray-800">{formatCurrency(estimate.materialsCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Labor:</span>
                    <span className="text-gray-800">{formatCurrency(estimate.laborCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Additional Costs:</span>
                    <span className="text-gray-800">{formatCurrency(estimate.additionalCosts)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-800">Subtotal:</span>
                    <span className="text-gray-800">{formatCurrency(estimate.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax ({estimate.taxRate}%):</span>
                    <span className="text-gray-800">{formatCurrency(estimate.taxAmount)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(estimate.total)}</span>
                  </div>
                </div>
              </div>

              {estimate.notes && (
                <div className="mb-6 print:mb-8">
                  <h4 className="font-bold text-gray-900 mb-2">Notes</h4>
                  <p className="text-gray-800 whitespace-pre-line">{estimate.notes}</p>
                </div>
              )}

              <div>
                <h4 className="font-bold text-gray-900 mb-2">Terms & Conditions</h4>
                <ul className="list-disc list-inside text-gray-800 space-y-1">
                  <li>This estimate is valid for 30 days from the date of issue.</li>
                  <li>A 50% deposit is required to schedule and begin work.</li>
                  <li>Final payment is due upon completion of the project.</li>
                  <li>Any changes to the scope of work may result in additional charges.</li>
                  <li>PaintPro provides a 2-year warranty on labor and workmanship.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
