"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { v4 as uuidv4 } from "uuid"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Plus, Trash2 } from "lucide-react"
import { useFieldArray, useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { cn, formatCurrency } from "@/lib/utils"
import type { Estimate, InteriorRoom, ExteriorMeasurement, LineItem } from "@/types/estimate"
import {
  getPricing,
  getWindowPrice,
  getDoorPrice,
  getCabinetFrontPrice,
  type QualityLevel,
  type CoatingType,
} from "@/lib/pricing-data"

const lineItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  substrateType: z.string(),
  description: z.string(),
  unit: z.string(),
  quantity: z.number(),
  coatingType: z.enum(["spot1coat", "spot2coats", "prime2coats"]),
  unitPrice: z.number(),
  totalPrice: z.number(),
})

const windowItemSchema = z.object({
  type: z.enum(["woodDividedLight", "woodSingleFrame", "metalSingleFrame", "metalDividedLight"]),
  size: z.enum(["small", "medium", "large"]),
  isStained: z.boolean(),
  count: z.number().min(0),
})

const doorItemSchema = z.object({
  type: z.enum(["pocket", "slab", "closet", "louver", "dividedLight", "hollowMetal"]),
  isStained: z.boolean(),
  count: z.number().min(0),
})

const interiorRoomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  length: z.coerce.number().min(1, "Length must be at least 1"),
  width: z.coerce.number().min(1, "Width must be at least 1"),
  height: z.coerce.number().min(1, "Height must be at least 1"),
  surfaceType: z.string().min(1, "Surface type is required"),
  windows: z.array(windowItemSchema).optional().default([]),
  doors: z.array(doorItemSchema).optional().default([]),
  includeBaseboards: z.boolean().default(false),
  includeCeiling: z.boolean().default(true),
  lineItems: z.array(lineItemSchema).optional(),
  cost: z.number().optional(),
})

const exteriorMeasurementSchema = z.object({
  measurementType: z.enum(["elevation", "perimeter"]),
  elevations: z
    .array(
      z.object({
        name: z.string().min(1, "Elevation name is required"),
        width: z.coerce.number().min(1, "Width must be at least 1"),
        height: z.coerce.number().min(1, "Height must be at least 1"),
        windowCount: z.coerce.number().min(0, "Window count cannot be negative"),
        doorCount: z.coerce.number().min(0, "Door count cannot be negative"),
      }),
    )
    .optional(),
  perimeter: z.coerce.number().optional(),
  averageHeight: z.coerce.number().optional(),
  totalWindowCount: z.coerce.number().optional(),
  totalDoorCount: z.coerce.number().optional(),
  eaveLength: z.coerce.number().min(0, "Eave length cannot be negative"),
  includeBody: z.boolean().default(true),
  includeEaves: z.boolean().default(false),
  includeFascia: z.boolean().default(false),
  lineItems: z.array(lineItemSchema).optional(),
  cost: z.number().optional(),
})

const cabinetryItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  type: z.enum(["upper", "lower", "island", "pantry", "vanity"]),
  smallFronts: z.coerce.number().min(0, "Cannot be negative"),
  mediumFronts: z.coerce.number().min(0, "Cannot be negative"),
  largeFronts: z.coerce.number().min(0, "Cannot be negative"),
  drawerFronts: z.coerce.number().min(0, "Cannot be negative"),
  isStainToConversion: z.boolean().default(false),
  coatingType: z.enum(["spot1coat", "spot2coats", "prime2coats"]),
  lineItems: z.array(lineItemSchema).optional(),
  cost: z.number().optional(),
})

const formSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Invalid email address"),
  clientPhone: z.string().min(1, "Phone number is required"),
  projectAddress: z.string().min(1, "Project address is required"),
  projectCategory: z.string().min(1, "Project category is required"),
  projectType: z.string().min(1, "Project type is required"),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  paintQuality: z.string().min(1, "Paint quality is required"),
  qualityLevel: z.string().min(1, "Quality level is required"),
  interiorRooms: z.array(interiorRoomSchema).optional(),
  exteriorMeasurement: exteriorMeasurementSchema.optional(),
  cabinetryItems: z.array(cabinetryItemSchema).optional(),
  additionalCosts: z.coerce.number().min(0, "Additional costs cannot be negative"),
  notes: z.string().optional(),
})

// Map surface types to substrate types for pricing
const SURFACE_TYPE_MAPPING: Record<string, string> = {
  Drywall: "Gypsum board",
  Plaster: "Gypsum board",
  Wood: "Wood",
  Brick: "Masonry",
  Concrete: "Masonry",
  Metal: "Metal",
}

// Calculate square footage for an interior room walls (no deductions for doors/windows)
function calculateInteriorRoomWallArea(room: InteriorRoom): number {
  // Calculate wall area: 2 walls of length×height + 2 walls of width×height
  // No deductions for doors/windows since cutting in adds work
  const wallArea = 2 * (Number(room.length) * Number(room.height)) + 2 * (Number(room.width) * Number(room.height))
  return wallArea
}

// Calculate ceiling area for a room
function calculateCeilingArea(room: InteriorRoom): number {
  return Number(room.length) * Number(room.width)
}

// Calculate baseboard length for a room
function calculateBaseboardLength(room: InteriorRoom): number {
  return 2 * (Number(room.length) + Number(room.width))
}

// Calculate square footage for exterior measurement (no deductions for doors/windows)
function calculateExteriorSquareFootage(measurement: ExteriorMeasurement): number {
  let bodyArea = 0

  if (measurement.measurementType === "elevation" && measurement.elevations) {
    bodyArea = measurement.elevations.reduce((total, elevation) => {
      // No deductions for doors/windows since cutting in adds work
      const elevationArea = Number(elevation.width) * Number(elevation.height)
      return total + elevationArea
    }, 0)
  } else if (measurement.measurementType === "perimeter" && measurement.perimeter && measurement.averageHeight) {
    // No deductions for doors/windows since cutting in adds work
    bodyArea = Number(measurement.perimeter) * Number(measurement.averageHeight)
  }

  return bodyArea
}

export default function EstimateForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [calculatedValues, setCalculatedValues] = useState({
    materialsCost: 0,
    laborCost: 0,
    overheadCost: 0,
    profitCost: 0,
    subtotal: 0,
    total: 0,
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      projectAddress: "",
      projectCategory: "",
      projectType: "",
      paintQuality: "",
      qualityLevel: "commercial",
      startDate: new Date(),
      interiorRooms: [
        {
          name: "",
          length: 0,
          width: 0,
          height: 0,
          surfaceType: "Drywall",
          windows: [],
          doors: [],
          includeBaseboards: false,
          includeCeiling: true,
          lineItems: [],
          cost: 0,
        },
      ],
      exteriorMeasurement: {
        measurementType: "perimeter",
        perimeter: 0,
        averageHeight: 0,
        totalWindowCount: 0,
        totalDoorCount: 0,
        eaveLength: 0,
        includeBody: true,
        includeEaves: false,
        includeFascia: false,
        lineItems: [],
        cost: 0,
      },
      cabinetryItems: [],
      additionalCosts: 0,
      notes: "",
    },
  })

  const {
    fields: roomFields,
    append: appendRoom,
    remove: removeRoom,
  } = useFieldArray({
    control: form.control,
    name: "interiorRooms",
  })

  const {
    fields: elevationFields,
    append: appendElevation,
    remove: removeElevation,
  } = useFieldArray({
    control: form.control,
    name: "exteriorMeasurement.elevations",
  })

  const {
    fields: cabinetryFields,
    append: appendCabinetry,
    remove: removeCabinetry,
  } = useFieldArray({
    control: form.control,
    name: "cabinetryItems",
  })

  // Create field arrays for windows and doors in each room
  const roomWindowsArrays = roomFields.map((_, index) => {
    return useFieldArray({
      control: form.control,
      name: `interiorRooms.${index}.windows`,
    })
  })

  const roomDoorsArrays = roomFields.map((_, index) => {
    return useFieldArray({
      control: form.control,
      name: `interiorRooms.${index}.doors`,
    })
  })

  const projectCategory = form.watch("projectCategory")
  const exteriorMeasurementType = form.watch("exteriorMeasurement.measurementType")

  // Calculate costs function
  const calculateCosts = useCallback((data: z.infer<typeof formSchema>) => {
    if (!data.qualityLevel || !data.projectCategory) return

    let totalLaborCost = 0
    let totalMaterialCost = 0
    const allLineItems: LineItem[] = []
    const qualityLevel = data.qualityLevel as QualityLevel

    // Calculate interior room costs
    if ((data.projectCategory === "Interior" || data.projectCategory === "Both") && data.interiorRooms) {
      data.interiorRooms.forEach((room) => {
        if (!room.length || !room.width || !room.height || !room.surfaceType) return

        let roomLaborCost = 0
        let roomMaterialCost = 0

        // Wall line item
        const wallArea = calculateInteriorRoomWallArea(room)
        if (wallArea > 0) {
          const substrateType = SURFACE_TYPE_MAPPING[room.surfaceType] || "Gypsum board"
          const wallDescription = room.height > 10 ? "interior wall over 10' high" : "interior walls under 10' high"
          const wallUnitPrice = getPricing(substrateType, wallDescription, qualityLevel, "spot2coats")

          // Since the price sheet already includes materials, we don't add them separately
          const wallTotalPrice = wallArea * wallUnitPrice

          const wallLineItem: LineItem = {
            id: uuidv4(),
            name: "Walls",
            substrateType,
            description: wallDescription,
            unit: "sq ft",
            quantity: wallArea,
            coatingType: "spot2coats",
            unitPrice: wallUnitPrice,
            totalPrice: wallTotalPrice,
          }

          allLineItems.push(wallLineItem)
          roomLaborCost += wallTotalPrice
        }

        // Ceiling line item
        if (room.includeCeiling) {
          const ceilingArea = calculateCeilingArea(room)
          const ceilingUnitPrice = getPricing("Gypsum board", "interior ceilings", qualityLevel, "spot1coat")

          // Since the price sheet already includes materials, we don't add them separately
          const ceilingTotalPrice = ceilingArea * ceilingUnitPrice

          const ceilingLineItem: LineItem = {
            id: uuidv4(),
            name: "Ceiling",
            substrateType: "Gypsum board",
            description: "interior ceilings",
            unit: "sq ft",
            quantity: ceilingArea,
            coatingType: "spot1coat",
            unitPrice: ceilingUnitPrice,
            totalPrice: ceilingTotalPrice,
          }

          allLineItems.push(ceilingLineItem)
          roomLaborCost += ceilingTotalPrice
        }

        // Baseboard line item
        if (room.includeBaseboards) {
          const baseboardLength = calculateBaseboardLength(room)
          const baseboardUnitPrice = getPricing("Wood", "interior baseboards", qualityLevel, "spot2coats")

          // Since the price sheet already includes materials, we don't add them separately
          const baseboardTotalPrice = baseboardLength * baseboardUnitPrice

          const baseboardLineItem: LineItem = {
            id: uuidv4(),
            name: "Baseboards",
            substrateType: "Wood",
            description: "interior baseboards",
            unit: "ln ft",
            quantity: baseboardLength,
            coatingType: "spot2coats",
            unitPrice: baseboardUnitPrice,
            totalPrice: baseboardTotalPrice,
          }

          allLineItems.push(baseboardLineItem)
          roomLaborCost += baseboardTotalPrice
        }

        // Window line items
        if (room.windows && room.windows.length > 0) {
          room.windows.forEach((window) => {
            if (window.count > 0) {
              const windowPrice = getWindowPrice(window.type, window.size, window.isStained, qualityLevel)
              const windowTotalPrice = window.count * windowPrice

              const windowTypeNames = {
                woodDividedLight: "Wood Divided Light",
                woodSingleFrame: "Wood Single Frame",
                metalSingleFrame: "Metal Single Frame",
                metalDividedLight: "Metal Divided Light",
              }

              const windowSizeNames = {
                small: "Small",
                medium: "Medium",
                large: "Large",
              }

              const windowLineItem: LineItem = {
                id: uuidv4(),
                name: `${windowTypeNames[window.type]} Window (${windowSizeNames[window.size]})`,
                substrateType: window.type.includes("wood") ? "Wood" : "Metal",
                description: window.isStained ? "Stained" : "Painted",
                unit: "each",
                quantity: window.count,
                coatingType: "spot2coats",
                unitPrice: windowPrice,
                totalPrice: windowTotalPrice,
              }

              allLineItems.push(windowLineItem)
              roomLaborCost += windowTotalPrice
            }
          })
        }

        // Door line items
        if (room.doors && room.doors.length > 0) {
          room.doors.forEach((door) => {
            if (door.count > 0) {
              const doorPrice = getDoorPrice(door.type, door.isStained, qualityLevel)
              const doorTotalPrice = door.count * doorPrice

              const doorTypeNames = {
                pocket: "Pocket Door",
                slab: "Slab Door",
                closet: "Closet Door",
                louver: "Louver Door",
                dividedLight: "Divided Light Door",
                hollowMetal: "Hollow Metal Door",
              }

              const doorLineItem: LineItem = {
                id: uuidv4(),
                name: doorTypeNames[door.type],
                substrateType: door.type === "hollowMetal" ? "Metal" : "Wood",
                description: door.isStained ? "Stained" : "Painted",
                unit: "each",
                quantity: door.count,
                coatingType: "spot2coats",
                unitPrice: doorPrice,
                totalPrice: doorTotalPrice,
              }

              allLineItems.push(doorLineItem)
              roomLaborCost += doorTotalPrice
            }
          })
        }

        // Since the price sheet already includes materials, we estimate materials as 30% of labor
        roomMaterialCost = roomLaborCost * 0.3

        // Adjust labor cost to be 70% of the total
        roomLaborCost = roomLaborCost * 0.7

        totalLaborCost += roomLaborCost
        totalMaterialCost += roomMaterialCost
      })
    }

    // Calculate exterior costs
    if ((data.projectCategory === "Exterior" || data.projectCategory === "Both") && data.exteriorMeasurement) {
      let exteriorLaborCost = 0
      let exteriorMaterialCost = 0

      // Body/Siding cost
      if (data.exteriorMeasurement.includeBody) {
        const bodyArea = calculateExteriorSquareFootage(data.exteriorMeasurement)
        const sidingUnitPrice = getPricing("Wood", "exterior siding", qualityLevel, "spot2coats")

        // Since the price sheet already includes materials, we don't add them separately
        const sidingTotalPrice = bodyArea * sidingUnitPrice

        const sidingLineItem: LineItem = {
          id: uuidv4(),
          name: "Siding",
          substrateType: "Wood",
          description: "exterior siding",
          unit: "sq ft",
          quantity: bodyArea,
          coatingType: "spot2coats",
          unitPrice: sidingUnitPrice,
          totalPrice: sidingTotalPrice,
        }

        allLineItems.push(sidingLineItem)
        exteriorLaborCost += sidingTotalPrice
      }

      // Eaves cost
      if (data.exteriorMeasurement.includeEaves && data.exteriorMeasurement.eaveLength) {
        const eaveWidth = 2 // Assume 2 feet average eave width
        const eaveArea = Number(data.exteriorMeasurement.eaveLength) * eaveWidth
        const eaveUnitPrice = getPricing("Wood", "exterior eaves", qualityLevel, "spot1coat")

        // Since the price sheet already includes materials, we don't add them separately
        const eaveTotalPrice = eaveArea * eaveUnitPrice

        const eaveLineItem: LineItem = {
          id: uuidv4(),
          name: "Eaves",
          substrateType: "Wood",
          description: "exterior eaves",
          unit: "sq ft",
          quantity: eaveArea,
          coatingType: "spot1coat",
          unitPrice: eaveUnitPrice,
          totalPrice: eaveTotalPrice,
        }

        allLineItems.push(eaveLineItem)
        exteriorLaborCost += eaveTotalPrice
      }

      // Fascia cost
      if (data.exteriorMeasurement.includeFascia && data.exteriorMeasurement.eaveLength) {
        const fasciaLength = Number(data.exteriorMeasurement.eaveLength)
        const fasciaUnitPrice = getPricing("Wood", "exterior fascia board", qualityLevel, "spot2coats")

        // Since the price sheet already includes materials, we don't add them separately
        const fasciaTotalPrice = fasciaLength * fasciaUnitPrice

        const fasciaLineItem: LineItem = {
          id: uuidv4(),
          name: "Fascia",
          substrateType: "Wood",
          description: "exterior fascia board",
          unit: "ln ft",
          quantity: fasciaLength,
          coatingType: "spot2coats",
          unitPrice: fasciaUnitPrice,
          totalPrice: fasciaTotalPrice,
        }

        allLineItems.push(fasciaLineItem)
        exteriorLaborCost += fasciaTotalPrice
      }

      // Since the price sheet already includes materials, we estimate materials as 30% of labor
      exteriorMaterialCost = exteriorLaborCost * 0.3

      // Adjust labor cost to be 70% of the total
      exteriorLaborCost = exteriorLaborCost * 0.7

      totalLaborCost += exteriorLaborCost
      totalMaterialCost += exteriorMaterialCost
    }

    // Calculate cabinetry costs
    if (data.cabinetryItems) {
      data.cabinetryItems.forEach((item) => {
        let cabinetryLaborCost = 0
        let cabinetryMaterialCost = 0

        // Small fronts
        if (item.smallFronts > 0) {
          const smallFrontPrice = getCabinetFrontPrice("small", qualityLevel)
          const smallFrontTotalPrice = item.smallFronts * smallFrontPrice

          const smallFrontLineItem: LineItem = {
            id: uuidv4(),
            name: `${item.name} - Small Fronts`,
            substrateType: "Wood",
            description: "Cabinet Fronts",
            unit: "each",
            quantity: item.smallFronts,
            coatingType: item.coatingType as CoatingType,
            unitPrice: smallFrontPrice,
            totalPrice: smallFrontTotalPrice,
          }

          allLineItems.push(smallFrontLineItem)
          cabinetryLaborCost += smallFrontTotalPrice
        }

        // Medium fronts
        if (item.mediumFronts > 0) {
          const mediumFrontPrice = getCabinetFrontPrice("medium", qualityLevel)
          const mediumFrontTotalPrice = item.mediumFronts * mediumFrontPrice

          const mediumFrontLineItem: LineItem = {
            id: uuidv4(),
            name: `${item.name} - Medium Fronts`,
            substrateType: "Wood",
            description: "Cabinet Fronts",
            unit: "each",
            quantity: item.mediumFronts,
            coatingType: item.coatingType as CoatingType,
            unitPrice: mediumFrontPrice,
            totalPrice: mediumFrontTotalPrice,
          }

          allLineItems.push(mediumFrontLineItem)
          cabinetryLaborCost += mediumFrontTotalPrice
        }

        // Large fronts
        if (item.largeFronts > 0) {
          const largeFrontPrice = getCabinetFrontPrice("large", qualityLevel)
          const largeFrontTotalPrice = item.largeFronts * largeFrontPrice

          const largeFrontLineItem: LineItem = {
            id: uuidv4(),
            name: `${item.name} - Large Fronts`,
            substrateType: "Wood",
            description: "Cabinet Fronts",
            unit: "each",
            quantity: item.largeFronts,
            coatingType: item.coatingType as CoatingType,
            unitPrice: largeFrontPrice,
            totalPrice: largeFrontTotalPrice,
          }

          allLineItems.push(largeFrontLineItem)
          cabinetryLaborCost += largeFrontTotalPrice
        }

        // Drawer fronts
        if (item.drawerFronts > 0) {
          const drawerFrontPrice = getCabinetFrontPrice("drawer", qualityLevel)
          const drawerFrontTotalPrice = item.drawerFronts * drawerFrontPrice

          const drawerFrontLineItem: LineItem = {
            id: uuidv4(),
            name: `${item.name} - Drawer Fronts`,
            substrateType: "Wood",
            description: "Cabinet Fronts",
            unit: "each",
            quantity: item.drawerFronts,
            coatingType: item.coatingType as CoatingType,
            unitPrice: drawerFrontPrice,
            totalPrice: drawerFrontTotalPrice,
          }

          allLineItems.push(drawerFrontLineItem)
          cabinetryLaborCost += drawerFrontTotalPrice
        }

        // Apply stain-to-paint conversion surcharge if needed (50% more)
        if (item.isStainToConversion) {
          const conversionSurcharge = cabinetryLaborCost * 0.5

          const conversionLineItem: LineItem = {
            id: uuidv4(),
            name: `${item.name} - Stain-to-Paint Conversion`,
            substrateType: "Wood",
            description: "Conversion Surcharge",
            unit: "each",
            quantity: 1,
            coatingType: item.coatingType as CoatingType,
            unitPrice: conversionSurcharge,
            totalPrice: conversionSurcharge,
          }

          allLineItems.push(conversionLineItem)
          cabinetryLaborCost += conversionSurcharge
        }

        // Since the price sheet already includes materials, we estimate materials as 30% of labor
        cabinetryMaterialCost = cabinetryLaborCost * 0.3

        // Adjust labor cost to be 70% of the total
        cabinetryLaborCost = cabinetryLaborCost * 0.7

        totalLaborCost += cabinetryLaborCost
        totalMaterialCost += cabinetryMaterialCost
      })
    }

    // Calculate based on actual business model:
    // Labor = 70% of the price, Materials = 30% of the price
    const laborCost = totalLaborCost
    const materialsCost = totalMaterialCost
    const overheadCost = laborCost * 0.3 // Overhead is 30% of labor cost (15%/50%)
    const profitCost = laborCost * 0.4 // Profit is 40% of labor cost (20%/50%)

    // Calculate subtotal and total
    const subtotal = laborCost + materialsCost + overheadCost + Number(data.additionalCosts || 0)
    const total = subtotal + profitCost

    setLineItems(allLineItems)
    setCalculatedValues({
      materialsCost,
      laborCost,
      overheadCost,
      profitCost,
      subtotal,
      total,
    })
  }, [])

  // Watch form changes and recalculate
  useEffect(() => {
    const subscription = form.watch((data) => {
      calculateCosts(data as z.infer<typeof formSchema>)
    })
    return () => subscription.unsubscribe()
  }, [form, calculateCosts])

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Create the estimate object
    const estimate: Estimate = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      ...data,
      materialsCost: calculatedValues.materialsCost,
      laborCost: calculatedValues.laborCost,
      subtotal: calculatedValues.subtotal,
      taxAmount: 0,
      total: calculatedValues.total,
    }

    // Save to localStorage
    const savedEstimates = JSON.parse(localStorage.getItem("paintEstimates") || "[]")
    savedEstimates.push(estimate)
    localStorage.setItem("paintEstimates", JSON.stringify(savedEstimates))

    toast({
      title: "Estimate created",
      description: "Your estimate has been saved successfully.",
    })

    // Navigate to the estimate detail page
    router.push(`/estimate/${estimate.id}`)
  }

  const addRoom = () => {
    appendRoom({
      name: "",
      length: 0,
      width: 0,
      height: 0,
      surfaceType: "Drywall",
      windows: [],
      doors: [],
      includeBaseboards: false,
      includeCeiling: true,
      lineItems: [],
      cost: 0,
    })
  }

  const addElevation = () => {
    appendElevation({
      name: "",
      width: 0,
      height: 0,
      windowCount: 0,
      doorCount: 0,
    })
  }

  const addCabinetry = () => {
    appendCabinetry({
      name: "",
      type: "upper",
      smallFronts: 0,
      mediumFronts: 0,
      largeFronts: 0,
      drawerFronts: 0,
      isStainToConversion: false,
      coatingType: "spot2coats",
      lineItems: [],
      cost: 0,
    })
  }

  const addWindow = (roomIndex: number) => {
    roomWindowsArrays[roomIndex].append({
      type: "woodSingleFrame",
      size: "medium",
      isStained: false,
      count: 1,
    })
  }

  const addDoor = (roomIndex: number) => {
    roomDoorsArrays[roomIndex].append({
      type: "slab",
      isStained: false,
      count: 1,
    })
  }

  // Get pricing for a specific room component
  const getRoomComponentPrice = (
    roomIndex: number,
    surfaceType: string,
    height: number,
    qualityLevel: QualityLevel,
  ) => {
    const substrateType = SURFACE_TYPE_MAPPING[surfaceType] || "Gypsum board"
    const wallDescription = height > 10 ? "interior wall over 10' high" : "interior walls under 10' high"
    return getPricing(substrateType, wallDescription, qualityLevel, "spot2coats")
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Client Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="client@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="projectAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, Anytown, USA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Project Details</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="projectCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Interior">Interior</SelectItem>
                        <SelectItem value="Exterior">Exterior</SelectItem>
                        <SelectItem value="Both">Both Interior & Exterior</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="projectType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(projectCategory === "Interior" || projectCategory === "Both") && (
                          <>
                            <SelectItem value="Residential Interior">Residential Interior</SelectItem>
                            <SelectItem value="Commercial Interior">Commercial Interior</SelectItem>
                            <SelectItem value="New Construction Interior">New Construction Interior</SelectItem>
                            <SelectItem value="Interior Repaint">Interior Repaint</SelectItem>
                            <SelectItem value="Cabinet Painting">Cabinet Painting</SelectItem>
                            <SelectItem value="Trim & Doors">Trim & Doors</SelectItem>
                          </>
                        )}
                        {(projectCategory === "Exterior" || projectCategory === "Both") && (
                          <>
                            <SelectItem value="Residential Exterior">Residential Exterior</SelectItem>
                            <SelectItem value="Commercial Exterior">Commercial Exterior</SelectItem>
                            <SelectItem value="New Construction Exterior">New Construction Exterior</SelectItem>
                            <SelectItem value="Exterior Repaint">Exterior Repaint</SelectItem>
                            <SelectItem value="Deck & Fence">Deck & Fence</SelectItem>
                            <SelectItem value="Siding">Siding</SelectItem>
                            <SelectItem value="Trim & Shutters">Trim & Shutters</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? field.value.toLocaleDateString() : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paintQuality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paint Quality</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select paint quality" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Economy">Economy</SelectItem>
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="Premium">Premium</SelectItem>
                        <SelectItem value="Luxury">Luxury</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Affects material costs and durability</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="qualityLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quality Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quality level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="highEnd">High End</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Interior Rooms Section */}
        {(projectCategory === "Interior" || projectCategory === "Both") && (
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Rooms & Areas</h3>
                <Button type="button" onClick={addRoom} variant="outline" size="sm" className="flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  Add Room
                </Button>
              </div>

              {roomFields?.map((field, index) => {
                const room = form.watch(`interiorRooms.${index}`)
                const qualityLevel = form.watch("qualityLevel") as QualityLevel
                const wallArea = room.length && room.width && room.height ? calculateInteriorRoomWallArea(room) : 0
                const ceilingArea = room.length && room.width ? calculateCeilingArea(room) : 0
                const baseboardLength = room.length && room.width ? calculateBaseboardLength(room) : 0

                // Get unit prices
                const wallUnitPrice =
                  room.surfaceType && room.height
                    ? getRoomComponentPrice(index, room.surfaceType, room.height, qualityLevel)
                    : 0
                const ceilingUnitPrice = getPricing("Gypsum board", "interior ceilings", qualityLevel, "spot1coat")
                const baseboardUnitPrice = getPricing("Wood", "interior baseboards", qualityLevel, "spot2coats")

                return (
                  <div key={field.id} className="mb-6 last:mb-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Room {index + 1}</h4>
                      {roomFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRoom(index)}
                          className="h-8 text-destructive hover:text-destructive/90"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <FormField
                        control={form.control}
                        name={`interiorRooms.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Living Room" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`interiorRooms.${index}.surfaceType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Surface Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select surface type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Drywall">Drywall</SelectItem>
                                <SelectItem value="Plaster">Plaster</SelectItem>
                                <SelectItem value="Wood">Wood</SelectItem>
                                <SelectItem value="Brick">Brick</SelectItem>
                                <SelectItem value="Concrete">Concrete</SelectItem>
                                <SelectItem value="Metal">Metal</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`interiorRooms.${index}.length`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Length (feet)</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" step="0.1" {...field} />
                            </FormControl>
                            <FormDescription>Wall rate: {formatCurrency(wallUnitPrice)}/sq ft</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`interiorRooms.${index}.width`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Width (feet)</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" step="0.1" {...field} />
                            </FormControl>
                            <FormDescription>Ceiling rate: {formatCurrency(ceilingUnitPrice)}/sq ft</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`interiorRooms.${index}.height`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height (feet)</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" step="0.1" {...field} />
                            </FormControl>
                            <FormDescription>
                              Baseboard rate: {formatCurrency(baseboardUnitPrice)}/ln ft
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`interiorRooms.${index}.includeBaseboards`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Include Baseboards</FormLabel>
                              <FormDescription>Add baseboard painting to this room</FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`interiorRooms.${index}.includeCeiling`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Include Ceiling</FormLabel>
                              <FormDescription>Add ceiling painting to this room</FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Windows Section */}
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="font-medium">Windows</h5>
                        <Button
                          type="button"
                          onClick={() => addWindow(index)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Add Window
                        </Button>
                      </div>

                      {roomWindowsArrays[index]?.fields?.map((windowField, windowIndex) => (
                        <div
                          key={windowField.id}
                          className="grid gap-4 sm:grid-cols-5 items-end mb-4 p-4 border rounded-lg"
                        >
                          <FormField
                            control={form.control}
                            name={`interiorRooms.${index}.windows.${windowIndex}.type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Window Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="woodDividedLight">Wood Divided Light</SelectItem>
                                    <SelectItem value="woodSingleFrame">Wood Single Frame</SelectItem>
                                    <SelectItem value="metalSingleFrame">Metal Single Frame</SelectItem>
                                    <SelectItem value="metalDividedLight">Metal Divided Light</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`interiorRooms.${index}.windows.${windowIndex}.size`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Size</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select size" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="small">Small</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="large">Large</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`interiorRooms.${index}.windows.${windowIndex}.isStained`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Stained</FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`interiorRooms.${index}.windows.${windowIndex}.count`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Count</FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => roomWindowsArrays[index].remove(windowIndex)}
                            className="h-8 text-destructive hover:text-destructive/90"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Doors Section */}
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="font-medium">Doors</h5>
                        <Button
                          type="button"
                          onClick={() => addDoor(index)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Add Door
                        </Button>
                      </div>

                      {roomDoorsArrays[index]?.fields?.map((doorField, doorIndex) => (
                        <div
                          key={doorField.id}
                          className="grid gap-4 sm:grid-cols-4 items-end mb-4 p-4 border rounded-lg"
                        >
                          <FormField
                            control={form.control}
                            name={`interiorRooms.${index}.doors.${doorIndex}.type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Door Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="pocket">Pocket Door</SelectItem>
                                    <SelectItem value="slab">Slab Door</SelectItem>
                                    <SelectItem value="closet">Closet Door</SelectItem>
                                    <SelectItem value="louver">Louver Door</SelectItem>
                                    <SelectItem value="dividedLight">Divided Light Door</SelectItem>
                                    <SelectItem value="hollowMetal">Hollow Metal Door</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`interiorRooms.${index}.doors.${doorIndex}.isStained`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Stained</FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`interiorRooms.${index}.doors.${doorIndex}.count`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Count</FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => roomDoorsArrays[index].remove(doorIndex)}
                            className="h-8 text-destructive hover:text-destructive/90"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {index < roomFields.length - 1 && <Separator className="mt-6" />}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Exterior Measurements Section */}
        {(projectCategory === "Exterior" || projectCategory === "Both") && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Exterior Measurements</h3>

              <FormField
                control={form.control}
                name="exteriorMeasurement.measurementType"
                render={({ field }) => (
                  <FormItem className="mb-6">
                    <FormLabel>Measurement Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select measurement method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="perimeter">Perimeter & Height</SelectItem>
                        <SelectItem value="elevation">Individual Elevations</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {exteriorMeasurementType === "perimeter" && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                  <FormField
                    control={form.control}
                    name="exteriorMeasurement.perimeter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Perimeter (feet)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="exteriorMeasurement.averageHeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Average Height (feet)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="exteriorMeasurement.totalWindowCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Windows</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormDescription>For reference only (cutting in adds work)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="exteriorMeasurement.totalDoorCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Doors</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormDescription>For reference only (cutting in adds work)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {exteriorMeasurementType === "elevation" && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Elevations</h4>
                    <Button
                      type="button"
                      onClick={addElevation}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add Elevation
                    </Button>
                  </div>

                  {elevationFields?.map((field, index) => (
                    <div key={field.id} className="mb-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">Elevation {index + 1}</h5>
                        {elevationFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeElevation(index)}
                            className="h-8 text-destructive hover:text-destructive/90"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <FormField
                          control={form.control}
                          name={`exteriorMeasurement.elevations.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Elevation Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Front, Back, Left, Right" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`exteriorMeasurement.elevations.${index}.width`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Width (feet)</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" step="0.1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`exteriorMeasurement.elevations.${index}.height`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Height (feet)</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" step="0.1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`exteriorMeasurement.elevations.${index}.windowCount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Windows</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" {...field} />
                              </FormControl>
                              <FormDescription>For reference only</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`exteriorMeasurement.elevations.${index}.doorCount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Doors</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" {...field} />
                              </FormControl>
                              <FormDescription>For reference only</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                <FormField
                  control={form.control}
                  name="exteriorMeasurement.eaveLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Eave Length (feet)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.1" {...field} />
                      </FormControl>
                      <FormDescription>Total linear feet of eaves around building</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">What to Include</h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="exteriorMeasurement.includeBody"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Body/Siding</FormLabel>
                          <FormDescription>Main exterior walls</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="exteriorMeasurement.includeEaves"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Eaves</FormLabel>
                          <FormDescription>Underside of roof overhang</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="exteriorMeasurement.includeFascia"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Fascia</FormLabel>
                          <FormDescription>Trim boards along roofline</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cabinetry Section */}
        {projectCategory && (
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Cabinetry</h3>
                <Button
                  type="button"
                  onClick={addCabinetry}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Cabinetry
                </Button>
              </div>

              {cabinetryFields?.map((field, index) => (
                <div key={field.id} className="mb-6 last:mb-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Cabinetry Item {index + 1}</h4>
                    {cabinetryFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCabinetry(index)}
                        className="h-8 text-destructive hover:text-destructive/90"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <FormField
                      control={form.control}
                      name={`cabinetryItems.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Kitchen Cabinets" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`cabinetryItems.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="upper">Upper</SelectItem>
                              <SelectItem value="lower">Lower</SelectItem>
                              <SelectItem value="island">Island</SelectItem>
                              <SelectItem value="pantry">Pantry</SelectItem>
                              <SelectItem value="vanity">Vanity</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`cabinetryItems.${index}.coatingType`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Coating Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select coating type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="spot1coat">Spot 1 Coat</SelectItem>
                              <SelectItem value="spot2coats">Spot 2 Coats</SelectItem>
                              <SelectItem value="prime2coats">Prime + 2 Coats</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`cabinetryItems.${index}.smallFronts`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Small Fronts</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`cabinetryItems.${index}.mediumFronts`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medium Fronts</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`cabinetryItems.${index}.largeFronts`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Large Fronts</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`cabinetryItems.${index}.drawerFronts`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Drawer Fronts</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`cabinetryItems.${index}.isStainToConversion`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Stain-to-Paint Conversion</FormLabel>
                            <FormDescription>Adds 50% surcharge</FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {index < cabinetryFields.length - 1 && <Separator className="mt-6" />}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Additional Costs & Notes</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="additionalCosts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Costs</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormDescription>Any extra costs, e.g., travel, disposal fees</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Any important notes about the project" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Cost Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Labor:</span>
                <span className="text-gray-800">{formatCurrency(calculatedValues.laborCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Materials:</span>
                <span className="text-gray-800">{formatCurrency(calculatedValues.materialsCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Overhead (15%):</span>
                <span className="text-gray-800">{formatCurrency(calculatedValues.overheadCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Additional Costs:</span>
                <span className="text-gray-800">{formatCurrency(form.watch("additionalCosts") || 0)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span className="text-gray-800">Subtotal:</span>
                <span className="text-gray-800">{formatCurrency(calculatedValues.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Profit (20%):</span>
                <span className="text-gray-800">{formatCurrency(calculatedValues.profitCost)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(calculatedValues.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit">Create Estimate</Button>
      </form>
    </Form>
  )
}
