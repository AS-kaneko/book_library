export enum LoanStatus {
  ACTIVE = 'active',
  RETURNED = 'returned',
}

export interface LoanRecord {
  id: string;
  bookId: string;
  employeeId: string;
  borrowedAt: Date;
  returnedAt?: Date;
  status: LoanStatus;
}
