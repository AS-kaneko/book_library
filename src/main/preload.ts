import { ipcRenderer } from 'electron';
import { Book, Employee, LoanRecord } from '../models';

/**
 * Preloadスクリプト
 * レンダラープロセスからメインプロセスへのIPC通信を提供
 */

// グローバルなAPIオブジェクトを定義
declare global {
  interface Window {
    api: {
      // 書籍関連
      books: {
        getAll: () => Promise<Book[]>;
        add: (title: string, author: string, isbn: string) => Promise<Book>;
        update: (id: string, updates: Partial<Book>) => Promise<Book>;
        delete: (id: string) => Promise<{ success: boolean }>;
        search: (query: string) => Promise<Book[]>;
        getAvailable: () => Promise<Book[]>;
        getById: (id: string) => Promise<Book>;
        getByISBN: (isbn: string) => Promise<Book>;
      };
      // 社員関連
      employees: {
        getAll: () => Promise<Employee[]>;
        add: (id: string, name: string, email: string) => Promise<Employee>;
        update: (id: string, updates: Partial<Employee>) => Promise<Employee>;
        delete: (id: string) => Promise<{ success: boolean }>;
        getById: (id: string) => Promise<Employee>;
        getByBarcode: (barcode: string) => Promise<Employee>;
        generateBarcode: (employeeId: string) => Promise<string>;
        getActiveLoanCount: (employeeId: string) => Promise<number>;
      };
      // 貸出関連
      loans: {
        borrow: (bookId: string, employeeId: string) => Promise<LoanRecord>;
        borrowByISBN: (isbn: string, employeeId: string) => Promise<LoanRecord>;
        borrowByBarcodes: (isbn: string, barcode: string) => Promise<LoanRecord>;
        return: (bookId: string) => Promise<LoanRecord>;
        returnByISBN: (isbn: string) => Promise<LoanRecord>;
        getHistory: (bookId?: string, employeeId?: string) => Promise<LoanRecord[]>;
        getActive: () => Promise<LoanRecord[]>;
        getEmployeeActive: (employeeId: string) => Promise<LoanRecord[]>;
      };
    };
  }
}

// APIオブジェクトをwindowに公開
window.api = {
  books: {
    getAll: () => ipcRenderer.invoke('books:getAll'),
    add: (title: string, author: string, isbn: string) =>
      ipcRenderer.invoke('books:add', title, author, isbn),
    update: (id: string, updates: Partial<Book>) =>
      ipcRenderer.invoke('books:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('books:delete', id),
    search: (query: string) => ipcRenderer.invoke('books:search', query),
    getAvailable: () => ipcRenderer.invoke('books:getAvailable'),
    getById: (id: string) => ipcRenderer.invoke('books:getById', id),
    getByISBN: (isbn: string) => ipcRenderer.invoke('books:getByISBN', isbn),
  },
  employees: {
    getAll: () => ipcRenderer.invoke('employees:getAll'),
    add: (id: string, name: string, email: string) =>
      ipcRenderer.invoke('employees:add', id, name, email),
    update: (id: string, updates: Partial<Employee>) =>
      ipcRenderer.invoke('employees:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('employees:delete', id),
    getById: (id: string) => ipcRenderer.invoke('employees:getById', id),
    getByBarcode: (barcode: string) =>
      ipcRenderer.invoke('employees:getByBarcode', barcode),
    generateBarcode: (employeeId: string) =>
      ipcRenderer.invoke('employees:generateBarcode', employeeId),
    getActiveLoanCount: (employeeId: string) =>
      ipcRenderer.invoke('employees:getActiveLoanCount', employeeId),
  },
  loans: {
    borrow: (bookId: string, employeeId: string) =>
      ipcRenderer.invoke('loans:borrow', bookId, employeeId),
    borrowByISBN: (isbn: string, employeeId: string) =>
      ipcRenderer.invoke('loans:borrowByISBN', isbn, employeeId),
    borrowByBarcodes: (isbn: string, barcode: string) =>
      ipcRenderer.invoke('loans:borrowByBarcodes', isbn, barcode),
    return: (bookId: string) => ipcRenderer.invoke('loans:return', bookId),
    returnByISBN: (isbn: string) => ipcRenderer.invoke('loans:returnByISBN', isbn),
    getHistory: (bookId?: string, employeeId?: string) =>
      ipcRenderer.invoke('loans:getHistory', bookId, employeeId),
    getActive: () => ipcRenderer.invoke('loans:getActive'),
    getEmployeeActive: (employeeId: string) =>
      ipcRenderer.invoke('loans:getEmployeeActive', employeeId),
  },
};
