# ビルドとパッケージング

## 概要

このドキュメントでは、図書管理システムのビルドとパッケージング手順を説明します。

## 前提条件

- Node.js 18以上
- npm 9以上
- 各プラットフォーム向けのビルド環境

### macOS向けビルド
- macOS 10.13以降
- Xcode Command Line Tools

### Windows向けビルド
- Windows 10以降
- Visual Studio Build Tools (C++開発ツール)

### Linux向けビルド
- Ubuntu 18.04以降 または 同等のディストリビューション

## ビルドスクリプト

### 開発環境での実行
```bash
npm run electron:dev
```

### プロダクションビルド

#### すべてのプラットフォーム向け（現在のOS用）
```bash
npm run electron:build
```

#### macOS向け
```bash
npm run electron:build:mac
```
- 生成物: `release/図書管理システム-{version}.dmg`
- 対応アーキテクチャ: x64, arm64 (Apple Silicon)

#### Windows向け
```bash
npm run electron:build:win
```
- 生成物: `release/図書管理システム Setup {version}.exe`
- 対応アーキテクチャ: x64
- インストーラー形式: NSIS

#### Linux向け
```bash
npm run electron:build:linux
```
- 生成物:
  - `release/図書管理システム-{version}.AppImage`
  - `release/library-management-system_{version}_amd64.deb`

#### パッケージングテスト（インストーラー作成なし）
```bash
npm run pack
```
ビルド設定を確認するために使用します。`release/`ディレクトリにパッケージ化されたアプリケーションが作成されますが、インストーラーは作成されません。

## アイコンファイル

アイコンファイルは `build/` ディレクトリに配置する必要があります：

- **macOS**: `build/icon.icns` (512x512px以上推奨)
- **Windows**: `build/icon.ico` (256x256px含む複数サイズ)
- **Linux**: `build/icon.png` (512x512px推奨)

### アイコン作成ツール

- [electron-icon-builder](https://www.npmjs.com/package/electron-icon-builder)
- [iConvert Icons](https://iconverticons.com/)
- [CloudConvert](https://cloudconvert.com/)

## ビルド設定

ビルド設定は `package.json` の `build` セクションで定義されています。

### 主要な設定項目

- **appId**: `com.company.library-management`
- **productName**: 図書管理システム
- **出力ディレクトリ**: `release/`
- **ビルドリソース**: `build/`

### 追加リソース

`resources/` ディレクトリ内のファイルは、アプリケーションパッケージの `resources/` ディレクトリにコピーされます。

## トラブルシューティング

### ビルドが失敗する場合

1. **依存関係の再インストール**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **キャッシュのクリア**
   ```bash
   rm -rf dist dist-electron release
   npm run build
   ```

3. **Node.jsのバージョン確認**
   ```bash
   node -v  # v18以上であることを確認
   ```

### macOSでの署名エラー

開発環境では、署名なしでビルドできます。本番環境では Apple Developer アカウントとコード署名証明書が必要です。

### Windowsでのビルドエラー

Windows Defenderがビルドプロセスをブロックすることがあります。一時的に除外設定を追加してください。

## デプロイ

ビルドされたインストーラーは `release/` ディレクトリに生成されます。

- **社内配布**: ファイルサーバーや共有フォルダーに配置
- **自動更新**: electron-updaterを使用した自動更新の実装（将来の拡張）

## 参考リンク

- [Electron Builder Documentation](https://www.electron.build/)
- [Electron Documentation](https://www.electronjs.org/docs/latest/)
