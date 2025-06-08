import { PricingConfig } from './types'

const defaultCoatingModifiers = {
  "spot+1coat": 0.5,
  "spot+2coats": 0.75,
  "prime+2coats": 1.0
};
const defaultQualityModifiers = {
  "Production": 0.75,
  "Commercial": 1.0,
  "Residential": 1.25,
  "High End": 1.5
};

export const pricingConfig: PricingConfig = {
  baseRates: {
    "Gypsum board": {
      "interior walls under 10' high": {
        "standard": {
          name: "interior walls under 10' high",
          unit: "sq ft",
          baseRate: 2.00,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      },
      "interior wall over 10' high": {
        "standard": {
          name: "interior wall over 10' high",
          unit: "sq ft",
          baseRate: 2.25,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      },
      "interior ceilings": {
        "standard": {
          name: "interior ceilings",
          unit: "sq ft",
          baseRate: 2.20,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      }
    },
    "Wood": {
      "interior baseboards": {
        "standard": {
          name: "interior baseboards",
          unit: "ln ft",
          baseRate: 4.00,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      },
      "interior trim": {
        "standard": {
          name: "interior trim",
          unit: "ln ft",
          baseRate: 4.00,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      },
      "Siding T111 or Board & Batten": {
        "standard": {
          name: "Siding T111 or Board & Batten",
          unit: "sq ft",
          baseRate: 4.00,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      },
      "exterior fascia board": {
        "standard": {
          name: "exterior fascia board",
          unit: "ln ft",
          baseRate: 5.00,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      },
      "entry doors": {
        "standard": {
          name: "entry doors",
          unit: "ea",
          baseRate: 375.00,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      },
      "windows": {
        "standard": {
          name: "windows",
          unit: "ea",
          baseRate: 410.00,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      },
      "exterior trim": {
        "standard": {
          name: "exterior trim",
          unit: "ln ft",
          baseRate: 4.00,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      },
      "exterior siding": {
        "standard": {
          name: "exterior siding",
          unit: "sq ft",
          baseRate: 3.50,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      },
      "exterior eaves": {
        "standard": {
          name: "exterior eaves",
          unit: "sq ft",
          baseRate: 4.00,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      },
      "shutters": {
        "standard": {
          name: "shutters",
          unit: "ea",
          baseRate: 195.00,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      }
    },
    "Doors": {
      "wood slab no frame": {
        "standard": {
          name: "wood slab no frame",
          unit: "ea",
          baseRate: 175.00,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      },
      "wood slab with frame": {
        "standard": {
          name: "wood slab with frame",
          unit: "ea",
          baseRate: 250.00,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      },
      "hollow metal with frame": {
        "standard": {
          name: "hollow metal with frame",
          unit: "ea",
          baseRate: 325.00,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      },
      "wood divided light with frame": {
        "standard": {
          name: "wood divided light with frame",
          unit: "ea",
          baseRate: 400.00,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      }
    },
    "Windows": {
      "wood divided light with frame": {
        "standard": {
          name: "wood divided light with frame",
          unit: "ea",
          baseRate: 450.00,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      }
    },
    "Metal": {
      "interior HVAC ducting & fasteners": {
        "standard": {
          name: "interior HVAC ducting & fasteners",
          unit: "ln ft",
          baseRate: 10.00,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      },
      "exterior steel or wrought iron handrails": {
        "standard": {
          name: "exterior steel or wrought iron handrails",
          unit: "ln ft",
          baseRate: 15.00,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      },
      "exterior gutters & downspouts": {
        "standard": {
          name: "exterior gutters & downspouts",
          unit: "ln ft",
          baseRate: 10.00,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      },
      "utility doors": {
        "standard": {
          name: "utility doors",
          unit: "ln ft",
          baseRate: 325.00,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      }
    },
    "Masonry": {
      "exterior stucco or CMU wall under 10'": {
        "standard": {
          name: "exterior stucco or CMU wall under 10'",
          unit: "sq ft",
          baseRate: 3.00,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      },
      "exterior stucco or CMU wall over 10'": {
        "standard": {
          name: "exterior stucco or CMU wall over 10'",
          unit: "sq ft",
          baseRate: 3.50,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      },
      "exterior stucco soffit ceilings": {
        "standard": {
          name: "exterior stucco soffit ceilings",
          unit: "sq ft",
          baseRate: 3.25,
          coatingModifiers: { ...defaultCoatingModifiers },
          qualityModifiers: { ...defaultQualityModifiers }
        }
      }
    }
  },
  defaultQualityModifiers,
  defaultCoatingModifiers,
  stainModifiers: {
    standard: 1.3,
    custom: 2.0
  }
}
