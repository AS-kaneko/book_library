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
    | 'booksSubtitle'
    | 'searchPlaceholder'
    | 'btnAddBook'
    | 'filterAvailableOnly'
    | 'colIsbn'
    | 'colTitle'
    | 'colAuthor'
    | 'colPublisher'
    | 'colYear'
    | 'colStatus'
    | 'colActions'
    | 'colCover'
    | 'statusAvailable'
    | 'statusLent'
    | 'actionEdit'
    | 'actionDelete'
    | 'emptyBooks'
    | 'loadingBooks'
    | 'modalAddBook'
    | 'modalEditBook'
    | 'modalDeleteBook'
    | 'confirmDelete'
    | 'deleteWarning'
    | 'btnCancel'
    | 'btnAdd'
    | 'btnUpdate'
    | 'btnDelete'
    | 'labelIsbn'
    | 'labelTitle'
    | 'labelAuthor'
    | 'labelCoverUrl'
    | 'btnFetchBookInfo'
    | 'noImage'
    | 'coverPreview'
    // 貸出管理画面
    | 'loansTitle'
    | 'scanInstruction'
    | 'tabLend'
    | 'tabReturn'
    | 'sectionLend'
    | 'sectionReturn'
    | 'employeeId'
    | 'bookIsbn'
    | 'btnLend'
    | 'btnReturn'
    | 'scanCamera'
    | 'labelMemberBarcode'
    | 'labelBookBarcode'
    | 'placeholderMemberBarcode'
    | 'placeholderBookBarcode'
    | 'btnClear'
    | 'activeLoansTitle'
    | 'colBookTitle'
    | 'colBorrower'
    | 'colBorrowDate'
    | 'colDaysElapsed'
    | 'emptyActiveLoans'
    | 'loadingLoans'
    | 'employeeInfo'
    | 'bookInfo'
    | 'loanCount'
    // 社員管理画面
    | 'employeesTitle'
    | 'btnAddEmployee'
    | 'colEmployeeId'
    | 'colName'
    | 'colEmail'
    | 'colLoaned'
    | 'emptyEmployees'
    | 'loadingEmployees'
    | 'modalAddEmployee'
    | 'modalEditEmployee'
    | 'modalDeleteEmployee'
    | 'modalBarcode'
    | 'labelEmployeeId'
    | 'labelName'
    | 'labelEmail'
    | 'placeholderEmployeeId'
    | 'placeholderName'
    | 'placeholderEmail'
    | 'btnBarcode'
    | 'barcodeDescription'
    // 履歴画面
    | 'historyTitle'
    | 'filterTitle'
    | 'filterAllBooks'
    | 'filterAllEmployees'
    | 'filterAllStatus'
    | 'filterActive'
    | 'filterReturned'
    | 'labelStartDate'
    | 'labelEndDate'
    | 'btnClearFilters'
    | 'historyCount'
    | 'colLoanPeriod'
    | 'emptyHistory'
    | 'loadingHistory'
    // エラー・成功メッセージ
    | 'errorLoadBooks'
    | 'errorAddBook'
    | 'errorUpdateBook'
    | 'errorDeleteBook'
    | 'errorLoadEmployees'
    | 'errorAddEmployee'
    | 'errorUpdateEmployee'
    | 'errorDeleteEmployee'
    | 'errorLoadLoans'
    | 'errorBorrow'
    | 'errorReturn'
    | 'errorLoadHistory'
    | 'errorNotFound'
    | 'errorValidation'
    | 'errorBarcode'
    | 'successAddBook'
    | 'successUpdateBook'
    | 'successDeleteBook'
    | 'successAddEmployee'
    | 'successUpdateEmployee'
    | 'successDeleteEmployee'
    | 'successBorrow'
    | 'successReturn'
    | 'successBarcode'
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
    booksSubtitle: { normal: '図書館にある本を探したり、追加したりできます', kids: 'としょかんに ある ほんを さがしたり、ついかしたり できるよ' },
    searchPlaceholder: { normal: 'タイトル、著者、ISBNで検索...', kids: 'どのほんを さがす？' },
    btnAddBook: { normal: '書籍を追加', kids: 'あたらしい ほん' },
    filterAvailableOnly: { normal: '利用可能のみ表示', kids: 'かりられる ほん だけ みる' },
    colIsbn: { normal: 'ISBN', kids: 'バーコード' },
    colTitle: { normal: 'タイトル', kids: 'ほんの なまえ' },
    colAuthor: { normal: '著者', kids: 'かいた ひと' },
    colPublisher: { normal: '出版社', kids: 'つくった かいしゃ' },
    colYear: { normal: '出版年', kids: 'いつ できた' },
    colStatus: { normal: '状態', kids: 'いま どう？' },
    colActions: { normal: '操作', kids: 'やること' },
    colCover: { normal: '表紙', kids: 'ひょうし' },
    statusAvailable: { normal: '利用可能', kids: 'かりられるよ' },
    statusLent: { normal: '貸出中', kids: 'だれかが よんでるよ' },
    actionEdit: { normal: '編集', kids: 'なおす' },
    actionDelete: { normal: '削除', kids: 'けす' },
    emptyBooks: { normal: '書籍が見つかりませんでした', kids: 'ほんが みつからなかったよ' },
    loadingBooks: { normal: '書籍を読み込み中...', kids: 'ほんを よみこみちゅう...' },
    modalAddBook: { normal: '書籍を追加', kids: 'あたらしい ほんを ついか' },
    modalEditBook: { normal: '書籍を編集', kids: 'ほんの じょうほうを なおす' },
    modalDeleteBook: { normal: '書籍を削除', kids: 'ほんを けす' },
    confirmDelete: { normal: '本当に削除しますか？', kids: 'ほんとうに けしても いい？' },
    deleteWarning: { normal: 'この操作は取り消せません。', kids: 'もとに もどせないよ。' },
    btnCancel: { normal: 'キャンセル', kids: 'やめる' },
    btnAdd: { normal: '追加', kids: 'ついか' },
    btnUpdate: { normal: '更新', kids: 'こうしん' },
    btnDelete: { normal: '削除', kids: 'けす' },
    labelIsbn: { normal: 'ISBN', kids: 'バーコード' },
    labelTitle: { normal: 'タイトル', kids: 'ほんの なまえ' },
    labelAuthor: { normal: '著者', kids: 'かいた ひと' },
    labelCoverUrl: { normal: '表紙URL', kids: 'ひょうしの アドレス' },
    btnFetchBookInfo: { normal: '書籍情報を取得', kids: 'ほんの じょうほうを とる' },
    noImage: { normal: '画像なし', kids: 'がぞう なし' },
    coverPreview: { normal: '表紙プレビュー', kids: 'ひょうしの プレビュー' },

    // 貸出管理画面
    loansTitle: { normal: '貸出・返却', kids: 'かりる・かえす' },
    scanInstruction: { normal: 'バーコードをスキャンするか、IDを入力してください', kids: 'バーコードを みせてね' },
    tabLend: { normal: '貸出', kids: 'かりる' },
    tabReturn: { normal: '返却', kids: 'かえす' },
    sectionLend: { normal: '貸出', kids: 'ほんを かりる' },
    sectionReturn: { normal: '返却', kids: 'ほんを かえす' },
    employeeId: { normal: '社員ID', kids: 'きみの ばんごう' },
    bookIsbn: { normal: '書籍ISBN', kids: 'ほんの バーコード' },
    btnLend: { normal: '貸出実行', kids: 'かりる！' },
    btnReturn: { normal: '返却実行', kids: 'かえす！' },
    scanCamera: { normal: 'カメラスキャン', kids: 'かめらで みる' },
    labelMemberBarcode: { normal: '社員バーコード', kids: 'きみの バーコード' },
    labelBookBarcode: { normal: '書籍バーコード', kids: 'ほんの バーコード' },
    placeholderMemberBarcode: { normal: '社員バーコードを入力', kids: 'きみの バーコードを いれてね' },
    placeholderBookBarcode: { normal: '書籍バーコードを入力', kids: 'ほんの バーコードを いれてね' },
    btnClear: { normal: 'クリア', kids: 'けす' },
    activeLoansTitle: { normal: '貸出中の書籍', kids: 'いま かりてる ほん' },
    colBookTitle: { normal: '書籍タイトル', kids: 'ほんの なまえ' },
    colBorrower: { normal: '借りている人', kids: 'かりてる ひと' },
    colBorrowDate: { normal: '貸出日', kids: 'かりた ひ' },
    colDaysElapsed: { normal: '経過日数', kids: 'なんにち たった？' },
    emptyActiveLoans: { normal: '貸出中の書籍はありません', kids: 'いま かりてる ほんは ないよ' },
    loadingLoans: { normal: '貸出情報を読み込み中...', kids: 'かしだしの じょうほうを よみこみちゅう...' },
    employeeInfo: { normal: '社員情報', kids: 'きみの じょうほう' },
    bookInfo: { normal: '書籍情報', kids: 'ほんの じょうほう' },
    loanCount: { normal: '貸出数', kids: 'かりてる かず' },

    // 社員管理画面
    employeesTitle: { normal: '社員管理', kids: 'おともだち いちらん' },
    btnAddEmployee: { normal: '社員を追加', kids: 'あたらしい おともだち' },
    colEmployeeId: { normal: '社員ID', kids: 'ばんごう' },
    colName: { normal: '名前', kids: 'なまえ' },
    colEmail: { normal: 'メールアドレス', kids: 'メールアドレス' },
    colLoaned: { normal: '貸出中', kids: 'かりてる かず' },
    emptyEmployees: { normal: '社員が見つかりませんでした', kids: 'おともだちが みつからなかったよ' },
    loadingEmployees: { normal: '社員を読み込み中...', kids: 'おともだちを よみこみちゅう...' },
    modalAddEmployee: { normal: '社員を追加', kids: 'あたらしい おともだちを ついか' },
    modalEditEmployee: { normal: '社員を編集', kids: 'おともだちの じょうほうを なおす' },
    modalDeleteEmployee: { normal: '社員を削除', kids: 'おともだちを けす' },
    modalBarcode: { normal: 'バーコードを表示', kids: 'バーコードを みせる' },
    labelEmployeeId: { normal: '社員ID', kids: 'ばんごう' },
    labelName: { normal: '名前', kids: 'なまえ' },
    labelEmail: { normal: 'メールアドレス', kids: 'メールアドレス' },
    placeholderEmployeeId: { normal: '社員IDを入力', kids: 'ばんごうを いれてね' },
    placeholderName: { normal: '名前を入力', kids: 'なまえを いれてね' },
    placeholderEmail: { normal: 'メールアドレスを入力', kids: 'メールアドレスを いれてね' },
    btnBarcode: { normal: 'バーコード表示', kids: 'バーコード みせて' },
    barcodeDescription: { normal: 'このバーコードで貸出・返却ができます', kids: 'この バーコードで ほんを かりたり かえしたり できるよ' },

    // 履歴画面
    historyTitle: { normal: '貸出履歴', kids: '<ruby>貸<rt>か</rt></ruby>し<ruby>出<rt>だ</rt></ruby>し<ruby>履歴<rt>りれき</rt></ruby>' },
    filterTitle: { normal: 'フィルター', kids: 'さがす じょうけん' },
    filterAllBooks: { normal: 'すべての書籍', kids: 'すべての ほん' },
    filterAllEmployees: { normal: 'すべての社員', kids: 'すべての おともだち' },
    filterAllStatus: { normal: 'すべての状態', kids: 'すべての じょうたい' },
    filterActive: { normal: '貸出中', kids: 'かりてる' },
    filterReturned: { normal: '返却済み', kids: 'かえした' },
    labelStartDate: { normal: '開始日', kids: '<ruby>開始<rt>かいし</rt></ruby><ruby>日<rt>び</rt></ruby>' },
    labelEndDate: { normal: '終了日', kids: '<ruby>終了<rt>しゅうりょう</rt></ruby><ruby>日<rt>び</rt></ruby>' },
    btnClearFilters: { normal: 'フィルターをクリア', kids: 'さがす じょうけんを けす' },
    historyCount: { normal: '件の履歴', kids: 'けんの りれき' },
    colLoanPeriod: { normal: '貸出期間', kids: 'かりた きかん' },
    emptyHistory: { normal: '履歴が見つかりませんでした', kids: 'りれきが みつからなかったよ' },
    loadingHistory: { normal: '履歴を読み込み中...', kids: 'りれきを よみこみちゅう...' },

    // エラー・成功メッセージ
    errorLoadBooks: { normal: '書籍の読み込みに失敗しました', kids: 'ほんの よみこみに しっぱい しました' },
    errorAddBook: { normal: '書籍の追加に失敗しました', kids: 'ほんの ついかに しっぱい しました' },
    errorUpdateBook: { normal: '書籍の更新に失敗しました', kids: 'ほんの こうしんに しっぱい しました' },
    errorDeleteBook: { normal: '書籍の削除に失敗しました', kids: 'ほんの さくじょに しっぱい しました' },
    errorLoadEmployees: { normal: '社員の読み込みに失敗しました', kids: 'おともだちの よみこみに しっぱい しました' },
    errorAddEmployee: { normal: '社員の追加に失敗しました', kids: 'おともだちの ついかに しっぱい しました' },
    errorUpdateEmployee: { normal: '社員の更新に失敗しました', kids: 'おともだちの こうしんに しっぱい しました' },
    errorDeleteEmployee: { normal: '社員の削除に失敗しました', kids: 'おともだちの さくじょに しっぱい しました' },
    errorLoadLoans: { normal: '貸出情報の読み込みに失敗しました', kids: 'かしだしの じょうほうの よみこみに しっぱい しました' },
    errorBorrow: { normal: '貸出に失敗しました', kids: 'かしだしに しっぱい しました' },
    errorReturn: { normal: '返却に失敗しました', kids: 'へんきゃくに しっぱい しました' },
    errorLoadHistory: { normal: '履歴の読み込みに失敗しました', kids: 'りれきの よみこみに しっぱい しました' },
    errorNotFound: { normal: '見つかりませんでした', kids: 'みつかりませんでした' },
    errorValidation: { normal: '入力内容を確認してください', kids: 'にゅうりょく ないようを かくにん してください' },
    errorBarcode: { normal: 'バーコードの生成に失敗しました', kids: 'バーコードの せいせいに しっぱい しました' },
    successAddBook: { normal: '書籍を追加しました', kids: 'ほんを ついか しました' },
    successUpdateBook: { normal: '書籍を更新しました', kids: 'ほんを こうしん しました' },
    successDeleteBook: { normal: '書籍を削除しました', kids: 'ほんを さくじょ しました' },
    successAddEmployee: { normal: '社員を追加しました', kids: 'おともだちを ついか しました' },
    successUpdateEmployee: { normal: '社員を更新しました', kids: 'おともだちを こうしん しました' },
    successDeleteEmployee: { normal: '社員を削除しました', kids: 'おともだちを さくじょ しました' },
    successBorrow: { normal: '貸出しました', kids: 'かしだし しました' },
    successReturn: { normal: '返却しました', kids: 'へんきゃく しました' },
    successBarcode: { normal: 'バーコードを生成しました', kids: 'バーコードを せいせい しました' },
};

export const useAppText = () => {
    const { isKidsMode } = useMode();

    const getText = (key: TextKey) => {
        return resources[key][isKidsMode ? 'kids' : 'normal'];
    };

    return { getText, isKidsMode };
};
