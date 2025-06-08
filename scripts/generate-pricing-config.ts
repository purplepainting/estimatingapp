import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import { SubstrateType } from '../lib/pricing/types'

// Define types for our data structure
type QualityLevel = 'Commercial' | 'Residential' | 'Production' | 'High End'
type CoatingType = 'spot+1coat' | 'spot+2coats' | 'prime+2coats'
type DescriptionRates = {
  [key in CoatingType]: {
    [key in QualityLevel]: number
  }
}

type BaseRates = {
  [key in SubstrateType]: {
    [description: string]: DescriptionRates
  }
}

const baseRates: BaseRates = {
  'Gypsum board': {},
  'Wood': {},
  'Doors': {},
  'Windows': {},
  'Metal': {},
  'Masonry': {}
}

const excelPath = path.join(process.cwd(), 'PRICING v4.1.xlsx')
console.log('Reading Excel file from:', excelPath)
const workbook = XLSX.readFile(excelPath)
const sheetName = workbook.SheetNames[0]
const worksheet = workbook.Sheets[sheetName]
const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

// Map columns to quality levels and coating types
const qualityLevels: QualityLevel[] = ['Production', 'Commercial', 'Residential', 'High End']
const coatingTypes: CoatingType[] = ['spot+1coat', 'spot+2coats', 'prime+2coats']

// Data starts at row 4 (index 4)
for (let i = 4; i < data.length; i++) {
  const row = data[i]
  if (!row || !row[0] || !row[1]) continue
  const substrateType = row[0] as SubstrateType
  const description = row[1] as string
  if (!baseRates[substrateType]) continue
  if (!baseRates[substrateType][description]) {
    baseRates[substrateType][description] = {
      'spot+1coat': { Commercial: 0, Residential: 0, Production: 0, 'High End': 0 },
      'spot+2coats': { Commercial: 0, Residential: 0, Production: 0, 'High End': 0 },
      'prime+2coats': { Commercial: 0, Residential: 0, Production: 0, 'High End': 0 }
    }
  }
  // For each quality level, map the 3 columns
  for (let q = 0; q < qualityLevels.length; q++) {
    for (let c = 0; c < coatingTypes.length; c++) {
      const colIdx = 3 + q * 3 + c
      const value = row[colIdx]
      if (typeof value === 'number' && !isNaN(value)) {
        // Round to nearest $0.01
        const rounded = Math.round(value * 100) / 100
        baseRates[substrateType][description][coatingTypes[c]][qualityLevels[q]] = rounded
      }
    }
  }
}

const configContent = `import { PricingConfig } from './types'

export const pricingConfig: PricingConfig = ${JSON.stringify({ baseRates }, null, 2)}
`

const outputPath = path.join(process.cwd(), 'lib', 'pricing', 'config.ts')
fs.writeFileSync(outputPath, configContent)
console.log('Config written to:', outputPath)

// Validate the generated config
console.log('\nValidating generated config:')
Object.entries(baseRates).forEach(([substrateType, descriptions]) => {
  console.log(`\n${substrateType}:`)
  Object.entries(descriptions).forEach(([description, coatings]) => {
    console.log(`  ${description}:`)
    Object.entries(coatings).forEach(([coating, qualities]) => {
      console.log(`    ${coating}:`, qualities)
    })
  })
}) 