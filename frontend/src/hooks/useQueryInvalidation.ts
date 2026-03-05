import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';
import { useCallback } from 'react';

export function useQueryInvalidation() {
  const queryClient = useQueryClient();

  const onMessage = useCallback((msg: { event: string; [key: string]: unknown }) => {
    if (msg.event === 'new_question' || msg.event === 'question_answered') {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  }, [queryClient]);

  useWebSocket(onMessage);
}
