export interface Candidate {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  position: string;
  status?: string;
  notes?: string;
  resumeUrl?: string;
  dateAdded?: Date;
  userId?: string;
}

export interface CandidateInsert extends Omit<Candidate, 'id' | 'dateAdded' | 'userId'> {
  // Fields required when inserting a new candidate
}
