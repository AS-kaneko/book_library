import bwipjs from 'bwip-js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * バーコードサービス
 * 会員バーコード画像の生成とISBN検証を提供
 */
export class BarcodeService {
  private outputDir: string;

  constructor(outputDir: string = 'data/barcodes') {
    this.outputDir = outputDir;
    this.ensureOutputDirectory();
  }

  /**
   * 出力ディレクトリが存在することを確認し、なければ作成
   */
  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 会員バーコード画像を生成
   * @param employeeId 社員ID
   * @returns 生成されたバーコード画像のファイルパス
   */
  async generateEmployeeBarcode(employeeId: string): Promise<string> {
    try {
      // CODE128形式でバーコード画像を生成
      const png = await bwipjs.toBuffer({
        bcid: 'code128',       // バーコードタイプ
        text: employeeId,       // エンコードするテキスト
        scale: 3,               // スケール係数
        height: 10,             // バーの高さ（ミリメートル）
        includetext: true,      // テキストを含める
        textxalign: 'center',   // テキストの水平配置
      });

      // ファイル名とパスを生成
      const filename = `${employeeId}.png`;
      const filepath = path.join(this.outputDir, filename);

      // PNG画像をファイルに保存
      fs.writeFileSync(filepath, png);

      return filepath;
    } catch (error) {
      throw new Error(
        `バーコード画像の生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * ISBN形式を検証
   * ISBN-10またはISBN-13の形式をチェック
   * @param isbn 検証するISBN文字列
   * @returns 有効な場合true、無効な場合false
   */
  validateISBN(isbn: string): boolean {
    // ハイフンとスペースを除去
    const cleanISBN = isbn.replace(/[-\s]/g, '');

    // ISBN-10の検証
    if (cleanISBN.length === 10) {
      return this.validateISBN10(cleanISBN);
    }

    // ISBN-13の検証
    if (cleanISBN.length === 13) {
      return this.validateISBN13(cleanISBN);
    }

    return false;
  }

  /**
   * ISBN-10形式を検証
   * @param isbn クリーンなISBN-10文字列（10桁）
   * @returns 有効な場合true
   */
  private validateISBN10(isbn: string): boolean {
    // 最初の9桁は数字、最後の1桁は数字またはX
    if (!/^\d{9}[\dX]$/.test(isbn)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(isbn[i]) * (10 - i);
    }

    // 最後の桁（チェックディジット）
    const checkDigit = isbn[9] === 'X' ? 10 : parseInt(isbn[9]);
    sum += checkDigit;

    // 合計が11で割り切れる必要がある
    return sum % 11 === 0;
  }

  /**
   * ISBN-13形式を検証
   * @param isbn クリーンなISBN-13文字列（13桁）
   * @returns 有効な場合true
   */
  private validateISBN13(isbn: string): boolean {
    // 13桁すべてが数字である必要がある
    if (!/^\d{13}$/.test(isbn)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(isbn[i]);
      // 偶数位置（0-indexed）は1倍、奇数位置は3倍
      sum += i % 2 === 0 ? digit : digit * 3;
    }

    // チェックディジット
    const checkDigit = parseInt(isbn[12]);
    const calculatedCheckDigit = (10 - (sum % 10)) % 10;

    return checkDigit === calculatedCheckDigit;
  }

  /**
   * バーコード画像ファイルのパスを取得
   * @param employeeId 社員ID
   * @returns バーコード画像のファイルパス
   */
  getBarcodeFilePath(employeeId: string): string {
    return path.join(this.outputDir, `${employeeId}.png`);
  }

  /**
   * バーコード画像が存在するか確認
   * @param employeeId 社員ID
   * @returns 存在する場合true
   */
  barcodeExists(employeeId: string): boolean {
    const filepath = this.getBarcodeFilePath(employeeId);
    return fs.existsSync(filepath);
  }

  /**
   * バーコード画像を削除
   * @param employeeId 社員ID
   * @returns 削除に成功した場合true
   */
  deleteBarcode(employeeId: string): boolean {
    try {
      const filepath = this.getBarcodeFilePath(employeeId);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return true;
      }
      return false;
    } catch (error) {
      throw new Error(
        `バーコード画像の削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
