export interface LineItem {
  id: string
  name: string
  substrateType: string
  description: string
  unit: string
  quantity: number
  coatingType: "spot1coat" | "spot2coats" | "prime2coats"
  unitPrice: number
  totalPrice: number
}

export interface WindowItem {
  type: "woodDividedLight" | "woodSingleFrame" | "metalSingleFrame" | "metalDividedLight"
  size: "small" | "medium" | "large"
  isStained: boolean
  count: number
}

export interface DoorItem {
  type: "pocket" | "slab" | "closet" | "louver" | "dividedLight" | "hollowMetal"
  isStained: boolean
  count: number
}

export interface CabinetFront {
  size: "small" | "medium" | "large"
  count: number
}

export interface InteriorRoom {
  name: string
  length: number
  width: number
  height: number
  surfaceType: string
  windows: WindowItem[]
  doors: DoorItem[]
  includeBaseboards: boolean
  includeCeiling: boolean
  lineItems: LineItem[]
  cost: number
}

export interface ExteriorElevation {
  name: string
  width: number
  height: number
  windowCount: number
  doorCount: number
}

export interface ExteriorMeasurement {
  measurementType: "elevation" | "perimeter"
  elevations?: ExteriorElevation[]
  perimeter?: number
  averageHeight?: number
  totalWindowCount?: number
  totalDoorCount?: number
  eaveLength: number
  eavesSqFt: number
  fasciaLinearFt: number
  includeBody: boolean
  includeEaves: boolean
  includeFascia: boolean
  lineItems: LineItem[]
  cost: number
}

export interface CabinetryItem {
  name: string
  type: "upper" | "lower" | "island" | "pantry" | "vanity"
  smallFronts: number
  mediumFronts: number
  largeFronts: number
  drawerFronts: number
  isStainToConversion: boolean
  coatingType: "spot1coat" | "spot2coats" | "prime2coats"
  lineItems: LineItem[]
  cost: number
}

export interface Estimate {
  id: string
  createdAt: string
  validUntil: string
  clientName: string
  clientEmail: string
  clientPhone: string
  projectAddress: string
  projectCategory: string
  projectType: string
  qualityLevel: string
  startDate: Date
  paintQuality: string
  interiorRooms?: InteriorRoom[]
  exteriorMeasurement?: ExteriorMeasurement
  cabinetryItems?: CabinetryItem[]
  materialsCost: number
  laborCost: number
  additionalCosts: number
  subtotal: number
  taxAmount: number
  total: number
  notes?: string
}

// Legacy interface for backward compatibility
export interface Room {
  name: string
  length: number
  width: number
  height: number
  surfaceType: string
  cost: number
}
