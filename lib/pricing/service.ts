import { pricingConfig } from './config';
import type { CoatingType, QualityLevel, SubstrateType, StainType } from './types';

export class PricingService {
  private static instance: PricingService;
  private config = pricingConfig;

  private constructor() {}

  public static getInstance(): PricingService {
    if (!PricingService.instance) {
      PricingService.instance = new PricingService();
    }
    return PricingService.instance;
  }

  public getBaseRate(
    substrateType: SubstrateType,
    category: string,
    item: string,
    coatingType: CoatingType,
    qualityLevel: QualityLevel,
    quantity: number = 1,
    stainType: StainType = "none"
  ): number {
    try {
      const substrate = this.config.baseRates[substrateType];
      if (!substrate) return 0;

      const categoryConfig = substrate[category];
      if (!categoryConfig) return 0;

      const itemConfig = categoryConfig[item];
      if (!itemConfig) return 0;

      // Get base rate for prime+2coats
      let baseRate = itemConfig.baseRate;

      // Apply coating type modifier
      const coatingModifier = itemConfig.coatingModifiers[coatingType] || 
                            this.config.defaultCoatingModifiers[coatingType] || 1;
      baseRate *= coatingModifier;

      // Apply quality level modifier
      const qualityModifier = itemConfig.qualityModifiers[qualityLevel] || 
                            this.config.defaultQualityModifiers[qualityLevel] || 1;
      baseRate *= qualityModifier;

      // Apply stain modifier if applicable
      if (stainType !== "none") {
        const stainModifier = this.config.stainModifiers[stainType] || 1;
        baseRate *= stainModifier;
      }

      // Apply any additional modifiers
      if (itemConfig.additionalModifiers) {
        Object.entries(itemConfig.additionalModifiers).forEach(([key, value]) => {
          if (value !== undefined) {
            baseRate *= value;
          }
        });
      }

      return baseRate;
    } catch (error) {
      console.error("Error getting base rate:", error);
      return 0;
    }
  }

  public calculateTotal(
    substrateType: SubstrateType,
    category: string,
    item: string,
    coatingType: CoatingType,
    qualityLevel: QualityLevel,
    quantity: number,
    stainType: StainType = "none"
  ): number {
    const baseRate = this.getBaseRate(substrateType, category, item, coatingType, qualityLevel, quantity, stainType);
    return baseRate * quantity;
  }

  public getItemUnit(
    substrateType: SubstrateType,
    category: string,
    item: string
  ): string {
    const itemConfig = this.config.baseRates[substrateType]?.[category]?.[item];
    return itemConfig?.unit || '';
  }

  public getItemName(
    substrateType: SubstrateType,
    category: string,
    item: string
  ): string {
    const itemConfig = this.config.baseRates[substrateType]?.[category]?.[item];
    return itemConfig?.name || '';
  }

  public getQualityLevelName(qualityLevel: QualityLevel): string {
    return qualityLevel;
  }

  public getQualityLevelModifier(qualityLevel: QualityLevel): number {
    return this.config.defaultQualityModifiers[qualityLevel] || 1;
  }

  public getSubstrateCategories(substrateType: SubstrateType): string[] {
    return Object.keys(this.config.baseRates[substrateType] || {});
  }

  public getCategoryItems(substrateType: SubstrateType, category: string): string[] {
    return Object.keys(
      this.config.baseRates[substrateType]?.[category] || {}
    );
  }

  getUnitPrice({ substrateType, description, coatingType, qualityLevel, stainType = "none" }: {
    substrateType: SubstrateType,
    description: string,
    coatingType: CoatingType,
    qualityLevel: QualityLevel,
    stainType?: StainType
  }): number {
    const [category, item] = description.split(' - ');
    return this.getBaseRate(substrateType, category, item, coatingType, qualityLevel, 1, stainType);
  }
} 