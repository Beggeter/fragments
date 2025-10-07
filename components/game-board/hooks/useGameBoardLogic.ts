import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/lib/state/store';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useUser } from '@/hooks/useUser';
import { useGameOver } from '@/hooks/useGameOver';
import { useGameSave } from '@/hooks/useGameSave';
import useDnDLogic from '@/hooks/useDnDLogic';
import { DEFAULT_CELL_SIZE, GAP_SIZE_PX } from '../constants';

export const useGameBoardLogic = () => {
  const { t } = useTranslation();
  const store = useGameStore();
  const { user } = useUser();
  const { isAdmin } = useAdminAuth();
  const { saveGameState } = useGameSave();
  const { triggerGameOver } = useGameOver();
  const dnd = useDnDLogic();

  // TODO: move specific logic from GameBoard into this hook incrementally

  return {
    t,
    user,
    isAdmin,
    saveGameState,
    triggerGameOver,
    dnd,
    DEFAULT_CELL_SIZE,
    GAP_SIZE_PX,
  };
};
