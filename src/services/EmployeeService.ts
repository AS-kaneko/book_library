import { Employee, LibraryError, ErrorCode } from '../models';
import { EmployeeRepository } from '../repositories/EmployeeRepository';
import { LoanRepository } from '../repositories/LoanRepository';
import { BarcodeService } from './BarcodeService';

/**
 * 社員サービス
 * 社員管理のビジネスロジックを提供
 */
export class EmployeeService {
  constructor(
    private employeeRepository: EmployeeRepository,
    private loanRepository: LoanRepository,
    private barcodeService: BarcodeService
  ) {}

  /**
   * 社員を追加（会員バーコード自動生成）
   * @param id 社員ID
   * @param name 名前
   * @param email メールアドレス
   * @returns 追加された社員
   */
  async addEmployee(id: string, name: string, email: string): Promise<Employee> {
    // 入力バリデーション
    if (!id || !name || !email) {
      throw new LibraryError(
        '社員ID、名前、メールアドレスは必須です',
        ErrorCode.INVALID_INPUT
      );
    }

    // メールアドレス形式の検証
    if (!this.validateEmail(email)) {
      throw new LibraryError(
        '無効なメールアドレス形式です',
        ErrorCode.INVALID_INPUT
      );
    }

    // 同じIDの社員が既に存在するかチェック
    const existingEmployeeById = await this.employeeRepository.findById(id);
    if (existingEmployeeById) {
      throw new LibraryError(
        'この社員IDは既に登録されています',
        ErrorCode.INVALID_INPUT
      );
    }

    // 同じメールアドレスの社員が既に存在するかチェック
    const existingEmployeeByEmail = await this.employeeRepository.findByEmail(email);
    if (existingEmployeeByEmail) {
      throw new LibraryError(
        'このメールアドレスは既に登録されています',
        ErrorCode.INVALID_INPUT
      );
    }

    // 新しい社員を作成（バーコードは社員IDをそのまま使用）
    const newEmployee: Employee = {
      id: id.trim(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      barcode: id.trim(), // 社員IDをバーコードとして使用
      registeredAt: new Date(),
    };

    const savedEmployee = await this.employeeRepository.save(newEmployee);

    // バーコード画像を生成
    try {
      await this.barcodeService.generateEmployeeBarcode(savedEmployee.id);
    } catch (error) {
      // バーコード生成に失敗しても社員登録は成功とする
      console.warn(`バーコード画像の生成に失敗しました: ${error}`);
    }

    return savedEmployee;
  }

  /**
   * 社員を更新
   * @param id 社員ID
   * @param updates 更新内容
   * @returns 更新された社員
   */
  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    // 社員の存在確認
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new LibraryError(
        '指定された社員が見つかりません',
        ErrorCode.EMPLOYEE_NOT_FOUND
      );
    }

    // メールアドレスが更新される場合は検証
    if (updates.email && updates.email !== employee.email) {
      if (!this.validateEmail(updates.email)) {
        throw new LibraryError(
          '無効なメールアドレス形式です',
          ErrorCode.INVALID_INPUT
        );
      }

      // 同じメールアドレスの社員が既に存在するかチェック
      const existingEmployee = await this.employeeRepository.findByEmail(updates.email);
      if (existingEmployee && existingEmployee.id !== id) {
        throw new LibraryError(
          'このメールアドレスは既に登録されています',
          ErrorCode.INVALID_INPUT
        );
      }

      updates.email = updates.email.trim().toLowerCase();
    }

    // 名前をトリム
    if (updates.name) {
      updates.name = updates.name.trim();
    }

    // id、barcode、registeredAtは更新させない
    const { id: _, barcode: __, registeredAt: ___, ...safeUpdates } = updates;

    return await this.employeeRepository.update(id, safeUpdates);
  }

  /**
   * 社員を削除
   * @param id 社員ID
   */
  async deleteEmployee(id: string): Promise<void> {
    // 社員の存在確認
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new LibraryError(
        '指定された社員が見つかりません',
        ErrorCode.EMPLOYEE_NOT_FOUND
      );
    }

    // 貸出中の書籍がある社員は削除できない
    const activeLoans = await this.loanRepository.findActiveByEmployeeId(id);
    if (activeLoans.length > 0) {
      throw new LibraryError(
        '貸出中の書籍がある社員は削除できません',
        ErrorCode.CANNOT_DELETE_EMPLOYEE_WITH_LOANS
      );
    }

    const deleted = await this.employeeRepository.delete(id);
    if (!deleted) {
      throw new LibraryError(
        '社員の削除に失敗しました',
        ErrorCode.DATA_SAVE_FAILED
      );
    }

    // バーコード画像を削除
    try {
      this.barcodeService.deleteBarcode(id);
    } catch (error) {
      // バーコード削除に失敗しても社員削除は成功とする
      console.warn(`バーコード画像の削除に失敗しました: ${error}`);
    }
  }

  /**
   * すべての社員を取得
   * @returns すべての社員
   */
  async getAllEmployees(): Promise<Employee[]> {
    return await this.employeeRepository.findAll();
  }

  /**
   * IDで社員を取得
   * @param id 社員ID
   * @returns 社員
   */
  async getEmployeeById(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new LibraryError(
        '指定された社員が見つかりません',
        ErrorCode.EMPLOYEE_NOT_FOUND
      );
    }
    return employee;
  }

  /**
   * バーコードで社員を取得
   * @param barcode バーコード
   * @returns 社員
   */
  async getEmployeeByBarcode(barcode: string): Promise<Employee> {
    const employee = await this.employeeRepository.findByBarcode(barcode);
    if (!employee) {
      throw new LibraryError(
        '指定されたバーコードの社員が見つかりません',
        ErrorCode.EMPLOYEE_NOT_FOUND
      );
    }
    return employee;
  }

  /**
   * 社員のバーコード画像を生成
   * @param employeeId 社員ID
   * @returns バーコード画像のファイルパス
   */
  async generateEmployeeBarcode(employeeId: string): Promise<string> {
    // 社員の存在確認
    const employee = await this.employeeRepository.findById(employeeId);
    if (!employee) {
      throw new LibraryError(
        '指定された社員が見つかりません',
        ErrorCode.EMPLOYEE_NOT_FOUND
      );
    }

    try {
      return await this.barcodeService.generateEmployeeBarcode(employeeId);
    } catch (error) {
      throw new LibraryError(
        `バーコード画像の生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
        ErrorCode.DATA_SAVE_FAILED
      );
    }
  }

  /**
   * 社員の現在の貸出冊数を取得
   * @param employeeId 社員ID
   * @returns 貸出中の書籍数
   */
  async getEmployeeActiveLoanCount(employeeId: string): Promise<number> {
    const activeLoans = await this.loanRepository.findActiveByEmployeeId(employeeId);
    return activeLoans.length;
  }

  /**
   * メールアドレス形式を検証
   * @param email メールアドレス
   * @returns 有効な場合true
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
