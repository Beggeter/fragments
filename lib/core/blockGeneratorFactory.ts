import { BaseBlockGenerator } from './baseBlockGenerator';
import { CLASSIC_CONFIG, ZEN_CONFIG, LEGACY01_CONFIG, LEGACY02_CONFIG } from './generatorConfigs';
import { ClassicBlockGenerator } from './classicBlockGenerator';
import { ZenBlockGenerator } from './zenBlockGenerator';
import { Legacy01BlockGenerator } from './legacy01BlockGenerator';
import { Legacy02BlockGenerator } from './legacy02BlockGenerator';

export type GeneratorMode = 'classic' | 'zen' | 'legacy01' | 'legacy02';

export class BlockGeneratorFactory {
  static create(
    mode: GeneratorMode,
    initialScore: number = 0,
    playerRecord: number = 0
  ): BaseBlockGenerator {
    switch (mode) {
      case 'classic':
        return new ClassicBlockGenerator(initialScore, playerRecord);
      case 'zen':
        return new ZenBlockGenerator(initialScore, playerRecord);
      case 'legacy01':
        return new Legacy01BlockGenerator(initialScore, playerRecord);
      case 'legacy02':
        return new Legacy02BlockGenerator(initialScore, playerRecord);
      default:
        throw new Error(`Unknown generator mode: ${mode}`);
    }
  }

  static getConfig(mode: GeneratorMode) {
    switch (mode) {
      case 'classic':
        return CLASSIC_CONFIG;
      case 'zen':
        return ZEN_CONFIG;
      case 'legacy01':
        return LEGACY01_CONFIG;
      case 'legacy02':
        return LEGACY02_CONFIG;
      default:
        throw new Error(`Unknown generator mode: ${mode}`);
    }
  }
} 