import { BlockGenerator as NewBlockGenerator } from './blockGenerator';
import { BlockGeneratorFactory } from './blockGeneratorFactory';
import { Matrix } from '../data/types';

export interface IBlockGenerator {
  generateNextBlocks(board: any): any[];
  getPreviewBlock(): any;
  updateDifficulty?: (score: number) => boolean;
  updatePlayerRecord?: (newRecord: number) => void;
}

export class EngineSelector {
  static createBlockGenerator(userRole?: string, initialScore: number = 0, playerRecord: number = 0): IBlockGenerator {
    return BlockGeneratorFactory.create('classic', initialScore, playerRecord);
  }
} 