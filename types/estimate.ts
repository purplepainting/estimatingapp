export interface LineItem {
  description: string
  quantity: number
  unit: string
  unitPrice: number
  total: number
}

export type CoatingType = "spot1coat" | "spot2coats" | "prime2coats";

export interface InteriorRoom {
  name: string
  length: number
  width: number
  height: number
  surfaceType: string
  wallCoatingType: CoatingType
  ceilingCoatingType: CoatingType
  baseboardCoatingType: CoatingType
  windows: WindowItem[]
  doors: DoorItem[]
  includeBaseboards: boolean
  includeCeiling: boolean
  lineItems: LineItem[]
  cost?: number
}

export interface WindowItem {
  type: "wood slab no frame" | "wood slab with frame" | "hollow metal with frame" | "wood divided light with frame"
  count: number
  isStained: boolean
}

export interface DoorItem {
  type: "wood slab no frame" | "wood slab with frame" | "hollow metal with frame" | "wood divided light with frame"
  count: number
  isStained: boolean
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
  bodyCoatingType: CoatingType
  eavesCoatingType: CoatingType
  fasciaCoatingType: CoatingType
  windows: WindowItem[]
  doors: DoorItem[]
  includeBody: boolean
  includeEaves: boolean
  includeFascia: boolean
  lineItems: LineItem[]
  cost: number
}

export interface CabinetryItem {
  name: string
  type: "upper" | "lower" | "island" | "pantry" | "vanity"
  linearFeet: number
  doorCount: number
  drawerCount: number
  coatingType: CoatingType
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
