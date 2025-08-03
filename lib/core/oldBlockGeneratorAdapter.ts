import { BlockGenerator as OldBlockGenerator } from '../../utils/BlockGenerator';
import { Matrix } from '../data/types';

export class OldBlockGeneratorAdapter {
  private oldGenerator: OldBlockGenerator;

  constructor() {
    this.oldGenerator = new OldBlockGenerator();
  }

  generateNextBlocks(board: Matrix): any[] {
    // Конвертируем Matrix в number[][] для старого движка
    const oldBoard = board.map(row => 
      row.map(cell => cell.value)
    );
    
    return this.oldGenerator.generateNextBlocks(oldBoard);
  }

  getPreviewBlock(): any {
    return this.oldGenerator.getPreviewBlock();
  }

  // Старый движок не имеет этих методов
  updateDifficulty?: (score: number) => boolean;
  updatePlayerRecord?: (newRecord: number) => void;
} 