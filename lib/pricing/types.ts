export type QualityLevel = "Residential" | "Commercial" | "Production" | "High End"
export type CoatingType = "spot+1coat" | "spot+2coats" | "prime+2coats"
export type SubstrateType = "Gypsum board" | "Wood" | "Doors" | "Windows" | "Metal" | "Masonry"
export type Unit = "sq ft" | "ln ft" | "ea" | "hour"
export type StainType = "none" | "standard" | "custom"

export interface QualityLevelConfig {
  name: string
  modifier: number
}

export interface CoatingTypeConfig {
  name: string
  modifier: number  // Multiplier relative to prime+2coats base rate
}

export interface PricingItem {
  name: string
  unit: Unit
  baseRate: number  // Base rate for prime+2coats
  coatingModifiers: Record<CoatingType, number>  // Modifiers for each coating type
  qualityModifiers: Record<QualityLevel, number>  // Modifiers for each quality level
  additionalModifiers?: {
    height?: number  // For items with height-based pricing
    [key: string]: number | undefined
  }
}

export interface SubstrateCategory {
  name: string
  items: Record<string, PricingItem>
}

export interface RoomComponent {
  type: "Walls" | "Ceiling" | "Baseboards" | "Window" | "Door"
  coatingType: CoatingType
  windowType?: string
  windowSize?: string
  isStained?: boolean
  windowCount?: number
  doorType?: string
  doorSize?: string
  doorCount?: number
}

export interface InteriorRoom {
  name: string
  length: number
  width: number
  height: number
  components: RoomComponent[]
}

export interface ExteriorMeasurement {
  elevationName: string
  length: number
  height: number
  coatingType: CoatingType
  windows?: WindowItem[]
  doors?: DoorItem[]
}

export interface WindowItem {
  type: string
  size: string
  coatingType: CoatingType
  isStained: boolean
  count: number
}

export interface DoorItem {
  type: string
  size: string
  coatingType: CoatingType
  isStained: boolean
  count: number
}

export interface CabinetryItem {
  itemName: string
  type: string
  fronts: number
  drawers: number
  coatingType: CoatingType
}

export interface LineItem {
  description: string
  quantity: number
  unit: Unit
  unitPrice: number
  total: number
}

export interface PricingConfig {
  baseRates: {
    [key in SubstrateType]: {
      [key: string]: {
        [key: string]: PricingItem
      }
    }
  }
  defaultQualityModifiers: Record<QualityLevel, number>
  defaultCoatingModifiers: Record<CoatingType, number>
  stainModifiers: {
    standard: number  // 30% modifier
    custom: number    // 2x modifier
  }
} 