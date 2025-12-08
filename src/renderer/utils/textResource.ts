import { useMode } from '../contexts/ModeContext';

export type TextKey =
    | 'appTitle'
    | 'menuBooks'
    | 'menuEmployees'
    | 'menuLoans'
    | 'menuHistory'
    | 'skipToMain'
    | 'footerCopy'
    | 'modeToggleNormal'
    | 'modeToggleKids'
    // 書籍管理画面
    | 'booksTitle'
    | 'searchPlaceholder'
    | 'btnAddBook'
    | 'colIsbn'
    | 'colTitle'
    | 'colAuthor'
    | 'colPublisher'
    | 'colYear'
    | 'colStatus'
    | 'colActions'
    | 'statusAvailable'
    | 'statusLent'
    | 'actionEdit'
    | 'actionDelete'
    // 貸出画面
    | 'loansTitle'
    | 'scanInstruction'
    | 'tabLend'
    | 'tabReturn'
    | 'employeeId'
    | 'bookIsbn'
    | 'btnLend'
    | 'btnReturn'
    | 'scanCamera'
    ;

const resources: Record<TextKey, { normal: string; kids: string }> = {
    appTitle: { normal: '社内図書管理システム', kids: 'としょかん システム' },
    menuBooks: { normal: '書籍管理', kids: 'ほんを さがす' },
    menuEmployees: { normal: '社員管理', kids: 'おともだち' },
    menuLoans: { normal: '貸出・返却', kids: 'かりる・かえす' },
    menuHistory: { normal: '履歴', kids: 'りれき' },
    skipToMain: { normal: 'メインコンテンツへスキップ', kids: 'なかみへ ジャンプ' },
    footerCopy: { normal: '© 2024 社内図書管理システム', kids: '© 2024 としょかん システム' },
    modeToggleNormal: { normal: '通常モード', kids: 'おとな' },
    modeToggleKids: { normal: 'キッズモード', kids: 'こども' },

    // 書籍管理
    booksTitle: { normal: '書籍管理', kids: 'ほんの いちらん' },
    searchPlaceholder: { normal: 'タイトル、著者、ISBNで検索...', kids: 'どのほんを さがす？' },
    btnAddBook: { normal: '書籍を追加', kids: 'あたらしい ほん' },
    colIsbn: { normal: 'ISBN', kids: 'ばーこーど' },
    colTitle: { normal: 'タイトル', kids: 'ほんの なまえ' },
    colAuthor: { normal: '著者', kids: 'かいた ひと' },
    colPublisher: { normal: '出版社', kids: 'つくった かいしゃ' },
    colYear: { normal: '出版年', kids: 'いつ できた' },
    colStatus: { normal: '状態', kids: 'いま どう？' },
    colActions: { normal: '操作', kids: 'やること' },
    statusAvailable: { normal: '利用可能', kids: 'かりられるよ' },
    statusLent: { normal: '貸出中', kids: 'だれかが よんでるよ' },
    actionEdit: { normal: '編集', kids: 'なおす' },
    actionDelete: { normal: '削除', kids: 'けす' },

    // 貸出画面
    loansTitle: { normal: '貸出・返却', kids: 'かりる・かえす' },
    scanInstruction: { normal: 'バーコードをスキャンするか、IDを入力してください', kids: 'ばーこーどを みせてね' },
    tabLend: { normal: '貸出', kids: 'かりる' },
    tabReturn: { normal: '返却', kids: 'かえす' },
    employeeId: { normal: '社員ID', kids: 'きみの ばんごう' },
    bookIsbn: { normal: '書籍ISBN', kids: 'ほんの ばーこーど' },
    btnLend: { normal: '貸出実行', kids: 'かりる！' },
    btnReturn: { normal: '返却実行', kids: 'かえす！' },
    scanCamera: { normal: 'カメラスキャン', kids: 'かめらで みる' },

};

export const useAppText = () => {
    const { isKidsMode } = useMode();

    const getText = (key: TextKey) => {
        return resources[key][isKidsMode ? 'kids' : 'normal'];
    };

    return { getText, isKidsMode };
};
