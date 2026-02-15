import { supabase } from '@/integrations/supabase/client';
import { ExtractedEntity } from '@/types/entities';

export async function extractEntities(text: string): Promise<ExtractedEntity> {
  const { data, error } = await supabase.functions.invoke('extract-entities', {
    body: { text },
  });

  if (error) {
    throw new Error(error.message || 'Failed to extract entities');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as ExtractedEntity;
}
