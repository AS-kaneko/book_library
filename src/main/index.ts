import { app, BrowserWindow, ipcMain, protocol } from 'electron';
import path from 'path';
import * as fs from 'fs';

// サービス層のインポート
import { BookService } from '../services/BookService';
import { EmployeeService } from '../services/EmployeeService';
import { LoanService } from '../services/LoanService';
import { BarcodeService } from '../services/BarcodeService';
import { BookInfoService } from '../services/BookInfoService';

// リポジトリ層のインポート
import { BookRepository } from '../repositories/BookRepository';
import { EmployeeRepository } from '../repositories/EmployeeRepository';
import { LoanRepository } from '../repositories/LoanRepository';

// モデルのインポート
import { Book, Employee, LibraryError } from '../models';

// ユーティリティのインポート
import { generateSampleBooks, generateSampleEmployees } from '../utils/sampleData';

let mainWindow: BrowserWindow | null = null;

// サービスインスタンス
let bookService: BookService;
let employeeService: EmployeeService;
let loanService: LoanService;

/**
 * データディレクトリを初期化し、サンプルデータを作成
 */
function initializeDataDirectory(): void {
  const dataDir = path.join(app.getPath('userData'), 'data');
  const barcodesDir = path.join(dataDir, 'barcodes');

  console.log('=== データディレクトリ初期化 ===');
  console.log('データディレクトリ:', dataDir);

  // ディレクトリが存在しない場合は作成
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('データディレクトリを作成しました');
  }
  if (!fs.existsSync(barcodesDir)) {
    fs.mkdirSync(barcodesDir, { recursive: true });
    console.log('バーコードディレクトリを作成しました');
  }

  const booksFile = path.join(dataDir, 'books.json');
  const employeesFile = path.join(dataDir, 'employees.json');
  const loansFile = path.join(dataDir, 'loans.json');

  // 書籍データの初期化
  if (!fs.existsSync(booksFile)) {
    // サンプル書籍データを作成
    const sampleBooks = generateSampleBooks();
    fs.writeFileSync(booksFile, JSON.stringify(sampleBooks, null, 2), 'utf-8');
    console.log('サンプル書籍データを作成しました');
  } else {
    // ファイルが存在するが空の場合もサンプルデータを作成
    const content = fs.readFileSync(booksFile, 'utf-8');
    try {
      const data = JSON.parse(content);
      if (Array.isArray(data) && data.length === 0) {
        const sampleBooks = generateSampleBooks();
        fs.writeFileSync(booksFile, JSON.stringify(sampleBooks, null, 2), 'utf-8');
        console.log('サンプル書籍データを作成しました');
      }
    } catch (error) {
      // JSONパースエラーの場合は空配列で初期化
      fs.writeFileSync(booksFile, '[]', 'utf-8');
    }
  }

  // 社員データの初期化
  if (!fs.existsSync(employeesFile)) {
    // サンプル社員データを作成
    const sampleEmployees = generateSampleEmployees();
    fs.writeFileSync(employeesFile, JSON.stringify(sampleEmployees, null, 2), 'utf-8');
    console.log('サンプル社員データを作成しました');
  } else {
    // ファイルが存在するが空の場合もサンプルデータを作成
    const content = fs.readFileSync(employeesFile, 'utf-8');
    try {
      const data = JSON.parse(content);
      if (Array.isArray(data) && data.length === 0) {
        const sampleEmployees = generateSampleEmployees();
        fs.writeFileSync(employeesFile, JSON.stringify(sampleEmployees, null, 2), 'utf-8');
        console.log('サンプル社員データを作成しました');
      }
    } catch (error) {
      // JSONパースエラーの場合は空配列で初期化
      fs.writeFileSync(employeesFile, '[]', 'utf-8');
    }
  }

  // 貸出履歴データの初期化（空配列）
  if (!fs.existsSync(loansFile)) {
    fs.writeFileSync(loansFile, '[]', 'utf-8');
    console.log('貸出履歴ファイルを作成しました');
  }
}

/**
 * サービス層を初期化
 */
function initializeServices(): void {
  const dataDir = path.join(app.getPath('userData'), 'data');
  const barcodesDir = path.join(dataDir, 'barcodes');

  // リポジトリのインスタンス化
  const bookRepository = new BookRepository(path.join(dataDir, 'books.json'));
  const employeeRepository = new EmployeeRepository(path.join(dataDir, 'employees.json'));
  const loanRepository = new LoanRepository(path.join(dataDir, 'loans.json'));

  // バーコードサービスのインスタンス化
  const barcodeService = new BarcodeService(barcodesDir);

  // サービスのインスタンス化
  bookService = new BookService(bookRepository, barcodeService);
  employeeService = new EmployeeService(employeeRepository, loanRepository, barcodeService);
  loanService = new LoanService(loanRepository, bookRepository, employeeRepository);
}

/**
 * IPC通信ハンドラーを登録
 */
function registerIPCHandlers(): void {
  // ========== 書籍関連のハンドラー ==========

  // すべての書籍を取得
  ipcMain.handle('books:getAll', async () => {
    try {
      return await bookService.getAllBooks();
    } catch (error) {
      throw serializeError(error);
    }
  });

  // 書籍を追加
  ipcMain.handle('books:add', async (_event, title: string, author: string, isbn: string) => {
    try {
      return await bookService.addBook(title, author, isbn);
    } catch (error) {
      throw serializeError(error);
    }
  });

  // 書籍を更新
  ipcMain.handle('books:update', async (_event, id: string, updates: Partial<Book>) => {
    try {
      return await bookService.updateBook(id, updates);
    } catch (error) {
      throw serializeError(error);
    }
  });

  // 書籍を削除
  ipcMain.handle('books:delete', async (_event, id: string) => {
    try {
      await bookService.deleteBook(id);
      return { success: true };
    } catch (error) {
      throw serializeError(error);
    }
  });

  // 書籍を検索
  ipcMain.handle('books:search', async (_event, query: string) => {
    try {
      return await bookService.searchBooks(query);
    } catch (error) {
      throw serializeError(error);
    }
  });

  // 利用可能な書籍を取得
  ipcMain.handle('books:getAvailable', async () => {
    try {
      return await bookService.getAvailableBooks();
    } catch (error) {
      throw serializeError(error);
    }
  });

  // IDで書籍を取得
  ipcMain.handle('books:getById', async (_event, id: string) => {
    try {
      return await bookService.getBookById(id);
    } catch (error) {
      throw serializeError(error);
    }
  });

  // ISBNで書籍を取得
  ipcMain.handle('books:getByISBN', async (_event, isbn: string) => {
    try {
      return await bookService.getBookByISBN(isbn);
    } catch (error) {
      throw serializeError(error);
    }
  });

  // ISBNから書籍情報を取得
  ipcMain.handle('books:fetchInfo', async (_event, isbn: string) => {
    try {
      const bookInfoService = new BookInfoService();
      return await bookInfoService.fetchBookInfo(isbn);
    } catch (error) {
      throw serializeError(error);
    }
  });

  // ========== 社員関連のハンドラー ==========

  // すべての社員を取得
  ipcMain.handle('employees:getAll', async () => {
    try {
      return await employeeService.getAllEmployees();
    } catch (error) {
      throw serializeError(error);
    }
  });

  // 社員を追加
  ipcMain.handle('employees:add', async (_event, id: string, name: string, email: string) => {
    try {
      return await employeeService.addEmployee(id, name, email);
    } catch (error) {
      throw serializeError(error);
    }
  });

  // 社員を更新
  ipcMain.handle('employees:update', async (_event, id: string, updates: Partial<Employee>) => {
    try {
      return await employeeService.updateEmployee(id, updates);
    } catch (error) {
      throw serializeError(error);
    }
  });

  // 社員を削除
  ipcMain.handle('employees:delete', async (_event, id: string) => {
    try {
      await employeeService.deleteEmployee(id);
      return { success: true };
    } catch (error) {
      throw serializeError(error);
    }
  });

  // IDで社員を取得
  ipcMain.handle('employees:getById', async (_event, id: string) => {
    try {
      return await employeeService.getEmployeeById(id);
    } catch (error) {
      throw serializeError(error);
    }
  });

  // バーコードで社員を取得
  ipcMain.handle('employees:getByBarcode', async (_event, barcode: string) => {
    try {
      return await employeeService.getEmployeeByBarcode(barcode);
    } catch (error) {
      throw serializeError(error);
    }
  });

  // バーコード画像を生成
  ipcMain.handle('employees:generateBarcode', async (_event, employeeId: string) => {
    try {
      const filePath = await employeeService.generateEmployeeBarcode(employeeId);
      // ファイルパスをカスタムプロトコルURLに変換
      const filename = path.basename(filePath);
      return `barcode://${filename}`;
    } catch (error) {
      throw serializeError(error);
    }
  });

  // バーコード画像URLを取得
  ipcMain.handle('employees:getBarcodeUrl', async (_event, employeeId: string) => {
    try {
      return `barcode://${employeeId}.png`;
    } catch (error) {
      throw serializeError(error);
    }
  });

  // 社員の貸出冊数を取得
  ipcMain.handle('employees:getActiveLoanCount', async (_event, employeeId: string) => {
    try {
      return await employeeService.getEmployeeActiveLoanCount(employeeId);
    } catch (error) {
      throw serializeError(error);
    }
  });

  // ========== 貸出関連のハンドラー ==========

  // 書籍を貸し出す
  ipcMain.handle('loans:borrow', async (_event, bookId: string, employeeId: string) => {
    try {
      return await loanService.borrowBook(bookId, employeeId);
    } catch (error) {
      throw serializeError(error);
    }
  });

  // ISBNで書籍を貸し出す
  ipcMain.handle('loans:borrowByISBN', async (_event, isbn: string, employeeId: string) => {
    try {
      return await loanService.borrowBookByISBN(isbn, employeeId);
    } catch (error) {
      throw serializeError(error);
    }
  });

  // バーコードで書籍を貸し出す
  ipcMain.handle('loans:borrowByBarcodes', async (_event, isbn: string, barcode: string) => {
    try {
      return await loanService.borrowBookByBarcodes(isbn, barcode);
    } catch (error) {
      throw serializeError(error);
    }
  });

  // 書籍を返却
  ipcMain.handle('loans:return', async (_event, bookId: string) => {
    try {
      return await loanService.returnBook(bookId);
    } catch (error) {
      throw serializeError(error);
    }
  });

  // ISBNで書籍を返却
  ipcMain.handle('loans:returnByISBN', async (_event, isbn: string) => {
    try {
      return await loanService.returnBookByISBN(isbn);
    } catch (error) {
      throw serializeError(error);
    }
  });

  // 貸出履歴を取得
  ipcMain.handle('loans:getHistory', async (_event, bookId?: string, employeeId?: string) => {
    try {
      return await loanService.getLoanHistory(bookId, employeeId);
    } catch (error) {
      throw serializeError(error);
    }
  });

  // アクティブな貸出を取得
  ipcMain.handle('loans:getActive', async () => {
    try {
      return await loanService.getActiveLoans();
    } catch (error) {
      throw serializeError(error);
    }
  });

  // 社員のアクティブな貸出を取得
  ipcMain.handle('loans:getEmployeeActive', async (_event, employeeId: string) => {
    try {
      return await loanService.getEmployeeActiveLoans(employeeId);
    } catch (error) {
      throw serializeError(error);
    }
  });
}

/**
 * サンプル社員のバーコード画像を生成
 */
async function generateSampleBarcodes(): Promise<void> {
  try {
    const sampleEmployees = generateSampleEmployees();
    const dataDir = path.join(app.getPath('userData'), 'data');
    const barcodesDir = path.join(dataDir, 'barcodes');
    const barcodeService = new BarcodeService(barcodesDir);

    for (const employee of sampleEmployees) {
      // バーコード画像が存在しない場合のみ生成
      if (!barcodeService.barcodeExists(employee.id)) {
        await barcodeService.generateEmployeeBarcode(employee.id);
        console.log(`バーコード画像を生成しました: ${employee.id}`);
      }
    }
  } catch (error) {
    console.error('バーコード画像の生成に失敗しました:', error);
  }
}

/**
 * エラーをシリアライズ可能な形式に変換
 */
function serializeError(error: unknown): Error {
  if (error instanceof LibraryError) {
    const serialized = new Error(error.message);
    serialized.name = 'LibraryError';
    (serialized as any).code = error.code;
    return serialized;
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

/**
 * メインウィンドウを作成
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: '図書管理システム',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // 開発モードかどうかを判定
  const isDev = !app.isPackaged;
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// カスタムプロトコルを登録（barcode://）
function registerBarcodeProtocol(): void {
  protocol.registerFileProtocol('barcode', (request, callback) => {
    const url = request.url.replace('barcode://', '');
    const dataDir = path.join(app.getPath('userData'), 'data', 'barcodes');
    const filePath = path.join(dataDir, url);

    // セキュリティチェック: barcodesディレクトリ外へのアクセスを防ぐ
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(dataDir)) {
      callback({ error: -10 }); // ACCESS_DENIED
      return;
    }

    callback({ path: normalizedPath });
  });
}

// アプリケーション起動時の処理
app.whenReady().then(async () => {
  // カスタムプロトコルの登録
  registerBarcodeProtocol();

  // データディレクトリの初期化
  initializeDataDirectory();

  // サービス層の初期化
  initializeServices();

  // サンプル社員のバーコード画像を生成
  await generateSampleBarcodes();

  // IPC通信ハンドラーの登録
  registerIPCHandlers();

  // メインウィンドウの作成
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
