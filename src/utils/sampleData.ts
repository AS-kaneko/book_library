import { v4 as uuidv4 } from 'uuid';
import { Book, BookStatus } from '../models/Book';
import { Employee } from '../models/Employee';

/**
 * サンプル書籍データを生成
 * @returns サンプル書籍の配列
 */
export function generateSampleBooks(): Book[] {
  return [
    {
      id: uuidv4(),
      title: 'リーダブルコード',
      author: 'Dustin Boswell, Trevor Foucher',
      isbn: '9784873115658',
      registeredAt: new Date(),
      status: BookStatus.AVAILABLE,
    },
    {
      id: uuidv4(),
      title: 'プログラマが知るべき97のこと',
      author: 'Kevlin Henney',
      isbn: '9784873114798',
      registeredAt: new Date(),
      status: BookStatus.AVAILABLE,
    },
    {
      id: uuidv4(),
      title: 'リファクタリング（第2版）',
      author: 'Martin Fowler',
      isbn: '9784274224546',
      registeredAt: new Date(),
      status: BookStatus.AVAILABLE,
    },
    {
      id: uuidv4(),
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '9784048930598',
      registeredAt: new Date(),
      status: BookStatus.AVAILABLE,
    },
    {
      id: uuidv4(),
      title: 'プログラミングTypeScript',
      author: 'Boris Cherny',
      isbn: '9784873119045',
      registeredAt: new Date(),
      status: BookStatus.AVAILABLE,
    },
  ];
}

/**
 * サンプル社員データを生成
 * @returns サンプル社員の配列
 */
export function generateSampleEmployees(): Employee[] {
  return [
    {
      id: 'EMP001',
      name: '山田太郎',
      email: 'yamada@company.com',
      barcode: 'EMP001',
      registeredAt: new Date(),
    },
    {
      id: 'EMP002',
      name: '佐藤花子',
      email: 'sato@company.com',
      barcode: 'EMP002',
      registeredAt: new Date(),
    },
    {
      id: 'EMP003',
      name: '田中一郎',
      email: 'tanaka@company.com',
      barcode: 'EMP003',
      registeredAt: new Date(),
    },
  ];
}
