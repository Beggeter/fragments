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
    
    const oldBlocks = this.oldGenerator.generateNextBlocks(oldBoard);
    
    // Конвертируем блоки старого формата в новый
    return oldBlocks.map(block => ({
      id: block.type,
      uniqueId: block.uniqueId,
      name: `Block ${block.type}`,
      matrix: block.shape.map(row => 
        row.map(value => ({ value, color: block.color }))
      ),
      difficulty: 'medium' as const,
      color: block.color,
    }));
  }

  getPreviewBlock(): any {
    const oldPreviewBlock = this.oldGenerator.getPreviewBlock();
    if (!oldPreviewBlock) return null;
    
    // Конвертируем preview блок старого формата в новый
    return {
      id: oldPreviewBlock.type,
      uniqueId: oldPreviewBlock.uniqueId,
      name: `Block ${oldPreviewBlock.type}`,
      matrix: oldPreviewBlock.shape.map(row => 
        row.map(value => ({ value, color: oldPreviewBlock.color }))
      ),
      difficulty: 'medium' as const,
      color: oldPreviewBlock.color,
    };
  }

  // Старый движок не имеет этих методов
  updateDifficulty?: (score: number) => boolean;
  updatePlayerRecord?: (newRecord: number) => void;
} 