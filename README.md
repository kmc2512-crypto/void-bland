# Photo Mentor AI (Lightroom-inspired)

Adobe Lightroomの思想を参考にした、**写真編集を学びながら上達できるAIアシスタント**のプロダクト設計です。  
目的は「編集した感」ではなく、**写真家としての感性を育てること**。

## 1. プロダクトコンセプト

- 写真初心者〜中上級者向けの、学習重視の添削体験
- SNS映えよりも、光・色・空気感・視線誘導・ストーリー性を重視
- 厳しすぎないが曖昧でもない、先輩フォトグラファー的フィードバック
- Lightroom風のプロツール感あるダークUI（完全コピーはしない）

---

## 2. 初回セットアップ（必須ヒアリング）

初回のみ、以下をウィザードで取得します。

### 使用機材
- カメラ機種
- レンズ
- 編集ソフト
- 普段撮るジャンル（複数選択）
  - ポートレート / スナップ / 風景 / ライブ / 夜景 / カフェ / フィルム風 / etc

### 編集の好み
- ナチュラル / シネマティック / フィルム風 / ダーク / ハイキー / エモい / 透明感 / 海外風 / Lightroom風 / etc

### 現在困っていること
- ノイズ感 / 色の濁り / 肌色 / 白飛び / 黒つぶれ / 編集しすぎ感 / 自分の色がない / etc

> 初回セットアップ完了後、プロフィールに保存し、以後のアドバイスに反映します。

---

## 3. 情報設計（IA）とタブ構成

タブナビゲーション（下部または左側）:

1. **Compare**  
   Before/After表示、スライダー比較、ヒストグラム
2. **Analyze**  
   Vision API解析、完成度%、方向性、品質評価
3. **Advice**  
   Lightroom調整提案、撮影時改善、参考写真レコメンド
4. **Calendar**  
   編集ログ、連続日数、月次成長分析
5. **Profile**  
   機材・作風・モード設定（Standard / Pro）

---

## 4. 主要ユースフロー

1. ユーザーが元画像（RAW/JPEG）と編集後画像（JPEG）をアップロード
2. Vision APIで画像解析、必要に応じてRAWメタデータを抽出
3. Before/After差分を特徴量比較
4. 「完成度％」「方向性」「良い点」「改善案」を生成
5. Standard / Pro モードに応じて出力粒度を変更
6. 結果を保存し、Calendarに自動記録
7. 累積データから成長傾向を定期更新

---

## 5. 評価出力フォーマット（UI表示仕様）

```md
## 編集完成度
87%

## 編集方向性
透明感重視の逆光フィルムライク編集

## 良い点
- ...

## 改善ポイント
- ...

## Lightroom調整提案
### 基本補正
- 露光量: +0.30
- コントラスト: -10
- ハイライト: -35
- シャドウ: +20

### トーンカーブ
- 黒レベルをわずかに持ち上げる

### HSL
- 黄色彩度: -8
- 青輝度: +12

### カラーグレーディング
- シャドウに青を少量追加
- 中間色は暖色寄りに微調整

### マスク
- 被写体のみ露光量 +0.20
- 空の明瞭度をやや下げる

## 撮影時アドバイス
- ...

## 参考写真
- URL + どこを参考にするか
```

---

## 6. Vision API 必須解析項目

### 画像理解
- 被写体認識
- 構図分析
- 視線誘導
- ボケ感

### 技術品質
- 明暗差
- 白飛び / 黒つぶれ
- 色かぶり
- 肌色の自然さ
- ノイズ量
- シャープネス
- 編集前後の変化量

### 総合品質
- 写真としての完成度
- 商用 / 作品用途としての品質

### RAWメタデータ（取得可能時）
- カメラ / レンズ / 焦点距離 / F値 / シャッタースピード / ISO / 撮影日時

---

## 7. モード設計

### Standard Mode
- 初心者〜中級者向け
- 前向きで学びやすいトーン
- 改善点は3〜5項目に絞る

### Pro Mode
- プロ・セミプロ向け
- 納品・作品提出を想定した厳密評価
- 追加評価軸:
  - 商用写真としての完成度
  - 色管理の安定性
  - 肌色破綻
  - トーン品位
  - ノイズ処理
  - プリント耐性
  - ポートフォリオ掲載可否
  - クライアント納品レベル

---

## 8. Calendar / 編集ログ仕様

評価完了時に1レコード自動追加:

- 評価日
- 編集完成度%
- 写真ジャンル
- カメラ
- レンズ
- 編集ソフト
- 評価コメント要約
- 改善ポイント
- サムネイル
- 連続編集日数（streak）

### Calendar UI
- 評価日を色付き表示
- セル内に完成度%表示
- サムネイルをミニ表示
- streak表示
- 月平均完成度
- 今月編集枚数
- 最も成長したポイント
- よく出る改善点

---

## 9. データ設計（PostgreSQL / Supabase / Firebase対応）

### 推奨: PostgreSQL（Supabase）

#### users
- id (pk)
- name
- created_at

#### user_profiles
- user_id (pk/fk)
- camera_model
- lenses (jsonb)
- editing_software
- genres (jsonb)
- style_preferences (jsonb)
- current_pains (jsonb)
- mode_default (`standard` / `pro`)

#### photo_sessions
- id (pk)
- user_id (fk)
- original_image_url
- edited_image_url
- original_raw_metadata (jsonb)
- created_at

#### analysis_results
- id (pk)
- session_id (fk)
- mode
- completion_percent
- direction_summary
- strengths (jsonb)
- improvements (jsonb)
- lightroom_suggestions (jsonb)
- shooting_advice (jsonb)
- pro_references (jsonb)
- quality_flags (jsonb)

#### calendar_logs
- id (pk)
- user_id (fk)
- session_id (fk)
- log_date
- completion_percent
- genre
- camera_model
- lens
- software
- summary
- key_improvement
- thumbnail_url
- streak

#### growth_insights
- id (pk)
- user_id (fk)
- period (`weekly` / `monthly`)
- avg_completion
- improved_points (jsonb)
- recurring_issues (jsonb)
- generated_at

---

## 10. API設計（例）

- `POST /api/onboarding`
- `POST /api/analyze`（Vision API呼び出し、RAWメタデータ抽出、推論）
- `GET /api/results/:sessionId`
- `GET /api/calendar?month=YYYY-MM`
- `GET /api/growth?period=monthly`
- `PATCH /api/profile`

---

## 11. UI/UXガイドライン

- ダークテーマ基調（ニュートラルグレー）
- 写真を主役にする余白設計
- パネル型レイアウト + 折りたたみ可能サイドバー
- 比較スライダーは60fps相当の滑らかな反応
- ヒストグラムはBefore/After切替と重ね表示対応
- 数値提案は「絶対値」ではなく「意図と理由」を併記

---

## 12. 実装メモ（推奨技術）

- Frontend: Next.js + TypeScript + Tailwind + Zustand
- Backend: Supabase Edge Functions or Node/Express
- Vision: OpenAI Vision API（必須）
- Storage: Supabase Storage / S3
- Queue: analysis jobs（重い解析の非同期化）
- 監査ログ: 解析失敗・再実行履歴を保持

---

## 13. 最終目標

このアプリは採点ツールではなく、

> 毎日編集する習慣を作り、自分の色と作風を育てる、プロ品質の写真編集コーチ

として機能することを目指します。
