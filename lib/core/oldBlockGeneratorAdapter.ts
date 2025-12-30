import { BlockGenerator as OldBlockGenerator } from '../../utils/BlockGenerator';
import { Matrix } from '../data/types';

export class OldBlockGeneratorAdapter {
  private oldGenerator: OldBlockGenerator;

  // Маппинг HEX цветов в строковые цвета
  private colorMapping: Record<string, string> = {
    '#00f0f0': 'cyan',    // I
    '#f0a000': 'orange',  // L
    '#0000f0': 'blue',    // J
    '#f0f000': 'yellow',  // O
    '#00f000': 'green',   // S
    '#a000f0': 'purple',  // T
    '#f00000': 'red',     // Z
    '#ffffff': 'white',   // default
  };

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
    const newBlocks = oldBlocks.map((block, index) => {
      // Конвертируем HEX цвет в строковый цвет
      const mappedColor = this.colorMapping[block.color] || 'red';
      
      return {
        id: block.type,
        uniqueId: `${block.type}_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        name: `Block ${block.type}`,
        matrix: block.shape.map(row => 
          row.map(value => ({ value, color: mappedColor }))
        ),
        difficulty: 'medium' as const,
        color: mappedColor,
      };
    });
    
    return newBlocks;
  }

  getPreviewBlock(): any {
    const oldPreviewBlock = this.oldGenerator.getPreviewBlock();
    if (!oldPreviewBlock) return null;
    
    // Конвертируем HEX цвет в строковый цвет
    const mappedColor = this.colorMapping[oldPreviewBlock.color] || 'red';
    
    // Конвертируем preview блок старого формата в новый
    return {
      id: oldPreviewBlock.type,
      uniqueId: `${oldPreviewBlock.type}_${Date.now()}_preview_${Math.random().toString(36).substr(2, 9)}`,
      name: `Block ${oldPreviewBlock.type}`,
      matrix: oldPreviewBlock.shape.map(row => 
        row.map(value => ({ value, color: mappedColor }))
      ),
      difficulty: 'medium' as const,
      color: mappedColor,
    };
  }

  // Старый движок не имеет этих методов
  updateDifficulty?: (score: number) => boolean;
  updatePlayerRecord?: (newRecord: number) => void;
} 