import { LoanRecord, LoanStatus, LibraryError, ErrorCode } from '../models';
import { IRepository } from './IRepository';
import { FileUtils } from '../utils/fileUtils';

export class LoanRepository implements IRepository<LoanRecord> {
  private readonly dataFile: string;

  constructor(dataFile: string) {
    this.dataFile = dataFile;
  }

  async findAll(): Promise<LoanRecord[]> {
    return await FileUtils.readJSON<LoanRecord>(this.dataFile);
  }

  async findById(id: string): Promise<LoanRecord | null> {
    const loans = await this.findAll();
    return loans.find((loan) => loan.id === id) || null;
  }

  async save(entity: LoanRecord): Promise<LoanRecord> {
    const loans = await this.findAll();
    loans.push(entity);
    await FileUtils.writeJSON(this.dataFile, loans);
    return entity;
  }

  async update(id: string, entity: Partial<LoanRecord>): Promise<LoanRecord> {
    const loans = await this.findAll();
    const index = loans.findIndex((loan) => loan.id === id);

    if (index === -1) {
      throw new LibraryError('指定された貸出記録が見つかりません', ErrorCode.BOOK_NOT_FOUND);
    }

    loans[index] = { ...loans[index], ...entity };
    await FileUtils.writeJSON(this.dataFile, loans);
    return loans[index];
  }

  async delete(id: string): Promise<boolean> {
    const loans = await this.findAll();
    const index = loans.findIndex((loan) => loan.id === id);

    if (index === -1) {
      return false;
    }

    loans.splice(index, 1);
    await FileUtils.writeJSON(this.dataFile, loans);
    return true;
  }

  async findActiveLoans(): Promise<LoanRecord[]> {
    const loans = await this.findAll();
    return loans.filter((loan) => loan.status === LoanStatus.ACTIVE);
  }

  async findByBookId(bookId: string): Promise<LoanRecord[]> {
    const loans = await this.findAll();
    return loans.filter((loan) => loan.bookId === bookId);
  }

  async findByEmployeeId(employeeId: string): Promise<LoanRecord[]> {
    const loans = await this.findAll();
    return loans.filter((loan) => loan.employeeId === employeeId);
  }

  async findActiveByEmployeeId(employeeId: string): Promise<LoanRecord[]> {
    const loans = await this.findAll();
    return loans.filter(
      (loan) => loan.employeeId === employeeId && loan.status === LoanStatus.ACTIVE
    );
  }

  async findActiveByBookId(bookId: string): Promise<LoanRecord | null> {
    const loans = await this.findAll();
    return (
      loans.find((loan) => loan.bookId === bookId && loan.status === LoanStatus.ACTIVE) || null
    );
  }
}
