# おこづかいちょう

幼稚園〜小学生の子どもと親が使える、かわいいおこづかい管理アプリです。

## できること

- 子どもの残高をかわいいページで確認
- おこづかいの付与・回収（使用）を記録
- 入出金の履歴を確認
- 複数の子どもを登録・管理

## URL

| ページ | URL | 用途 |
|---|---|---|
| 親ダッシュボード | `/parent` | 子どもの一覧・登録・管理 |
| 親操作ページ | `/parent/{childId}` | おこづかいの付与・回収 |
| 子ども用ページ | `/kids/{childId}` | 残高確認（子どもが見る） |
| 子ども用履歴 | `/kids/{childId}/history` | 入出金履歴（子どもが見る） |

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | React 18, Vite, TypeScript, CSS Modules, Framer Motion |
| バックエンド | AWS Lambda (Node.js 22), API Gateway (REST) |
| データベース | Amazon DynamoDB (Single-Table Design) |
| ホスティング | Amazon S3 + CloudFront |
| IaC | AWS CDK v2 (TypeScript) |
| テスト | Playwright (E2E) |

## プロジェクト構成

```
family-bank-app/
├── frontend/          # React SPA
│   ├── src/
│   │   ├── pages/     # KidHome, KidHistory, ParentDashboard, ParentOperate
│   │   ├── api/       # APIクライアント
│   │   └── types/     # 型定義
│   └── vite.config.ts
├── backend/           # Lambda関数
│   └── src/handlers/  # getChild, listChildren, createChild, updateChild,
│                      # getTransactions, postTransaction
├── infra/             # CDKスタック
│   ├── bin/app.ts
│   └── lib/
│       ├── backend-stack.ts   # DynamoDB + Lambda + API Gateway
│       └── frontend-stack.ts  # S3 + CloudFront
├── e2e/               # Playwright E2Eテスト
└── playwright.config.ts
```

## セットアップ

### 前提条件

- Node.js 22+
- AWS CLI (SSO設定済み、プロファイル `clshinji`)
- AWS CDK CLI

### インストール

```bash
npm install
```

### AWS認証

```bash
aws sso login --profile clshinji
```

### デプロイ

```bash
# バックエンドのみ
cd infra && npx cdk deploy FamilyBankBackend --profile clshinji

# フロントエンドビルド（API URLを指定）
cd frontend && VITE_API_URL="https://<api-id>.execute-api.ap-northeast-1.amazonaws.com/prod" npx vite build

# フロントエンドデプロイ
cd infra && npx cdk deploy FamilyBankFrontend --profile clshinji

# 全スタック一括デプロイ
cd infra && npx cdk deploy --all --profile clshinji
```

### デプロイ済みURLの確認

```bash
# フロントエンドURL（CloudFront）
aws cloudformation describe-stacks --stack-name FamilyBankFrontend --profile clshinji \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionUrl`].OutputValue' --output text

# API URL
aws cloudformation describe-stacks --stack-name FamilyBankBackend --profile clshinji \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text
```

### ローカル開発

```bash
cd frontend
VITE_API_URL="https://<api-id>.execute-api.ap-northeast-1.amazonaws.com/prod" npm run dev
```

### E2Eテスト

```bash
npx playwright install chromium
npx playwright test
```

## API

| Method | Path | 説明 |
|---|---|---|
| GET | `/children` | 子ども一覧 |
| POST | `/children` | 子ども登録 |
| GET | `/children/{childId}` | 子どものプロフィール+残高 |
| PUT | `/children/{childId}` | 子どものプロフィール更新 |
| GET | `/children/{childId}/transactions` | 取引履歴（新しい順、ページネーション対応） |
| POST | `/children/{childId}/transactions` | 取引作成（付与 or 回収） |

## DynamoDBテーブル設計

テーブル名: `FamilyBankTable`

| PK | SK | 用途 |
|---|---|---|
| `FAMILY` | `CHILD#<uuid>` | 子どものプロフィール・残高 |
| `CHILD#<uuid>` | `TXN#<timestamp>#<uuid>` | 取引レコード |

- 残高更新は `TransactWriteItems` で原子的に実行
- マイナス残高を許容（親の立て替え対応）
