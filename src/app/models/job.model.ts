export interface Job {
  id?: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  requirements?: string;
  datePosted?: Date;
  status?: string;
  userId?: string;
}

export interface JobInsert extends Omit<Job, 'id' | 'datePosted' | 'userId'> {
  // Fields required when inserting a new job
}
