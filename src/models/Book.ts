export enum BookStatus {
  AVAILABLE = 'available',
  BORROWED = 'borrowed',
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  coverImageUrl?: string;
  registeredAt: Date;
  status: BookStatus;
  currentBorrowerId?: string;
}
