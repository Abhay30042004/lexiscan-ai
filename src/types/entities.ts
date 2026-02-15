export interface ExtractedEntity {
  party_names: PartyName[];
  dates: ExtractedDate[];
  amounts: ExtractedAmount[];
  termination_clauses: TerminationClause[];
  metadata?: {
    document_type?: string;
    overall_confidence?: number;
    warnings?: string[];
  };
}

export interface PartyName {
  name: string;
  role?: string;
  confidence?: number;
}

export interface ExtractedDate {
  date: string;
  original_text?: string;
  context?: string;
  confidence?: number;
  valid_format?: boolean;
}

export interface ExtractedAmount {
  amount: string;
  currency?: string;
  context?: string;
  confidence?: number;
  has_currency?: boolean;
}

export interface TerminationClause {
  clause_text: string;
  notice_period?: string;
  conditions?: string;
  confidence?: number;
}

export type ProcessingStatus = 'idle' | 'uploading' | 'extracting_text' | 'analyzing' | 'complete' | 'error';
