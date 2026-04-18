# おこづかいちょう

幼稚園〜小学生の子どもと親が使える、かわいいおこづかい管理アプリです。

## できること

- 子どもの残高をかわいいページで確認
- おこづかいの付与・回収（使用）を記録
- 入出金の履歴を確認・編集
- 複数の子どもを登録・削除・管理
- アバター画像のアップロード（トリミング対応）
- 子ども用ページのQRコード共有

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
| ストレージ | Amazon S3 (アバター画像) |
| ホスティング | Amazon S3 + CloudFront |
| IaC | AWS CDK v2 (TypeScript) |
| テスト | Playwright (E2E) |

## プロジェクト構成

```
family-bank-app/
├── frontend/          # React SPA
│   ├── src/
│   │   ├── pages/       # KidHome, KidHistory, ParentDashboard, ParentOperate
│   │   ├── components/  # Avatar, ImageCropModal, ShareModal, PigMascot, Toast 等
│   │   ├── api/         # APIクライアント
│   │   └── types/       # 型定義
│   └── vite.config.ts
├── backend/           # Lambda関数
│   └── src/handlers/  # getChild, listChildren, createChild, updateChild,
│                      # deleteChild, getAvatarUploadUrl,
│                      # getTransactions, postTransaction, updateTransaction
├── infra/             # CDKスタック
│   ├── bin/app.ts
│   └── lib/
│       ├── backend-stack.ts   # DynamoDB + S3 (avatars) + Lambda + API Gateway
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
| DELETE | `/children/{childId}` | 子ども削除 |
| POST | `/children/{childId}/avatar` | アバター画像アップロード用の署名付きURL発行 |
| GET | `/children/{childId}/transactions` | 取引履歴（新しい順、ページネーション対応） |
| POST | `/children/{childId}/transactions` | 取引作成（付与 or 回収） |
| PUT | `/children/{childId}/transactions/{txnId}` | 取引の編集 |

## DynamoDBテーブル設計

テーブル名: `FamilyBankTable`

| PK | SK | 用途 |
|---|---|---|
| `FAMILY` | `CHILD#<uuid>` | 子どものプロフィール・残高 |
| `CHILD#<uuid>` | `TXN#<timestamp>#<uuid>` | 取引レコード |

- 残高更新は `TransactWriteItems` で原子的に実行
- マイナス残高を許容（親の立て替え対応）
- 取引編集時も差額を `TransactWriteItems` で残高に反映

## アバター画像の仕組み

- S3バケットに `avatars/` プレフィックスで保存（公開読み取り）
- クライアントはAPIから発行された署名付きURLでPUTアップロード
- アップロード前に `ImageCropModal` で正方形にトリミング

## AWSデプロイ時のコスト試算

家族 1 組（子ども 2〜3 人）で日常的に使う想定の、おおまかな月額目安です。リージョンは `ap-northeast-1`（東京）を前提としています。

### 想定している利用量

| 項目 | 想定値 |
|---|---|
| 取引の記録（あげる/つかう） | 約 5 件/日 = 約 150 件/月 |
| 残高・履歴ページの表示 | 約 20 回/日 = 約 600 回/月 |
| API リクエスト合計 | 約 1,000 回/月 |
| アバター画像アップロード | 月 1〜2 回、1 枚あたり 200KB 程度 |
| CloudFront からの配信量 | 月数十 MB 程度 |
| データ保存量 | DynamoDB < 1MB、S3 合計 < 50MB |

### 月額の目安（東京リージョン）

| サービス | 課金のポイント | 月額目安 |
|---|---|---|
| Lambda | 1,000 回 × 256MB × 平均 100ms | **$0.00**（常時無料枠 100 万リクエスト/月内） |
| API Gateway (REST) | 1,000 回のリクエスト | 約 **$0.004** |
| DynamoDB (On-Demand) | 書き込み 300 / 読み込み 1,000 | **$0.00〜$0.01**（ほぼ無料枠内） |
| S3（静的サイト + アバター） | ストレージ 50MB、GET 数百回 | **$0.00〜$0.01** |
| CloudFront | 配信 100MB、1 万リクエスト | **$0.00**（常時無料枠 1TB/月内） |
| CloudWatch Logs | Lambda のログ数 MB | **$0.00〜$0.05** |
| **合計（目安）** | | **月 $0〜$0.1（約 0〜15 円）** |

※ 新規 AWS アカウントは 12 か月間の「初年度無料枠」も適用されるため、実質無料で運用できるケースがほとんどです。

### 高負荷シナリオでも月 1 ドル未満

月 10,000 件の取引・1GB の配信・ストレージ 100MB といった重めの利用でも、合計は概ね **月 $1 未満** に収まります。Lambda・DynamoDB・CloudFront はいずれも「小規模家庭用途では個別課金に到達しにくい」設計です。

### 課金が増える主な要因

- **CloudWatch Logs の保持期間**: デフォルト（無期限）のままだと長期間で少しずつ増えます。必要に応じて Retention を 1〜3 か月に設定。
- **独自ドメイン**: Route 53 の Hosted Zone は **$0.50/月** 別途発生します。
- **アバター画像の過度な蓄積**: 不要になった画像は S3 のライフサイクルルールで整理すると確実。
- **不要になったスタックの放置**: API Gateway など従量課金のサービスは呼び出しが無ければ 0 円ですが、使い終わったら後述の `cdk destroy` で片付けるのが安心です。

> 正確な料金は必ず [AWS Pricing Calculator](https://calculator.aws/) と公式の料金ページで確認してください。

## はじめてのAWSデプロイガイド

「AWS を使ったことがない」状態から、このアプリを自分の AWS アカウントにデプロイするまでの手順です。

### 1. AWS アカウントを作る

1. [AWS サインアップページ](https://portal.aws.amazon.com/billing/signup) からアカウントを作成（メールアドレスとクレジットカードが必要）
2. ルートユーザーに **MFA（多要素認証）を必ず有効化**
3. [AWS Budgets](https://console.aws.amazon.com/billing/home#/budgets) で請求アラートを設定（月 $5 など低めの閾値を設定すると安心）

### 2. IAM Identity Center（旧 AWS SSO）で管理ユーザーを作る

ルートユーザーは日常作業では使わないのが AWS のベストプラクティスです。

1. AWS コンソールで `IAM Identity Center` を有効化
2. ユーザーを作成し、`AdministratorAccess` 権限セットを付与
3. 発行された **アクセスポータル URL** と **SSO リージョン** を控える
4. 以降はこのユーザーで作業

### 3. AWS CLI + SSO プロファイルを設定する

```bash
# AWS CLI インストール（macOS の場合）
brew install awscli

# SSO プロファイルを設定（対話式）
aws configure sso --profile clshinji
# - SSO start URL: 上で控えた URL
# - SSO region: ap-northeast-1（または自分の SSO リージョン）
# - アカウント・ロールを選択
# - CLI default region: ap-northeast-1
# - Output format: json

# 認証確認
aws sts get-caller-identity --profile clshinji
```

> プロファイル名を `clshinji` 以外にする場合、本 README のコマンド例や `infra/` のデプロイスクリプトで指定しているプロファイル名も揃えてください。

### 4. Node.js と CDK の準備

```bash
# Node.js 22 をインストール（nvm の例）
nvm install 22 && nvm use 22

# 依存関係をインストール
npm install

# CDK ブートストラップ（初回のみ・リージョンごとに 1 回必要）
cd infra && npx cdk bootstrap --profile clshinji
```

### 5. デプロイする

本 README の [デプロイ](#デプロイ) セクションのコマンドを順に実行します。

### 6. 使い終わったら片付ける（任意）

```bash
cd infra && npx cdk destroy --all --profile clshinji
```

`FamilyBankTable`（DynamoDB）と `AvatarBucket`（S3）は `RemovalPolicy.RETAIN` に設定されているため、完全に削除したい場合は AWS コンソールから手動で削除してください。

## 参考リンク

### AWS をはじめる

- [AWS アカウント作成](https://portal.aws.amazon.com/billing/signup)
- [AWS 無料枠](https://aws.amazon.com/jp/free/)
- [AWS Pricing Calculator（料金見積もり）](https://calculator.aws/)
- [IAM Identity Center ユーザーガイド](https://docs.aws.amazon.com/ja_jp/singlesignon/latest/userguide/getting-started.html)
- [AWS CLI のインストールと SSO 設定](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/cli-configure-sso.html)

### AWS CDK

- [AWS CDK 開発者ガイド](https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/home.html)
- [CDK ブートストラップの説明](https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/bootstrapping.html)

### 利用サービスの料金ページ

- [AWS Lambda 料金](https://aws.amazon.com/jp/lambda/pricing/)
- [Amazon API Gateway 料金](https://aws.amazon.com/jp/api-gateway/pricing/)
- [Amazon DynamoDB 料金](https://aws.amazon.com/jp/dynamodb/pricing/on-demand/)
- [Amazon S3 料金](https://aws.amazon.com/jp/s3/pricing/)
- [Amazon CloudFront 料金](https://aws.amazon.com/jp/cloudfront/pricing/)
