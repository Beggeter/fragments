import { BlockGenerator as OldBlockGenerator } from '../../utils/BlockGenerator';
import { BlockGenerator as NewBlockGenerator } from './blockGenerator';
import { BlockGeneratorFactory } from './blockGeneratorFactory';
import { Matrix } from '../data/types';

export interface IBlockGenerator {
  generateNextBlocks(board: Matrix | number[][]): any[];
  getPreviewBlock(): any;
  updateDifficulty?: (score: number) => boolean;
  updatePlayerRecord?: (newRecord: number) => void;
}

export class EngineSelector {
  static createBlockGenerator(userRole?: string, initialScore: number = 0, playerRecord: number = 0): IBlockGenerator {
    // Если пользователь тестер, используем новый движок
    if (userRole === 'tester') {
      console.log('🎮 Используется новый движок для тестера');
      return BlockGeneratorFactory.create('classic', initialScore, playerRecord);
    }
    
    // Для всех остальных используем старый движок
    console.log('🎮 Используется старый движок для обычного пользователя');
    return new OldBlockGenerator();
  }
} 