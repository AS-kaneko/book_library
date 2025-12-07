import * as fs from 'fs/promises';
import * as path from 'path';
import { LibraryError, ErrorCode } from '../models';

export class FileUtils {
  /**
   * JSONファイルからデータを読み込む
   * @param filePath ファイルの絶対パス
   */
  static async readJSON<T>(filePath: string): Promise<T[]> {
    try {
      // ファイルが存在しない場合は空配列を返す
      try {
        await fs.access(filePath);
      } catch {
        return [];
      }

      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data, this.dateReviver);
    } catch (error) {
      throw new LibraryError(
        `データの読み込みに失敗しました: ${filePath}`,
        ErrorCode.DATA_LOAD_FAILED
      );
    }
  }

  /**
   * JSONファイルにデータを書き込む
   * @param filePath ファイルの絶対パス
   * @param data 書き込むデータ
   */
  static async writeJSON<T>(filePath: string, data: T[]): Promise<void> {
    try {
      // ディレクトリが存在しない場合は作成
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      throw new LibraryError(
        `データの保存に失敗しました: ${filePath}`,
        ErrorCode.DATA_SAVE_FAILED
      );
    }
  }

  /**
   * JSON.parseのreviver関数 - Date文字列をDateオブジェクトに変換
   */
  private static dateReviver(_key: string, value: any): any {
    if (typeof value === 'string') {
      // ISO 8601形式の日付文字列を検出
      const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
      if (datePattern.test(value)) {
        return new Date(value);
      }
    }
    return value;
  }
}
