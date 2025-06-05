export interface PricingItem {
  substrateType: string
  description: string
  unit: string
  commercial: {
    spot1coat: number
    spot2coats: number
    prime2coats: number
  }
  production: {
    spot1coat: number
    spot2coats: number
    prime2coats: number
  }
  residential: {
    spot1coat: number
    spot2coats: number
    prime2coats: number
  }
  highEnd: {
    spot1coat: number
    spot2coats: number
    prime2coats: number
  }
}

export interface WindowPricing {
  type: string
  size: string
  isStained: boolean
  commercial: number
  production: number
  residential: number
  highEnd: number
}

export interface DoorPricing {
  type: string
  isStained: boolean
  commercial: number
  production: number
  residential: number
  highEnd: number
}

export interface CabinetFrontPricing {
  size: string
  commercial: number
  production: number
  residential: number
  highEnd: number
}

export const PRICING_DATA: PricingItem[] = [
  // INTERIOR
  {
    substrateType: "Gypsum board",
    description: "interior walls under 10' high",
    unit: "sq ft",
    commercial: { spot1coat: 1.0, spot2coats: 1.5, prime2coats: 2.0 },
    production: { spot1coat: 0.75, spot2coats: 1.13, prime2coats: 1.5 },
    residential: { spot1coat: 0.94, spot2coats: 1.41, prime2coats: 1.88 },
    highEnd: { spot1coat: 1.41, spot2coats: 2.11, prime2coats: 2.81 },
  },
  {
    substrateType: "Gypsum board",
    description: "interior wall over 10' high",
    unit: "sq ft",
    commercial: { spot1coat: 1.13, spot2coats: 1.69, prime2coats: 2.25 },
    production: { spot1coat: 0.84, spot2coats: 1.27, prime2coats: 1.69 },
    residential: { spot1coat: 1.05, spot2coats: 1.58, prime2coats: 2.11 },
    highEnd: { spot1coat: 1.58, spot2coats: 2.37, prime2coats: 3.16 },
  },
  {
    substrateType: "Gypsum board",
    description: "interior ceilings",
    unit: "sq ft",
    commercial: { spot1coat: 1.1, spot2coats: 1.65, prime2coats: 2.2 },
    production: { spot1coat: 0.83, spot2coats: 1.24, prime2coats: 1.65 },
    residential: { spot1coat: 1.03, spot2coats: 1.55, prime2coats: 2.06 },
    highEnd: { spot1coat: 1.55, spot2coats: 2.32, prime2coats: 3.09 },
  },
  {
    substrateType: "Wood",
    description: "interior baseboards",
    unit: "ln ft",
    commercial: { spot1coat: 2.0, spot2coats: 3.0, prime2coats: 4.0 },
    production: { spot1coat: 1.5, spot2coats: 2.25, prime2coats: 3.0 },
    residential: { spot1coat: 1.88, spot2coats: 2.81, prime2coats: 3.75 },
    highEnd: { spot1coat: 2.81, spot2coats: 4.22, prime2coats: 5.63 },
  },
  {
    substrateType: "Wood",
    description: "interior trim",
    unit: "ln ft",
    commercial: { spot1coat: 2.0, spot2coats: 3.0, prime2coats: 4.0 },
    production: { spot1coat: 1.5, spot2coats: 2.25, prime2coats: 3.0 },
    residential: { spot1coat: 1.88, spot2coats: 2.81, prime2coats: 3.75 },
    highEnd: { spot1coat: 2.81, spot2coats: 4.22, prime2coats: 5.63 },
  },
  {
    substrateType: "Wood",
    description: "interior trim, stain",
    unit: "ln ft",
    commercial: { spot1coat: 2.5, spot2coats: 3.75, prime2coats: 5.0 },
    production: { spot1coat: 1.88, spot2coats: 2.81, prime2coats: 3.75 },
    residential: { spot1coat: 2.34, spot2coats: 3.52, prime2coats: 4.69 },
    highEnd: { spot1coat: 3.52, spot2coats: 5.27, prime2coats: 7.03 },
  },
  {
    substrateType: "Doors",
    description: "wood slab no frame",
    unit: "each",
    commercial: { spot1coat: 87.5, spot2coats: 131.25, prime2coats: 175.0 },
    production: { spot1coat: 65.63, spot2coats: 98.44, prime2coats: 131.25 },
    residential: { spot1coat: 82.03, spot2coats: 123.05, prime2coats: 164.06 },
    highEnd: { spot1coat: 123.05, spot2coats: 184.57, prime2coats: 246.09 },
  },
  {
    substrateType: "Doors",
    description: "wood slab with frame",
    unit: "each",
    commercial: { spot1coat: 125.0, spot2coats: 187.5, prime2coats: 250.0 },
    production: { spot1coat: 93.75, spot2coats: 140.63, prime2coats: 187.5 },
    residential: { spot1coat: 117.19, spot2coats: 175.78, prime2coats: 234.38 },
    highEnd: { spot1coat: 175.78, spot2coats: 263.67, prime2coats: 351.56 },
  },
  {
    substrateType: "Doors",
    description: "hollow metal with frame",
    unit: "each",
    commercial: { spot1coat: 162.5, spot2coats: 243.75, prime2coats: 325.0 },
    production: { spot1coat: 121.88, spot2coats: 182.81, prime2coats: 243.75 },
    residential: { spot1coat: 152.34, spot2coats: 228.52, prime2coats: 304.69 },
    highEnd: { spot1coat: 228.52, spot2coats: 342.77, prime2coats: 457.03 },
  },
  {
    substrateType: "Doors",
    description: "wood divided light with frame",
    unit: "each",
    commercial: { spot1coat: 200.0, spot2coats: 300.0, prime2coats: 400.0 },
    production: { spot1coat: 150.0, spot2coats: 225.0, prime2coats: 300.0 },
    residential: { spot1coat: 187.5, spot2coats: 281.25, prime2coats: 375.0 },
    highEnd: { spot1coat: 281.25, spot2coats: 421.88, prime2coats: 562.5 },
  },
  {
    substrateType: "Metal",
    description: "interior HVAC ducting & fasteners",
    unit: "ln ft",
    commercial: { spot1coat: 5.0, spot2coats: 7.5, prime2coats: 10.0 },
    production: { spot1coat: 3.75, spot2coats: 5.63, prime2coats: 7.5 },
    residential: { spot1coat: 4.69, spot2coats: 7.03, prime2coats: 9.38 },
    highEnd: { spot1coat: 7.03, spot2coats: 10.55, prime2coats: 14.06 },
  },
  // EXTERIOR
  {
    substrateType: "Masonry",
    description: "exterior stucco or CMU wall under 10'",
    unit: "sq ft",
    commercial: { spot1coat: 1.5, spot2coats: 2.25, prime2coats: 3.0 },
    production: { spot1coat: 1.13, spot2coats: 1.69, prime2coats: 2.25 },
    residential: { spot1coat: 1.41, spot2coats: 2.11, prime2coats: 2.81 },
    highEnd: { spot1coat: 2.11, spot2coats: 3.16, prime2coats: 4.22 },
  },
  {
    substrateType: "Masonry",
    description: "exterior stucco or CMU wall over 10'",
    unit: "sq ft",
    commercial: { spot1coat: 1.75, spot2coats: 2.63, prime2coats: 3.5 },
    production: { spot1coat: 1.31, spot2coats: 1.97, prime2coats: 2.63 },
    residential: { spot1coat: 1.64, spot2coats: 2.46, prime2coats: 3.28 },
    highEnd: { spot1coat: 2.46, spot2coats: 3.69, prime2coats: 4.92 },
  },
  {
    substrateType: "Masonry",
    description: "exterior stucco soffit ceilings",
    unit: "sq ft",
    commercial: { spot1coat: 1.63, spot2coats: 2.44, prime2coats: 3.25 },
    production: { spot1coat: 1.22, spot2coats: 1.83, prime2coats: 2.44 },
    residential: { spot1coat: 1.52, spot2coats: 2.29, prime2coats: 3.05 },
    highEnd: { spot1coat: 2.29, spot2coats: 3.43, prime2coats: 4.57 },
  },
  {
    substrateType: "Wood",
    description: "Siding T111 or Board & Batten",
    unit: "sq ft",
    commercial: { spot1coat: 2.0, spot2coats: 3.0, prime2coats: 4.0 },
    production: { spot1coat: 1.5, spot2coats: 2.25, prime2coats: 3.0 },
    residential: { spot1coat: 1.88, spot2coats: 2.81, prime2coats: 3.75 },
    highEnd: { spot1coat: 2.81, spot2coats: 4.22, prime2coats: 5.63 },
  },
  {
    substrateType: "Wood",
    description: "exterior fascia board",
    unit: "ln ft",
    commercial: { spot1coat: 2.5, spot2coats: 3.75, prime2coats: 5.0 },
    production: { spot1coat: 1.88, spot2coats: 2.81, prime2coats: 3.75 },
    residential: { spot1coat: 2.34, spot2coats: 3.52, prime2coats: 4.69 },
    highEnd: { spot1coat: 3.52, spot2coats: 5.27, prime2coats: 7.03 },
  },
  {
    substrateType: "Wood",
    description: "exterior trim",
    unit: "ln ft",
    commercial: { spot1coat: 2.0, spot2coats: 3.0, prime2coats: 4.0 },
    production: { spot1coat: 1.5, spot2coats: 2.25, prime2coats: 3.0 },
    residential: { spot1coat: 1.88, spot2coats: 2.81, prime2coats: 3.75 },
    highEnd: { spot1coat: 2.81, spot2coats: 4.22, prime2coats: 5.63 },
  },
  {
    substrateType: "Wood",
    description: "exterior siding",
    unit: "sq ft",
    commercial: { spot1coat: 1.75, spot2coats: 2.63, prime2coats: 3.5 },
    production: { spot1coat: 1.31, spot2coats: 1.97, prime2coats: 2.63 },
    residential: { spot1coat: 1.64, spot2coats: 2.46, prime2coats: 3.28 },
    highEnd: { spot1coat: 2.46, spot2coats: 3.69, prime2coats: 4.92 },
  },
  {
    substrateType: "Wood",
    description: "exterior eaves",
    unit: "sq ft",
    commercial: { spot1coat: 2.0, spot2coats: 3.0, prime2coats: 4.0 },
    production: { spot1coat: 1.5, spot2coats: 2.25, prime2coats: 3.0 },
    residential: { spot1coat: 1.88, spot2coats: 2.81, prime2coats: 3.75 },
    highEnd: { spot1coat: 2.81, spot2coats: 4.22, prime2coats: 5.63 },
  },
  {
    substrateType: "Wood",
    description: "shutters",
    unit: "each",
    commercial: { spot1coat: 97.5, spot2coats: 146.25, prime2coats: 195.0 },
    production: { spot1coat: 73.13, spot2coats: 109.69, prime2coats: 146.25 },
    residential: { spot1coat: 91.41, spot2coats: 137.11, prime2coats: 182.81 },
    highEnd: { spot1coat: 137.11, spot2coats: 205.66, prime2coats: 274.22 },
  },
  {
    substrateType: "Metal",
    description: "exterior steel or wrought iron handrails",
    unit: "ln ft",
    commercial: { spot1coat: 7.5, spot2coats: 11.25, prime2coats: 15.0 },
    production: { spot1coat: 5.63, spot2coats: 8.44, prime2coats: 11.25 },
    residential: { spot1coat: 7.03, spot2coats: 10.55, prime2coats: 14.06 },
    highEnd: { spot1coat: 10.55, spot2coats: 15.82, prime2coats: 21.09 },
  },
  {
    substrateType: "Metal",
    description: "exterior gutters & downspouts",
    unit: "ln ft",
    commercial: { spot1coat: 5.0, spot2coats: 7.5, prime2coats: 10.0 },
    production: { spot1coat: 3.75, spot2coats: 5.63, prime2coats: 7.5 },
    residential: { spot1coat: 4.69, spot2coats: 7.03, prime2coats: 9.38 },
    highEnd: { spot1coat: 7.03, spot2coats: 10.55, prime2coats: 14.06 },
  },
]

// Window pricing data - to be filled in by user
export const WINDOW_PRICING_DATA: WindowPricing[] = [
  // Wood Divided Light
  {
    type: "woodDividedLight",
    size: "small",
    isStained: false,
    commercial: 0,
    production: 0,
    residential: 0,
    highEnd: 0,
  },
  {
    type: "woodDividedLight",
    size: "medium",
    isStained: false,
    commercial: 0,
    production: 0,
    residential: 0,
    highEnd: 0,
  },
  {
    type: "woodDividedLight",
    size: "large",
    isStained: false,
    commercial: 0,
    production: 0,
    residential: 0,
    highEnd: 0,
  },
  {
    type: "woodDividedLight",
    size: "small",
    isStained: true,
    commercial: 0,
    production: 0,
    residential: 0,
    highEnd: 0,
  },
  {
    type: "woodDividedLight",
    size: "medium",
    isStained: true,
    commercial: 0,
    production: 0,
    residential: 0,
    highEnd: 0,
  },
  {
    type: "woodDividedLight",
    size: "large",
    isStained: true,
    commercial: 0,
    production: 0,
    residential: 0,
    highEnd: 0,
  },

  // Wood Single Frame
  {
    type: "woodSingleFrame",
    size: "small",
    isStained: false,
    commercial: 0,
    production: 0,
    residential: 0,
    highEnd: 0,
  },
  {
    type: "woodSingleFrame",
    size: "medium",
    isStained: false,
    commercial: 0,
    production: 0,
    residential: 0,
    highEnd: 0,
  },
  {
    type: "woodSingleFrame",
    size: "large",
    isStained: false,
    commercial: 0,
    production: 0,
    residential: 0,
    highEnd: 0,
  },
  { type: "woodSingleFrame", size: "small", isStained: true, commercial: 0, production: 0, residential: 0, highEnd: 0 },
  {
    type: "woodSingleFrame",
    size: "medium",
    isStained: true,
    commercial: 0,
    production: 0,
    residential: 0,
    highEnd: 0,
  },
  { type: "woodSingleFrame", size: "large", isStained: true, commercial: 0, production: 0, residential: 0, highEnd: 0 },

  // Metal Single Frame
  {
    type: "metalSingleFrame",
    size: "small",
    isStained: false,
    commercial: 0,
    production: 0,
    residential: 0,
    highEnd: 0,
  },
  {
    type: "metalSingleFrame",
    size: "medium",
    isStained: false,
    commercial: 0,
    production: 0,
    residential: 0,
    highEnd: 0,
  },
  {
    type: "metalSingleFrame",
    size: "large",
    isStained: false,
    commercial: 0,
    production: 0,
    residential: 0,
    highEnd: 0,
  },

  // Metal Divided Light
  {
    type: "metalDividedLight",
    size: "small",
    isStained: false,
    commercial: 0,
    production: 0,
    residential: 0,
    highEnd: 0,
  },
  {
    type: "metalDividedLight",
    size: "medium",
    isStained: false,
    commercial: 0,
    production: 0,
    residential: 0,
    highEnd: 0,
  },
  {
    type: "metalDividedLight",
    size: "large",
    isStained: false,
    commercial: 0,
    production: 0,
    residential: 0,
    highEnd: 0,
  },
]

// Door pricing data - to be filled in by user
export const DOOR_PRICING_DATA: DoorPricing[] = [
  // Pocket doors
  { type: "pocket", isStained: false, commercial: 0, production: 0, residential: 0, highEnd: 0 },
  { type: "pocket", isStained: true, commercial: 0, production: 0, residential: 0, highEnd: 0 },

  // Slab doors
  { type: "slab", isStained: false, commercial: 0, production: 0, residential: 0, highEnd: 0 },
  { type: "slab", isStained: true, commercial: 0, production: 0, residential: 0, highEnd: 0 },

  // Closet doors
  { type: "closet", isStained: false, commercial: 0, production: 0, residential: 0, highEnd: 0 },
  { type: "closet", isStained: true, commercial: 0, production: 0, residential: 0, highEnd: 0 },

  // Louver doors
  { type: "louver", isStained: false, commercial: 0, production: 0, residential: 0, highEnd: 0 },
  { type: "louver", isStained: true, commercial: 0, production: 0, residential: 0, highEnd: 0 },

  // Divided Light doors
  { type: "dividedLight", isStained: false, commercial: 0, production: 0, residential: 0, highEnd: 0 },
  { type: "dividedLight", isStained: true, commercial: 0, production: 0, residential: 0, highEnd: 0 },

  // Hollow Metal doors
  { type: "hollowMetal", isStained: false, commercial: 0, production: 0, residential: 0, highEnd: 0 },
]

// Cabinet front pricing data - to be filled in by user
export const CABINET_FRONT_PRICING_DATA: CabinetFrontPricing[] = [
  { size: "small", commercial: 0, production: 0, residential: 0, highEnd: 0 },
  { size: "medium", commercial: 0, production: 0, residential: 0, highEnd: 0 },
  { size: "large", commercial: 0, production: 0, residential: 0, highEnd: 0 },
  { size: "drawer", commercial: 0, production: 0, residential: 0, highEnd: 0 },
]

export type QualityLevel = "commercial" | "production" | "residential" | "highEnd"
export type CoatingType = "spot1coat" | "spot2coats" | "prime2coats"

// Safe localStorage access
function getCustomPricing(): PricingItem[] | null {
  if (typeof window === "undefined") return null
  try {
    const savedPricing = localStorage.getItem("customPricing")
    return savedPricing ? JSON.parse(savedPricing) : null
  } catch {
    return null
  }
}

export function getPricing(
  substrateType: string,
  description: string,
  qualityLevel: QualityLevel,
  coatingType: CoatingType,
): number {
  // Use custom pricing if available, otherwise use default
  const customPricing = getCustomPricing()
  const pricingData = customPricing || PRICING_DATA

  const item = pricingData.find(
    (item: PricingItem) => item.substrateType === substrateType && item.description === description,
  )

  if (!item) {
    console.warn(`Pricing not found for ${substrateType} - ${description}`)
    return 0
  }

  return item[qualityLevel][coatingType]
}

export function getWindowPrice(type: string, size: string, isStained: boolean, qualityLevel: QualityLevel): number {
  // Try to get custom pricing from localStorage
  let windowPricing = WINDOW_PRICING_DATA
  try {
    const savedWindowPricing = localStorage.getItem("customWindowPricing")
    if (savedWindowPricing) {
      windowPricing = JSON.parse(savedWindowPricing)
    }
  } catch (error) {
    console.error("Error loading custom window pricing", error)
  }

  const item = windowPricing.find((item) => item.type === type && item.size === size && item.isStained === isStained)

  if (!item) {
    console.warn(`Window pricing not found for ${type} - ${size} - ${isStained ? "stained" : "painted"}`)
    return 0
  }

  return item[qualityLevel]
}

export function getDoorPrice(type: string, isStained: boolean, qualityLevel: QualityLevel): number {
  // Try to get custom pricing from localStorage
  let doorPricing = DOOR_PRICING_DATA
  try {
    const savedDoorPricing = localStorage.getItem("customDoorPricing")
    if (savedDoorPricing) {
      doorPricing = JSON.parse(savedDoorPricing)
    }
  } catch (error) {
    console.error("Error loading custom door pricing", error)
  }

  const item = doorPricing.find((item) => item.type === type && item.isStained === isStained)

  if (!item) {
    console.warn(`Door pricing not found for ${type} - ${isStained ? "stained" : "painted"}`)
    return 0
  }

  return item[qualityLevel]
}

export function getCabinetFrontPrice(size: string, qualityLevel: QualityLevel): number {
  // Try to get custom pricing from localStorage
  let cabinetPricing = CABINET_FRONT_PRICING_DATA
  try {
    const savedCabinetPricing = localStorage.getItem("customCabinetPricing")
    if (savedCabinetPricing) {
      cabinetPricing = JSON.parse(savedCabinetPricing)
    }
  } catch (error) {
    console.error("Error loading custom cabinet pricing", error)
  }

  const item = cabinetPricing.find((item) => item.size === size)

  if (!item) {
    console.warn(`Cabinet front pricing not found for ${size}`)
    return 0
  }

  return item[qualityLevel]
}

// Helper function to get all available substrate types for a category
export function getSubstrateTypes(category: "interior" | "exterior"): string[] {
  const relevantItems = PRICING_DATA.filter((item) => {
    if (category === "interior") {
      return (
        item.description.includes("interior") ||
        (item.substrateType === "Doors" && !item.description.includes("exterior"))
      )
    } else {
      return item.description.includes("exterior")
    }
  })

  return [...new Set(relevantItems.map((item) => item.substrateType))]
}

// Helper function to get descriptions for a substrate type
export function getDescriptionsForSubstrate(substrateType: string, category: "interior" | "exterior"): string[] {
  return PRICING_DATA.filter((item) => {
    const matchesSubstrate = item.substrateType === substrateType
    if (category === "interior") {
      return (
        matchesSubstrate &&
        (item.description.includes("interior") ||
          (item.substrateType === "Doors" && !item.description.includes("exterior")))
      )
    } else {
      return matchesSubstrate && item.description.includes("exterior")
    }
  }).map((item) => item.description)
}
