import { Book, LibraryError, ErrorCode } from '../models';
import { IRepository } from './IRepository';
import { FileUtils } from '../utils/fileUtils';

export class BookRepository implements IRepository<Book> {
  private readonly dataFile: string;

  constructor(dataFile: string) {
    this.dataFile = dataFile;
  }

  async findAll(): Promise<Book[]> {
    return await FileUtils.readJSON<Book>(this.dataFile);
  }

  async findById(id: string): Promise<Book | null> {
    const books = await this.findAll();
    return books.find((book) => book.id === id) || null;
  }

  async save(entity: Book): Promise<Book> {
    const books = await this.findAll();
    books.push(entity);
    await FileUtils.writeJSON(this.dataFile, books);
    return entity;
  }

  async update(id: string, entity: Partial<Book>): Promise<Book> {
    const books = await this.findAll();
    const index = books.findIndex((book) => book.id === id);

    if (index === -1) {
      throw new LibraryError('指定された書籍が見つかりません', ErrorCode.BOOK_NOT_FOUND);
    }

    books[index] = { ...books[index], ...entity };
    await FileUtils.writeJSON(this.dataFile, books);
    return books[index];
  }

  async delete(id: string): Promise<boolean> {
    const books = await this.findAll();
    const index = books.findIndex((book) => book.id === id);

    if (index === -1) {
      return false;
    }

    books.splice(index, 1);
    await FileUtils.writeJSON(this.dataFile, books);
    return true;
  }

  async findByTitle(title: string): Promise<Book[]> {
    const books = await this.findAll();
    return books.filter((book) =>
      book.title.toLowerCase().includes(title.toLowerCase())
    );
  }

  async findByAuthor(author: string): Promise<Book[]> {
    const books = await this.findAll();
    return books.filter((book) =>
      book.author.toLowerCase().includes(author.toLowerCase())
    );
  }

  async findByISBN(isbn: string): Promise<Book | null> {
    const books = await this.findAll();
    return books.find((book) => book.isbn === isbn) || null;
  }

  async findAvailable(): Promise<Book[]> {
    const books = await this.findAll();
    return books.filter((book) => book.status === 'available');
  }
}
