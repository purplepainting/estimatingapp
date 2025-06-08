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
import { useToast } from "@/hooks/use-toast"
import { cn, formatCurrency } from "@/lib/utils"
import type { Estimate, InteriorRoom, ExteriorMeasurement, LineItem } from "@/types/estimate"
import {
  PricingService,
  pricingConfig,
  SubstrateType,
  CoatingType,
  QualityLevel,
  Unit
} from "@/lib/pricing"

// Create a singleton instance of the pricing service
const pricingService = PricingService.getInstance()

// Helper function to get price using the pricing service
function getPrice(
  substrateType: SubstrateType,
  category: string,
  item: string,
  coatingType: CoatingType,
  qualityLevel: QualityLevel,
  quantity: number = 1,
  isStained: boolean = false
): number {
  return pricingService.calculateTotal(substrateType, category, item, coatingType, qualityLevel, quantity, isStained)
}

// Helper function to get unit using the pricing service
function getUnit(substrateType: SubstrateType, category: string, item: string): Unit {
  return pricingService.getItemUnit(substrateType, category, item)
}

// Helper function to get item name using the pricing service
function getItemName(substrateType: SubstrateType, category: string, item: string): string {
  return pricingService.getItemName(substrateType, category, item)
}

// Helper function to get quality level name using the pricing service
function getQualityLevelName(qualityLevel: QualityLevel): string {
  return pricingService.getQualityLevelName(qualityLevel)
}

// Helper function to get quality level modifier using the pricing service
function getQualityLevelModifier(qualityLevel: QualityLevel): number {
  return pricingService.getQualityLevelModifier(qualityLevel)
}

// Helper function to get substrate categories using the pricing service
function getSubstrateCategories(substrateType: SubstrateType): string[] {
  return pricingService.getSubstrateCategories(substrateType)
}

// Helper function to get category items using the pricing service
function getCategoryItems(substrateType: SubstrateType, category: string): string[] {
  return pricingService.getCategoryItems(substrateType, category)
}

const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unit: z.string(),
  unitPrice: z.number(),
  total: z.number(),
})

const windowItemSchema = z.object({
  type: z.string(),
  size: z.string(),
  coatingType: z.enum(["spot+1coat", "spot+2coats", "prime+2coats"]),
  isStained: z.boolean(),
  count: z.number()
})

const doorItemSchema = z.object({
  type: z.string(),
  size: z.string(),
  coatingType: z.enum(["spot+1coat", "spot+2coats", "prime+2coats"]),
  isStained: z.boolean(),
  count: z.number()
})

const interiorRoomSchema = z.object({
  name: z.string(),
  length: z.number(),
  width: z.number(),
  height: z.number(),
  components: z.array(z.object({
    type: z.enum(["Walls", "Ceiling", "Baseboards", "Window", "Door"]),
    coatingType: z.enum(["spot+1coat", "spot+2coats", "prime+2coats"]),
    // Window specific fields
    windowType: z.string().optional(),
    windowSize: z.string().optional(),
    isStained: z.boolean().optional(),
    windowCount: z.number().optional(),
    // Door specific fields
    doorType: z.string().optional(),
    doorSize: z.string().optional(),
    doorCount: z.number().optional()
  }))
})

const exteriorWindowItemSchema = z.object({
  type: z.string(),
  size: z.string(),
  coatingType: z.enum(["spot+1coat", "spot+2coats", "prime+2coats"]),
  isStained: z.boolean(),
  count: z.number()
})

const exteriorDoorItemSchema = z.object({
  type: z.string(),
  size: z.string(),
  coatingType: z.enum(["spot+1coat", "spot+2coats", "prime+2coats"]),
  isStained: z.boolean(),
  count: z.number()
})

const exteriorMeasurementSchema = z.object({
  elevationName: z.string(),
  length: z.number(),
  height: z.number(),
  coatingType: z.enum(["spot+1coat", "spot+2coats", "prime+2coats"]),
  windows: z.array(exteriorWindowItemSchema).optional(),
  doors: z.array(exteriorDoorItemSchema).optional()
})

const cabinetryItemSchema = z.object({
  itemName: z.string(),
  type: z.string(),
  fronts: z.number(),
  drawers: z.number(),
  coatingType: z.enum(["spot+1coat", "spot+2coats", "prime+2coats"])
})

const customItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Item name is required"),
  description: z.string(),
  unit: z.enum(["sq ft", "ln ft", "each", "hour"]),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative"),
  totalPrice: z.number(),
})

const formSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  projectCategory: z.enum(["Interior", "Exterior", "Both"]),
  qualityLevel: z.enum(["Commercial", "Production", "Residential", "High End"]),
  defaultCoatingType: z.enum(["spot+1coat", "spot+2coats", "prime+2coats"]),
  interiorRooms: z.array(z.object({
    name: z.string().min(1, "Room name is required"),
    length: z.number().min(0),
    width: z.number().min(0),
    height: z.number().min(0),
    components: z.array(z.object({
      type: z.enum(["Walls", "Ceiling", "Baseboards", "Window", "Door"]),
      coatingType: z.enum(["spot+1coat", "spot+2coats", "prime+2coats"]),
      windowType: z.string().optional(),
      windowSize: z.string().optional(),
      isStained: z.boolean().optional(),
      windowCount: z.number().optional(),
      doorType: z.string().optional(),
      doorSize: z.string().optional(),
      doorCount: z.number().optional()
    }))
  })),
  exteriorMeasurements: z.array(z.object({
    elevationName: z.string().min(1, "Elevation name is required"),
    length: z.number().min(0),
    height: z.number().min(0),
    coatingType: z.enum(["spot+1coat", "spot+2coats", "prime+2coats"]),
    windows: z.array(z.object({
      type: z.string(),
      size: z.string(),
      coatingType: z.enum(["spot+1coat", "spot+2coats", "prime+2coats"]),
      isStained: z.boolean(),
      count: z.number()
    })).optional(),
    doors: z.array(z.object({
      type: z.string(),
      size: z.string(),
      coatingType: z.enum(["spot+1coat", "spot+2coats", "prime+2coats"]),
      isStained: z.boolean(),
      count: z.number()
    })).optional()
  })),
  cabinetry: z.array(z.object({
    itemName: z.string().min(1, "Item name is required"),
    type: z.enum(["upper", "base", "tall"]),
    fronts: z.number().min(0),
    drawers: z.number().min(0),
    coatingType: z.enum(["spot+1coat", "spot+2coats", "prime+2coats"])
  })),
  totalCost: z.number()
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
  // Ensure dimensions are numbers
  const length = Number(room.length) || 0
  const width = Number(room.width) || 0
  const height = Number(room.height) || 0
  
  // Calculate wall area: 2 × height × (length + width)
  return 2 * height * (length + width)
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

const calculateInteriorRoomCost = (room: InteriorRoom, qualityLevel: QualityLevel) => {
  let totalCost = 0
  const lineItems: LineItem[] = []

  room.components.forEach(component => {
    switch (component.type) {
      case "Walls": {
        // Calculate wall area: 2 × height × (length + width)
        const wallArea = 2 * room.height * (room.length + room.width)
        // Use correct description from rate sheet
        const description = room.height <= 10 ? "interior walls under 10' high" : "interior wall over 10' high"
        const wallPrice = getPrice("Gypsum board", description, component.coatingType, qualityLevel)
        const wallCost = wallArea * wallPrice
        totalCost += wallCost
        lineItems.push({
          description: `Walls (${description})`,
          quantity: wallArea,
          unit: "sq ft",
          unitPrice: wallPrice,
          total: wallCost
        })
        break
      }
      case "Ceiling": {
        const ceilingArea = room.length * room.width
        const ceilingPrice = getPrice("Gypsum board", "interior ceilings", component.coatingType, qualityLevel)
        const ceilingCost = ceilingArea * ceilingPrice
        totalCost += ceilingCost
        lineItems.push({
          description: "Ceiling",
          quantity: ceilingArea,
          unit: "sq ft",
          unitPrice: ceilingPrice,
          total: ceilingCost
        })
        break
      }
      case "Baseboards": {
        const baseboardLength = 2 * (room.length + room.width)
        const baseboardPrice = getPrice("Wood", "interior baseboards", component.coatingType, qualityLevel)
        const baseboardCost = baseboardLength * baseboardPrice
        totalCost += baseboardCost
        lineItems.push({
          description: "Baseboards",
          quantity: baseboardLength,
          unit: "ln ft",
          unitPrice: baseboardPrice,
          total: baseboardCost
        })
        break
      }
      case "Window": {
        if (component.windowType && component.windowSize && component.windowCount) {
          const windowPrice = getPrice("Wood", "Windows", "Wood", component.coatingType, qualityLevel)
          const windowCost = windowPrice * component.windowCount
          totalCost += windowCost
          lineItems.push({
            description: `${component.windowType} Window (${component.windowSize})`,
            quantity: component.windowCount,
            unit: "ea",
            unitPrice: windowPrice,
            total: windowCost
          })
        }
        break
      }
      case "Door": {
        if (component.doorType && component.doorSize && component.doorCount) {
          const doorPrice = getPrice("Wood", "Doors", "Wood", component.coatingType, qualityLevel)
          const doorCost = doorPrice * component.doorCount
          totalCost += doorCost
          lineItems.push({
            description: `${component.doorType} Door (${component.doorSize})`,
            quantity: component.doorCount,
            unit: "ea",
            unitPrice: doorPrice,
            total: doorCost
          })
        }
        break
      }
    }
  })

  return { totalCost, lineItems }
}

const calculateExteriorCost = (measurement: ExteriorMeasurement, qualityLevel: QualityLevel) => {
  let totalCost = 0
  const lineItems: LineItem[] = []

  // Calculate body area
  const bodyArea = measurement.length * measurement.height
  const bodyPrice = getPrice("Stucco", "Body", "Stucco", measurement.coatingType, qualityLevel)
  const bodyCost = bodyArea * bodyPrice
  totalCost += bodyCost
  lineItems.push({
    description: "Body",
    quantity: bodyArea,
    unit: "sq ft",
    unitPrice: bodyPrice,
    total: bodyCost
  })

  // Calculate window costs
  measurement.windows?.forEach(window => {
    const windowPrice = getPrice("Wood", "Windows", "Wood", window.coatingType, qualityLevel)
    const windowCost = windowPrice * window.count
    totalCost += windowCost
    lineItems.push({
      description: `${window.type} Window (${window.size})`,
      quantity: window.count,
      unit: "ea",
      unitPrice: windowPrice,
      total: windowCost
    })
  })

  // Calculate door costs
  measurement.doors?.forEach(door => {
    const doorPrice = getPrice("Wood", "Doors", "Wood", door.coatingType, qualityLevel)
    const doorCost = doorPrice * door.count
    totalCost += doorCost
    lineItems.push({
      description: `${door.type} Door (${door.size})`,
      quantity: door.count,
      unit: "ea",
      unitPrice: doorPrice,
      total: doorCost
    })
  })

  return { totalCost, lineItems }
}

const calculateCabinetryCost = (item: CabinetryItem, qualityLevel: QualityLevel) => {
  let totalCost = 0
  const lineItems: LineItem[] = []

  // Calculate front costs
  const frontPrice = getPrice("Wood", "Cabinetry", "Wood", item.coatingType, qualityLevel)
  const frontCost = frontPrice * item.fronts
  totalCost += frontCost
  lineItems.push({
    description: `${item.type} Fronts`,
    quantity: item.fronts,
    unit: "ea",
    unitPrice: frontPrice,
    total: frontCost
  })

  // Calculate drawer costs
  const drawerPrice = getPrice("Wood", "Cabinetry", "Wood", item.coatingType, qualityLevel)
  const drawerCost = drawerPrice * item.drawers
  totalCost += drawerCost
  lineItems.push({
    description: `${item.type} Drawers`,
    quantity: item.drawers,
    unit: "ea",
    unitPrice: drawerPrice,
    total: drawerCost
  })

  return { totalCost, lineItems }
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
  const [missingPricing, setMissingPricing] = useState<string[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: "",
      projectCategory: "Interior",
      qualityLevel: "Residential",
      defaultCoatingType: "spot+2coats",
      interiorRooms: [
        {
          name: "",
          length: 0,
          width: 0,
          height: 0,
          components: []
        }
      ],
      exteriorMeasurements: [
        {
          elevationName: "",
          length: 0,
          height: 0,
          coatingType: "spot2coats",
        windows: [],
          doors: []
        }
      ],
      cabinetry: [
        {
          itemName: "",
          type: "upper",
          fronts: 0,
          drawers: 0,
          coatingType: "spot2coats"
        }
      ],
      totalCost: 0
    }
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
    name: "exteriorMeasurements.elevations",
  })

  const {
    fields: cabinetryFields,
    append: appendCabinetry,
    remove: removeCabinetry,
  } = useFieldArray({
    control: form.control,
    name: "cabinetry",
  })

  const {
    fields: customItemFields,
    append: appendCustomItem,
    remove: removeCustomItem,
  } = useFieldArray({
    control: form.control,
    name: "customItems",
  })

  // Create field arrays for windows and doors in each room
  const useRoomWindowsArrays = () =>
    roomFields.map((_, index) => {
      return useFieldArray({
        control: form.control,
        name: `interiorRooms.${index}.windows`,
      })
    })

  const useRoomDoorsArrays = () =>
    roomFields.map((_, index) => {
      return useFieldArray({
        control: form.control,
        name: `interiorRooms.${index}.doors`,
      })
    })

  const roomWindowsArrays = useRoomWindowsArrays()
  const roomDoorsArrays = useRoomDoorsArrays()

  // Create field arrays for exterior windows and doors
  const {
    fields: exteriorWindowFields,
    append: appendExteriorWindow,
    remove: removeExteriorWindow,
  } = useFieldArray({
    control: form.control,
    name: "exteriorMeasurements.windows",
  })

  const {
    fields: exteriorDoorFields,
    append: appendExteriorDoor,
    remove: removeExteriorDoor,
  } = useFieldArray({
    control: form.control,
    name: "exteriorMeasurements.doors",
  })

  const projectCategory = form.watch("projectCategory")
  const exteriorMeasurementType = form.watch("exteriorMeasurements.measurementType")
  const defaultCoatingType = form.watch("defaultCoatingType")

  // Calculate costs function
  const calculateCosts = useCallback((data: z.infer<typeof formSchema>) => {
    if (!data.qualityLevel || !data.projectCategory) return

    let totalCost = 0
    const allLineItems: LineItem[] = []
    const missingPricingItems: string[] = []
    const qualityLevel = data.qualityLevel as QualityLevel

    // Calculate interior room costs
    if ((data.projectCategory === "Interior" || data.projectCategory === "Both") && data.interiorRooms) {
      data.interiorRooms.forEach((room, index) => {
        if (!room.length || !room.width || !room.height || !room.surfaceType) return

        const { totalCost: roomCost, lineItems: roomLineItems } = calculateInteriorRoomCost(room, qualityLevel)

        // Update the room cost in the form data
        // Remove this line as it's causing issues with the form state
        totalCost += roomCost
      })
    }

    // Calculate exterior costs
    if ((data.projectCategory === "Exterior" || data.projectCategory === "Both") && data.exteriorMeasurements) {
      let exteriorCost = calculateExteriorCost(data.exteriorMeasurements, qualityLevel)

      form.setValue("exteriorMeasurements.cost", exteriorCost)
      totalCost += exteriorCost
    }

    // Calculate cabinetry costs
    if (data.cabinetryItems && (data.projectCategory === "Interior" || data.projectCategory === "Both")) {
      data.cabinetryItems.forEach((item) => {
        let cabinetryItemCost = calculateCabinetryCost(item, qualityLevel)

        totalCost += cabinetryItemCost
      })
    }

    // Calculate custom item costs
    if (data.customItems) {
      data.customItems.forEach((item) => {
        const customItemTotalPrice = item.quantity * item.unitPrice

        const customItemLineItem: LineItem = {
          id: item.id,
          name: item.name,
          substrateType: "N/A",
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          coatingType: "spot2coats", // Default coating type for custom items
          unitPrice: item.unitPrice,
          totalPrice: customItemTotalPrice,
        }

        allLineItems.push(customItemLineItem)
        totalCost += customItemTotalPrice
      })
    }

    // Add additional costs
    const additionalCosts = Number(data.additionalCosts || 0)
    const subtotal = totalCost + additionalCosts
    const total = subtotal

    setLineItems(allLineItems)
    setMissingPricing([...new Set(missingPricingItems)])
    setCalculatedValues({
      materialsCost: 0, // Not used in simplified display
      laborCost: totalCost,
      overheadCost: 0, // Not used in simplified display
      profitCost: 0, // Not used in simplified display
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

  useEffect(() => {
    const defaultCoatingType = form.watch("defaultCoatingType")
    if (defaultCoatingType && defaultCoatingType !== "differentOptions") {
      const rooms = form.getValues("interiorRooms")
      const updatedRooms = rooms.map(room => ({
        ...room,
        components: room.components.map(component => ({
          ...component,
          coatingType: defaultCoatingType
        }))
      }))
      form.setValue("interiorRooms", updatedRooms)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch("defaultCoatingType")])

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Create the estimate object
    const estimate: Estimate = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      ...data,
      materialsCost: 0,
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
      components: []
    })
  }

  const addElevation = () => {
    appendElevation({
      measurementType: "perimeter",
      perimeter: 0,
      averageHeight: 0,
      totalWindowCount: 0,
      totalDoorCount: 0,
      eaveLength: 0,
      coatingType: "spot2coats",
      windows: [],
      doors: [],
    })
  }

  const addCabinetry = () => {
    appendCabinetry({
      itemName: "",
      type: "upper",
      fronts: 0,
      drawers: 0,
      coatingType: "spot2coats",
    })
  }

  const addCustomItem = () => {
    appendCustomItem({
      id: uuidv4(),
      name: "",
      description: "",
      unit: "sq ft",
      quantity: 0,
      unitPrice: 0,
      totalPrice: 0,
    })
  }

  const addComponent = (roomIndex: number, type: "Walls" | "Ceiling" | "Baseboards" | "Window" | "Door") => {
    const room = form.getValues(`interiorRooms.${roomIndex}`)
    const components = [...room.components]
    const defaultCoatingType = form.getValues("defaultCoatingType")
    
    const newComponent = {
      type,
      coatingType: defaultCoatingType !== "differentOptions" ? defaultCoatingType : "spot+1coat",
      ...(type === "Window" && {
        windowType: "woodSingleFrame",
        windowSize: "medium",
        isStained: false,
        windowCount: 1
      }),
      ...(type === "Door" && {
        doorType: "slab",
        doorSize: "standard",
        doorCount: 1
      })
    }
    
    components.push(newComponent)
    form.setValue(`interiorRooms.${roomIndex}.components`, components)
  }

  // Get pricing for a specific room component
  const getRoomComponentPrice = (
    roomIndex: number,
    surfaceType: string,
    height: number,
    qualityLevel: QualityLevel,
    coatingType: CoatingType,
  ) => {
    const substrateType = SURFACE_TYPE_MAPPING[surfaceType] || "Gypsum board"
    let description = ""
    
    switch (surfaceType) {
      case "Walls":
        description = height > 10 ? "interior wall over 10' high" : "interior walls under 10' high"
        break
      case "Ceiling":
        description = "interior ceilings"
        break
      case "Baseboards":
        description = "interior baseboards"
        break
      default:
        description = surfaceType.toLowerCase()
    }
    
    return pricingService.getUnitPrice({
      substrateType,
      description,
      coatingType,
      qualityLevel
    })
  }

  // Move calculateSummary here so it can use getRoomComponentPrice
  function calculateSummary(rooms, exteriors) {
    const summary = {
      walls: { area: 0, subtotal: 0, unit: 'sq ft', rate: 0 },
      ceilings: { area: 0, subtotal: 0, unit: 'sq ft', rate: 0 },
      baseboards: { length: 0, subtotal: 0, unit: 'ln ft', rate: 0 },
      doors: {}, // { [type]: { count, subtotal, unitPrice } }
      windows: {}, // { [type]: { count, subtotal, unitPrice } }
      total: 0
    }
    // Aggregate interior rooms
    rooms.forEach(room => {
      room.components.forEach(component => {
        // Debug log for coatingType
        console.log('Component type:', component.type, 'Coating type:', component.coatingType)
        if (component.type === 'Walls') {
          const area = 2 * (room.length * room.height) + 2 * (room.width * room.height)
          const rate = getRoomComponentPrice(0, 'Walls', room.height, form.getValues('qualityLevel'), component.coatingType)
          summary.walls.area += area
          summary.walls.rate = rate
          summary.walls.subtotal += area * rate
        } else if (component.type === 'Ceiling') {
          const area = room.length * room.width
          const rate = getRoomComponentPrice(0, 'Ceiling', room.height, form.getValues('qualityLevel'), component.coatingType)
          summary.ceilings.area += area
          summary.ceilings.rate = rate
          summary.ceilings.subtotal += area * rate
        } else if (component.type === 'Baseboards') {
          const length = 2 * (room.length + room.width)
          const rate = getRoomComponentPrice(0, 'Baseboards', room.height, form.getValues('qualityLevel'), component.coatingType)
          summary.baseboards.length += length
          summary.baseboards.rate = rate
          summary.baseboards.subtotal += length * rate
        } else if (component.type === 'Door') {
          const type = component.doorType || 'Unknown'
          const count = component.doorCount || 1
          const rate = pricingService.getUnitPrice({
            substrateType: 'Wood',
            description: type,
            coatingType: component.coatingType,
            qualityLevel: form.getValues('qualityLevel')
          })
          if (!summary.doors[type]) summary.doors[type] = { count: 0, subtotal: 0, unitPrice: rate }
          summary.doors[type].count += count
          summary.doors[type].subtotal += count * rate
          summary.doors[type].unitPrice = rate
        } else if (component.type === 'Window') {
          const type = component.windowType || 'Unknown'
          const count = component.windowCount || 1
          const rate = pricingService.getUnitPrice({
            substrateType: 'Wood',
            description: type,
            coatingType: component.coatingType,
            qualityLevel: form.getValues('qualityLevel')
          })
          if (!summary.windows[type]) summary.windows[type] = { count: 0, subtotal: 0, unitPrice: rate }
          summary.windows[type].count += count
          summary.windows[type].subtotal += count * rate
          summary.windows[type].unitPrice = rate
        }
      })
    })
    // TODO: Aggregate exteriors if needed
    summary.total = summary.walls.subtotal + summary.ceilings.subtotal + summary.baseboards.subtotal
    Object.values(summary.doors).forEach(d => summary.total += d.subtotal)
    Object.values(summary.windows).forEach(w => summary.total += w.subtotal)
    return summary
  }

  // Summary Table at the bottom
  const summary = calculateSummary(form.watch('interiorRooms'), form.watch('exteriorMeasurements'))

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
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Interior">Interior</SelectItem>
                        <SelectItem value="Exterior">Exterior</SelectItem>
                        <SelectItem value="Both">Both</SelectItem>
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
                        <SelectItem value="Residential">Residential</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                        <SelectItem value="Production">Production</SelectItem>
                        <SelectItem value="High End">High End</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultCoatingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Coating Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select coating type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="spot+1coat">Spot + 1 Coat</SelectItem>
                        <SelectItem value="spot+2coats">Spot + 2 Coats</SelectItem>
                        <SelectItem value="prime+2coats">Full Prime + 2 Coats</SelectItem>
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
                const defaultCoatingType = form.watch("defaultCoatingType")
                const wallArea = room.length && room.width && room.height ? calculateInteriorRoomWallArea(room) : 0
                const ceilingArea = room.length && room.width ? calculateCeilingArea(room) : 0
                const baseboardLength = room.length && room.width ? calculateBaseboardLength(room) : 0

                // Get unit prices
                const wallUnitPrice =
                  room.surfaceType && room.height
                    ? getRoomComponentPrice(index, room.surfaceType, room.height, qualityLevel, room.coatingType)
                    : 0
                const ceilingUnitPrice = getPrice("Gypsum board", "Ceiling", "Gypsum board", room.coatingType, qualityLevel)
                const baseboardUnitPrice = getPrice("Wood", "Baseboards", "Wood", room.coatingType, qualityLevel)

                // Calculate room total
                let roomTotal = 0
                if (wallArea && wallUnitPrice) {
                  roomTotal += wallArea * wallUnitPrice
                }
                if (room.surfaceType === "Ceiling" && ceilingArea && ceilingUnitPrice) {
                  roomTotal += ceilingArea * ceilingUnitPrice
                }
                if (room.surfaceType === "Baseboards" && baseboardLength && baseboardUnitPrice) {
                  roomTotal += baseboardLength * baseboardUnitPrice
                }
                if (room.windows) {
                  room.windows.forEach((window) => {
                    let windowPrice = getPrice("Wood", "Windows", window.type, window.coatingType, qualityLevel)
                    if (window.isStained) {
                      windowPrice = windowPrice * 1.3
                    }
                    roomTotal += window.count * windowPrice
                  })
                }
                if (room.doors) {
                  room.doors.forEach((door) => {
                    let doorPrice = getPrice("Wood", "Doors", door.type, door.coatingType, qualityLevel)
                    if (door.isStained) {
                      doorPrice = doorPrice * 1.3
                    }
                    roomTotal += door.count * doorPrice
                  })
                }

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

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name={`interiorRooms.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`interiorRooms.${index}.length`}
                        render={({ field }) => (
                          <FormItem>
                              <FormLabel>Length (ft)</FormLabel>
                            <FormControl>
                                <Input type="number" min="0" step="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                        
                      <FormField
                        control={form.control}
                        name={`interiorRooms.${index}.width`}
                        render={({ field }) => (
                          <FormItem>
                              <FormLabel>Width (ft)</FormLabel>
                            <FormControl>
                                <Input type="number" min="0" step="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                        
                      <FormField
                        control={form.control}
                        name={`interiorRooms.${index}.height`}
                        render={({ field }) => (
                          <FormItem>
                              <FormLabel>Height (ft)</FormLabel>
                            <FormControl>
                                <Input type="number" min="0" step="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                      {/* Components section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Components</h3>
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => addComponent(index, "Walls")}>
                              Add Walls
                            </Button>
                            <Button type="button" variant="outline" onClick={() => addComponent(index, "Ceiling")}>
                              Add Ceiling
                            </Button>
                            <Button type="button" variant="outline" onClick={() => addComponent(index, "Baseboards")}>
                              Add Baseboards
                            </Button>
                            <Button type="button" variant="outline" onClick={() => addComponent(index, "Window")}>
                          Add Window
                        </Button>
                            <Button type="button" variant="outline" onClick={() => addComponent(index, "Door")}>
                              Add Door
                          </Button>
                        </div>
                    </div>

                        {/* List of components */}
                        {room.components.map((component, componentIndex) => {
                          let area = 0
                          let unit = "sq ft"
                          let rate = 0

                          switch (component.type) {
                            case "Walls":
                              area = calculateInteriorRoomWallArea(room)
                              const description = room.height <= 10 ? "interior walls under 10' high" : "interior wall over 10' high"
                              rate = pricingService.getUnitPrice({
                                substrateType: "Gypsum board",
                                description,
                                coatingType: component.coatingType,
                                qualityLevel
                              })
                              break
                            case "Ceiling":
                              area = room.length * room.width
                              rate = getPrice("Gypsum board", "Ceiling", "Gypsum board", component.coatingType, qualityLevel)
                              break
                            case "Baseboards":
                              area = 2 * (room.length + room.width)
                              unit = "ln ft"
                              rate = getPrice("Wood", "Baseboards", "Wood", component.coatingType, qualityLevel)
                              break
                            case "Window":
                              if (component.windowType && component.windowSize && component.windowCount) {
                                area = component.windowCount
                                unit = "ea"
                                rate = getPrice("Wood", "Windows", "Wood", component.coatingType, qualityLevel)
                              }
                              break
                            case "Door":
                              if (component.doorType && component.doorSize && component.doorCount) {
                                area = component.doorCount
                                unit = "ea"
                                rate = getPrice("Wood", "Doors", "Wood", component.coatingType, qualityLevel)
                              }
                              break
                          }

                          const total = area * rate

                          return (
                            <div key={componentIndex} className="border rounded-lg p-4 space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{component.type}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                                  onClick={() => {
                                    const components = [...room.components]
                                    components.splice(componentIndex, 1)
                                    form.setValue(`interiorRooms.${index}.components`, components)
                                  }}
                                >
                            Remove
                          </Button>
                      </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-500">Area/Length</p>
                                  <p className="font-medium">{area.toFixed(2)} {unit}</p>
                      </div>
                                <div>
                                  <p className="text-sm text-gray-500">Rate</p>
                                  <p className="font-medium">{formatCurrency(rate)}/{unit}</p>
                    </div>
                                <div>
                                  <p className="text-sm text-gray-500">Total</p>
                                  <p className="font-medium">{formatCurrency(total)}</p>
                </div>
                              </div>

                              {defaultCoatingType === "differentOptions" && (
                <FormField
                  control={form.control}
                                  name={`interiorRooms.${index}.components.${componentIndex}.coatingType`}
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
                                          <SelectItem value="spot+1coat">Spot + 1 Coat</SelectItem>
                                          <SelectItem value="spot+2coats">Spot + 2 Coats</SelectItem>
                                          <SelectItem value="prime+2coats">Full Prime + 2 Coats</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                              {component.type === "Window" && (
                                <>
                  <FormField
                    control={form.control}
                                    name={`interiorRooms.${index}.components.${componentIndex}.windowType`}
                    render={({ field }) => (
                      <FormItem>
                                        <FormLabel>Window Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                                              <SelectValue placeholder="Select window type" />
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
                                    name={`interiorRooms.${index}.components.${componentIndex}.windowSize`}
                    render={({ field }) => (
                      <FormItem>
                                        <FormLabel>Window Size</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                                              <SelectValue placeholder="Select window size" />
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
                                    name={`interiorRooms.${index}.components.${componentIndex}.windowCount`}
                  render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Count</FormLabel>
                      <FormControl>
                                          <Input type="number" min="1" {...field} />
                      </FormControl>
                                        <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                                    name={`interiorRooms.${index}.components.${componentIndex}.isStained`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                                          <FormLabel>Stained</FormLabel>
                                          <FormDescription>Window is stained</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                                </>
                              )}

                              {component.type === "Door" && (
                                <>
                    <FormField
                      control={form.control}
                                    name={`interiorRooms.${index}.components.${componentIndex}.doorType`}
                      render={({ field }) => (
                        <FormItem>
                                        <FormLabel>Door Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                              <SelectValue placeholder="Select door type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                            <SelectItem value="pocket">Pocket</SelectItem>
                                            <SelectItem value="slab">Slab</SelectItem>
                                            <SelectItem value="closet">Closet</SelectItem>
                                            <SelectItem value="louver">Louver</SelectItem>
                                            <SelectItem value="dividedLight">Divided Light</SelectItem>
                                            <SelectItem value="hollowMetal">Hollow Metal</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                                    name={`interiorRooms.${index}.components.${componentIndex}.doorSize`}
                      render={({ field }) => (
                        <FormItem>
                                        <FormLabel>Door Size</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                              <SelectValue placeholder="Select door size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                            <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="large">Large</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                                    name={`interiorRooms.${index}.components.${componentIndex}.doorCount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Count</FormLabel>
                          <FormControl>
                                          <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                                </>
                              )}
                          </div>
                          )
                        })}
                  </div>
              </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Exterior section */}
        {(form.watch("projectCategory") === "Exterior" || form.watch("projectCategory") === "Both") && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Exterior</h3>
                    <FormField
                      control={form.control}
              name="exteriorMeasurements.0.elevationName"
                      render={({ field }) => (
                        <FormItem>
                  <FormLabel>Elevation Name</FormLabel>
                          <FormControl>
                    <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
              name="exteriorMeasurements.0.length"
                      render={({ field }) => (
                        <FormItem>
                  <FormLabel>Length (ft)</FormLabel>
                            <FormControl>
                    <Input type="number" min="0" step="0.1" {...field} />
                            </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
              name="exteriorMeasurements.0.height"
                      render={({ field }) => (
                        <FormItem>
                  <FormLabel>Height (ft)</FormLabel>
                          <FormControl>
                    <Input type="number" min="0" step="0.1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
              name="exteriorMeasurements.0.coatingType"
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
                      <SelectItem value="spot+1coat">Spot + 1 Coat</SelectItem>
                      <SelectItem value="spot+2coats">Spot + 2 Coats</SelectItem>
                      <SelectItem value="prime+2coats">Full Prime + 2 Coats</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => addWindow(0)}>
                Add Window
              </Button>
              <Button type="button" variant="outline" onClick={() => addDoor(0)}>
                Add Door
                      </Button>
                  </div>
            {/* List of windows and doors */}
            {form.watch("exteriorMeasurements.0.windows")?.map((window, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <h4 className="font-medium">Window {index + 1}</h4>
                    <FormField
                      control={form.control}
                  name={`exteriorMeasurements.0.windows.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                      <FormLabel>Window Type</FormLabel>
                          <FormControl>
                        <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                  name={`exteriorMeasurements.0.windows.${index}.size`}
                      render={({ field }) => (
                        <FormItem>
                      <FormLabel>Window Size</FormLabel>
                          <FormControl>
                        <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                  name={`exteriorMeasurements.0.windows.${index}.count`}
                      render={({ field }) => (
                        <FormItem>
                      <FormLabel>Count</FormLabel>
                            <FormControl>
                        <Input type="number" min="1" {...field} />
                            </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWindow(0, index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            {form.watch("exteriorMeasurements.0.doors")?.map((door, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <h4 className="font-medium">Door {index + 1}</h4>
                    <FormField
                      control={form.control}
                  name={`exteriorMeasurements.0.doors.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                      <FormLabel>Door Type</FormLabel>
                          <FormControl>
                        <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                  name={`exteriorMeasurements.0.doors.${index}.size`}
                      render={({ field }) => (
                        <FormItem>
                      <FormLabel>Door Size</FormLabel>
                          <FormControl>
                        <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                  name={`exteriorMeasurements.0.doors.${index}.count`}
                      render={({ field }) => (
                        <FormItem>
                      <FormLabel>Count</FormLabel>
                          <FormControl>
                        <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDoor(0, index)}
                >
                  Remove
                </Button>
                  </div>
            ))}
                </div>
        )}

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Estimate Summary</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-500">Subtotal:</p>
                <p className="text-lg font-semibold">{formatCurrency(calculatedValues.subtotal)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total:</p>
                <p className="text-lg font-semibold">{formatCurrency(calculatedValues.total)}</p>
              </div>
            </div>
            {missingPricing.length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-medium text-red-500">Missing Pricing Data</h4>
                <ul className="list-disc pl-5">
                  {missingPricing.map((item, index) => (
                    <li key={index} className="text-sm text-red-500">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button type="submit" className="w-full mt-4">
              Create Estimate
            </Button>
          </CardContent>
        </Card>

        {/* Summary Table at the bottom */}
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-2">Summary</h3>
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Component</th>
                <th className="text-right">Total</th>
                <th className="text-right">Unit</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Walls</td>
                <td className="text-right">{summary.walls.area.toFixed(2)}</td>
                <td className="text-right">sq ft</td>
                <td className="text-right">${summary.walls.rate.toFixed(2)}</td>
                <td className="text-right">${summary.walls.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Ceilings</td>
                <td className="text-right">{summary.ceilings.area.toFixed(2)}</td>
                <td className="text-right">sq ft</td>
                <td className="text-right">${summary.ceilings.rate.toFixed(2)}</td>
                <td className="text-right">${summary.ceilings.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Baseboards</td>
                <td className="text-right">{summary.baseboards.length.toFixed(2)}</td>
                <td className="text-right">ln ft</td>
                <td className="text-right">${summary.baseboards.rate.toFixed(2)}</td>
                <td className="text-right">${summary.baseboards.subtotal.toFixed(2)}</td>
              </tr>
              {Object.entries(summary.doors).map(([type, d]) => (
                <tr key={type}>
                  <td>Door: {type}</td>
                  <td className="text-right">{d.count}</td>
                  <td className="text-right">ea</td>
                  <td className="text-right">${d.unitPrice.toFixed(2)}</td>
                  <td className="text-right">${d.subtotal.toFixed(2)}</td>
                </tr>
              ))}
              {Object.entries(summary.windows).map(([type, w]) => (
                <tr key={type}>
                  <td>Window: {type}</td>
                  <td className="text-right">{w.count}</td>
                  <td className="text-right">ea</td>
                  <td className="text-right">${w.unitPrice.toFixed(2)}</td>
                  <td className="text-right">${w.subtotal.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td colSpan={4} className="text-right">Grand Total</td>
                <td className="text-right">${summary.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </form>
    </Form>
  )
}
