import { Employee, LibraryError, ErrorCode } from '../models';
import { IRepository } from './IRepository';
import { FileUtils } from '../utils/fileUtils';

export class EmployeeRepository implements IRepository<Employee> {
  private readonly dataFile: string;

  constructor(dataFile: string) {
    this.dataFile = dataFile;
  }

  async findAll(): Promise<Employee[]> {
    return await FileUtils.readJSON<Employee>(this.dataFile);
  }

  async findById(id: string): Promise<Employee | null> {
    const employees = await this.findAll();
    return employees.find((employee) => employee.id === id) || null;
  }

  async save(entity: Employee): Promise<Employee> {
    const employees = await this.findAll();
    employees.push(entity);
    await FileUtils.writeJSON(this.dataFile, employees);
    return entity;
  }

  async update(id: string, entity: Partial<Employee>): Promise<Employee> {
    const employees = await this.findAll();
    const index = employees.findIndex((employee) => employee.id === id);

    if (index === -1) {
      throw new LibraryError('指定された社員が見つかりません', ErrorCode.EMPLOYEE_NOT_FOUND);
    }

    employees[index] = { ...employees[index], ...entity };
    await FileUtils.writeJSON(this.dataFile, employees);
    return employees[index];
  }

  async delete(id: string): Promise<boolean> {
    const employees = await this.findAll();
    const index = employees.findIndex((employee) => employee.id === id);

    if (index === -1) {
      return false;
    }

    employees.splice(index, 1);
    await FileUtils.writeJSON(this.dataFile, employees);
    return true;
  }

  async findByEmail(email: string): Promise<Employee | null> {
    const employees = await this.findAll();
    return employees.find((employee) => employee.email === email) || null;
  }

  async findByBarcode(barcode: string): Promise<Employee | null> {
    const employees = await this.findAll();
    return employees.find((employee) => employee.barcode === barcode) || null;
  }
}
