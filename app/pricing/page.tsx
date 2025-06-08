"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Save, Trash2, Plus, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { pricingConfig } from "@/lib/pricing/config"
import { SubstrateType, Unit, QualityLevel, CoatingType } from "@/lib/pricing/types"

const defaultQualityModifiers = {
  "Production": 0.75,
  "Commercial": 1.0,
  "Residential": 1.25,
  "High End": 1.5
}
const defaultCoatingModifiers = {
  "spot+1coat": 0.5,
  "spot+2coats": 0.75,
  "prime+2coats": 1.0,
  "colorChange": 1.25
}
const defaultStainModifiers = {
  standard: 1.3,
  custom: 2.0
}

const substrateTypes: SubstrateType[] = [
  "Gypsum board", "Wood", "Doors", "Windows", "Metal", "Masonry"
]
const unitTypes: Unit[] = ["sq ft", "ln ft", "ea", "hour"]
const qualityLevels: QualityLevel[] = ["Production", "Commercial", "Residential", "High End"]
const coatingTypes: CoatingType[] = ["spot+1coat", "spot+2coats", "prime+2coats"]

export default function PricingPage() {
  const { toast } = useToast()
  // Items: substrate, description, unit, price
  const [items, setItems] = useState<any[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem("customPricingItems") : null
    if (saved) {
      return JSON.parse(saved).map((item: any) => ({
        ...item,
        substrateType: item.substrateType as SubstrateType,
        unit: item.unit as Unit
      }))
    }
    // Flatten config to item list
    const rows: any[] = []
    Object.entries(pricingConfig.baseRates).forEach(([substrateType, descriptions]) => {
      Object.entries(descriptions).forEach(([description, coatingObj]) => {
        Object.entries(coatingObj).forEach(([key, item]) => {
          rows.push({
            substrateType: substrateType as SubstrateType,
            description,
            unit: item.unit as Unit,
            price: item.baseRate
          })
        })
      })
    })
    return rows
  })
  // Modifiers
  const [qualityModifiers, setQualityModifiers] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem("customQualityModifiers") : null
    if (saved) return JSON.parse(saved)
    return { ...defaultQualityModifiers }
  })
  const [coatingModifiers, setCoatingModifiers] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem("customCoatingModifiers") : null
    if (saved) return JSON.parse(saved)
    return { ...defaultCoatingModifiers }
  })
  const [stainModifiers, setStainModifiers] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem("customStainModifiers") : null
    if (saved) return JSON.parse(saved)
    return { ...defaultStainModifiers }
  })
  // New item state
  const [newItem, setNewItem] = useState({
    substrateType: substrateTypes[0],
    description: '',
    unit: unitTypes[0],
    price: 0
  })

  useEffect(() => {
    const saved = localStorage.getItem("customPricingItems")
    if (saved) setItems(JSON.parse(saved))
    const savedQ = localStorage.getItem("customQualityModifiers")
    if (savedQ) setQualityModifiers(JSON.parse(savedQ))
    const savedC = localStorage.getItem("customCoatingModifiers")
    if (savedC) setCoatingModifiers(JSON.parse(savedC))
    const savedS = localStorage.getItem("customStainModifiers")
    if (savedS) setStainModifiers(JSON.parse(savedS))
  }, [])

  const saveAll = () => {
    localStorage.setItem("customPricingItems", JSON.stringify(items))
    localStorage.setItem("customQualityModifiers", JSON.stringify(qualityModifiers))
    localStorage.setItem("customCoatingModifiers", JSON.stringify(coatingModifiers))
    localStorage.setItem("customStainModifiers", JSON.stringify(stainModifiers))
    toast({
      title: "Pricing saved",
      description: "Your custom pricing and modifiers have been saved successfully.",
    })
  }

  const resetAll = () => {
    localStorage.removeItem("customPricingItems")
    localStorage.removeItem("customQualityModifiers")
    localStorage.removeItem("customCoatingModifiers")
    localStorage.removeItem("customStainModifiers")
    window.location.reload()
  }

  const updateItem = (idx: number, key: string, value: any) => {
    const updated = [...items]
    updated[idx] = { ...updated[idx], [key]: value }
    setItems(updated)
  }

  const deleteItem = (idx: number) => {
    const updated = [...items]
    updated.splice(idx, 1)
    setItems(updated)
  }

  const addItem = () => {
    if (!newItem.description.trim()) return
    setItems([
      ...items,
      {
        ...newItem,
        substrateType: newItem.substrateType as SubstrateType,
        unit: newItem.unit as Unit
      }
    ])
    setNewItem({ substrateType: substrateTypes[0], description: '', unit: unitTypes[0], price: 0 })
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
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Item List Table */}
          <Card>
            <CardHeader>
              <CardTitle>Price List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto mb-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Substrate</th>
                      <th className="text-left p-2">Description</th>
                      <th className="text-left p-2">Unit</th>
                      <th className="text-left p-2">Price (prime+2coats)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2">
                          <select
                            value={row.substrateType}
                            onChange={e => updateItem(idx, 'substrateType', e.target.value as SubstrateType)}
                            className="border rounded px-2 py-1 text-xs"
                          >
                            {substrateTypes.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <Input
                            value={row.description}
                            onChange={e => updateItem(idx, 'description', e.target.value)}
                            className="w-48 text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={row.unit}
                            onChange={e => updateItem(idx, 'unit', e.target.value as Unit)}
                            className="border rounded px-2 py-1 text-xs"
                          >
                            {unitTypes.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={row.price}
                            onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                            className="w-24 text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <Button variant="ghost" size="icon" onClick={() => deleteItem(idx)}><X className="w-4 h-4" /></Button>
                        </td>
                      </tr>
                    ))}
                    {/* Add new item row */}
                    <tr>
                      <td className="p-2">
                        <select
                          value={newItem.substrateType}
                          onChange={e => setNewItem({ ...newItem, substrateType: e.target.value as SubstrateType })}
                          className="border rounded px-2 py-1 text-xs"
                        >
                          {substrateTypes.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="p-2">
                        <Input
                          value={newItem.description}
                          onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                          className="w-48 text-xs"
                          placeholder="New item description"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={newItem.unit}
                          onChange={e => setNewItem({ ...newItem, unit: e.target.value as Unit })}
                          className="border rounded px-2 py-1 text-xs"
                        >
                          {unitTypes.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={newItem.price}
                          onChange={e => setNewItem({ ...newItem, price: Number(e.target.value) })}
                          className="w-24 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <Button variant="ghost" size="icon" onClick={addItem}><Plus className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          {/* Modifiers Section */}
          <Card>
            <CardHeader>
              <CardTitle>Modifiers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Quality Modifiers</h3>
                  {qualityLevels.map(q => (
                    <div key={q} className="flex items-center gap-2 mb-1">
                      <Label className="w-24">{q}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={qualityModifiers[q]}
                        onChange={e => setQualityModifiers({ ...qualityModifiers, [q]: Number(e.target.value) })}
                        className="w-20 text-xs"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Coating Modifiers</h3>
                  {coatingTypes.map(c => (
                    <div key={c} className="flex items-center gap-2 mb-1">
                      <Label className="w-24">{c}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={coatingModifiers[c]}
                        onChange={e => setCoatingModifiers({ ...coatingModifiers, [c]: Number(e.target.value) })}
                        className="w-20 text-xs"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Stain Modifiers</h3>
                  {Object.keys(stainModifiers).map((s: string) => (
                    <div key={s} className="flex items-center gap-2 mb-1">
                      <Label className="w-24">{s}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={stainModifiers[s]}
                        onChange={e => setStainModifiers({ ...stainModifiers, [s]: Number(e.target.value) })}
                        className="w-20 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Save/Reset */}
          <div className="flex gap-2">
            <Button onClick={saveAll} className="flex items-center gap-1">
              <Save className="h-4 w-4" />
              Save All
            </Button>
            <Button onClick={resetAll} variant="outline" className="flex items-center gap-1">
              <Trash2 className="h-4 w-4" />
              Reset to Default
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
