"use client"

import { useEffect, useState } from "react"
import { ArrowRight, FileText } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { Estimate } from "@/types/estimate"

export default function EstimatesList() {
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load estimates from localStorage
    const savedEstimates = JSON.parse(localStorage.getItem("paintEstimates") || "[]")
    // Sort by creation date (newest first)
    savedEstimates.sort((a: Estimate, b: Estimate) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    setEstimates(savedEstimates)
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="text-center py-8">Loading estimates...</div>
  }

  if (estimates.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Estimates Yet</h3>
          <p className="text-gray-600 mb-4">
            You haven't created any estimates yet. Create your first estimate to get started.
          </p>
          <Link href="/">
            <Button>Create New Estimate</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {estimates.map((estimate) => (
        <Card key={estimate.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="p-4 sm:p-6 flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-lg">{estimate.clientName}</h3>
                    <p className="text-sm text-gray-600">{estimate.projectAddress}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{formatCurrency(estimate.total)}</div>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(estimate.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    {estimate.projectType}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                    {estimate.paintQuality}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
                    {estimate.rooms.length} {estimate.rooms.length === 1 ? "Room" : "Rooms"}
                  </span>
                </div>
                <div className="flex justify-end">
                  <Link href={`/estimate/${estimate.id}`}>
                    <Button variant="ghost" className="flex items-center gap-1">
                      View Details
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
