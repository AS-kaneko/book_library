export enum LoanStatus {
  ACTIVE = 'active',
  RETURNED = 'returned',
}

export interface LoanRecord {
  id: string;
  bookId: string;
  employeeId: string;
  borrowedAt: Date;
  dueDate: Date; // 返却期限
  returnedAt?: Date;
  status: LoanStatus;
}
