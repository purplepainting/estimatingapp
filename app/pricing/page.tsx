"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { PRICING_DATA, type PricingItem } from "@/lib/pricing-data"

export default function PricingPage() {
  const { toast } = useToast()
  const [pricingData, setPricingData] = useState<PricingItem[]>(PRICING_DATA)
  const [percentageIncrease, setPercentageIncrease] = useState<number>(0)

  useEffect(() => {
    // Load custom pricing from localStorage if available
    const savedPricing = localStorage.getItem("customPricing")
    if (savedPricing) {
      setPricingData(JSON.parse(savedPricing))
    }
  }, [])

  const savePricing = () => {
    localStorage.setItem("customPricing", JSON.stringify(pricingData))
    toast({
      title: "Pricing saved",
      description: "Your custom pricing has been saved successfully.",
    })
  }

  const applyPercentageIncrease = () => {
    if (percentageIncrease === 0) return

    const multiplier = 1 + percentageIncrease / 100
    const updatedPricing = pricingData.map((item) => ({
      ...item,
      commercial: {
        spot1coat: Math.round(item.commercial.spot1coat * multiplier * 100) / 100,
        spot2coats: Math.round(item.commercial.spot2coats * multiplier * 100) / 100,
        prime2coats: Math.round(item.commercial.prime2coats * multiplier * 100) / 100,
      },
      production: {
        spot1coat: Math.round(item.production.spot1coat * multiplier * 100) / 100,
        spot2coats: Math.round(item.production.spot2coats * multiplier * 100) / 100,
        prime2coats: Math.round(item.production.prime2coats * multiplier * 100) / 100,
      },
      residential: {
        spot1coat: Math.round(item.residential.spot1coat * multiplier * 100) / 100,
        spot2coats: Math.round(item.residential.spot2coats * multiplier * 100) / 100,
        prime2coats: Math.round(item.residential.prime2coats * multiplier * 100) / 100,
      },
      highEnd: {
        spot1coat: Math.round(item.highEnd.spot1coat * multiplier * 100) / 100,
        spot2coats: Math.round(item.highEnd.spot2coats * multiplier * 100) / 100,
        prime2coats: Math.round(item.highEnd.prime2coats * multiplier * 100) / 100,
      },
    }))

    setPricingData(updatedPricing)
    setPercentageIncrease(0)

    toast({
      title: "Pricing updated",
      description: `All rates increased by ${percentageIncrease}%`,
    })
  }

  const resetToDefault = () => {
    setPricingData(PRICING_DATA)
    localStorage.removeItem("customPricing")
    toast({
      title: "Pricing reset",
      description: "Pricing has been reset to default values.",
    })
  }

  const updatePrice = (
    itemIndex: number,
    qualityLevel: keyof PricingItem["commercial"],
    coatingType: keyof PricingItem["commercial"]["spot1coat"],
    value: number,
  ) => {
    const updatedPricing = [...pricingData]
    ;(updatedPricing[itemIndex][qualityLevel] as any)[coatingType] = value
    setPricingData(updatedPricing)
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-gray-900">Pricing Management</h1>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Estimator
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Bulk Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Bulk Pricing Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="percentage">Increase all rates by:</Label>
                  <Input
                    id="percentage"
                    type="number"
                    value={percentageIncrease}
                    onChange={(e) => setPercentageIncrease(Number(e.target.value))}
                    className="w-20"
                    step="0.1"
                  />
                  <span>%</span>
                </div>
                <Button onClick={applyPercentageIncrease} disabled={percentageIncrease === 0}>
                  Apply Increase
                </Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={savePricing} className="flex items-center gap-1">
                  <Save className="h-4 w-4" />
                  Save Pricing
                </Button>
                <Button onClick={resetToDefault} variant="outline" className="flex items-center gap-1">
                  <Trash2 className="h-4 w-4" />
                  Reset to Default
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Interior Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Interior Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Substrate</th>
                      <th className="text-left p-2">Description</th>
                      <th className="text-left p-2">Unit</th>
                      <th className="text-center p-2">Commercial</th>
                      <th className="text-center p-2">Production</th>
                      <th className="text-center p-2">Residential</th>
                      <th className="text-center p-2">High End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingData
                      .filter((item) => item.description.includes("interior") || item.substrateType === "Doors")
                      .map((item, index) => {
                        const originalIndex = pricingData.findIndex((p) => p === item)
                        return (
                          <tr key={originalIndex} className="border-b">
                            <td className="p-2 font-medium">{item.substrateType}</td>
                            <td className="p-2">{item.description}</td>
                            <td className="p-2">{item.unit}</td>
                            <td className="p-2">
                              <div className="space-y-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.commercial.spot1coat}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "commercial", "spot1coat", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.commercial.spot2coats}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "commercial", "spot2coats", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.commercial.prime2coats}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "commercial", "prime2coats", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="space-y-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.production.spot1coat}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "production", "spot1coat", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.production.spot2coats}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "production", "spot2coats", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.production.prime2coats}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "production", "prime2coats", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="space-y-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.residential.spot1coat}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "residential", "spot1coat", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.residential.spot2coats}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "residential", "spot2coats", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.residential.prime2coats}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "residential", "prime2coats", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="space-y-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.highEnd.spot1coat}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "highEnd", "spot1coat", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.highEnd.spot2coats}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "highEnd", "spot2coats", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.highEnd.prime2coats}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "highEnd", "prime2coats", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Exterior Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Exterior Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Substrate</th>
                      <th className="text-left p-2">Description</th>
                      <th className="text-left p-2">Unit</th>
                      <th className="text-center p-2">Commercial</th>
                      <th className="text-center p-2">Production</th>
                      <th className="text-center p-2">Residential</th>
                      <th className="text-center p-2">High End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingData
                      .filter((item) => item.description.includes("exterior"))
                      .map((item, index) => {
                        const originalIndex = pricingData.findIndex((p) => p === item)
                        return (
                          <tr key={originalIndex} className="border-b">
                            <td className="p-2 font-medium">{item.substrateType}</td>
                            <td className="p-2">{item.description}</td>
                            <td className="p-2">{item.unit}</td>
                            <td className="p-2">
                              <div className="space-y-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.commercial.spot1coat}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "commercial", "spot1coat", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.commercial.spot2coats}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "commercial", "spot2coats", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.commercial.prime2coats}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "commercial", "prime2coats", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="space-y-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.production.spot1coat}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "production", "spot1coat", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.production.spot2coats}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "production", "spot2coats", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.production.prime2coats}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "production", "prime2coats", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="space-y-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.residential.spot1coat}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "residential", "spot1coat", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.residential.spot2coats}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "residential", "spot2coats", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.residential.prime2coats}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "residential", "prime2coats", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="space-y-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.highEnd.spot1coat}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "highEnd", "spot1coat", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.highEnd.spot2coats}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "highEnd", "spot2coats", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.highEnd.prime2coats}
                                  onChange={(e) =>
                                    updatePrice(originalIndex, "highEnd", "prime2coats", Number(e.target.value))
                                  }
                                  className="w-20 text-xs"
                                />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="text-sm text-gray-600">
            <p>
              <strong>Note:</strong> Each column represents: Spot + 1 Coat / Spot + 2 Coats / Prime + 2 Coats
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
