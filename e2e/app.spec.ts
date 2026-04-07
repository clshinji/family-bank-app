import { test, expect } from '@playwright/test';

const API_URL = 'https://9j3x7yoini.execute-api.ap-northeast-1.amazonaws.com/prod';

test.describe('おこづかいちょうアプリ E2Eテスト', () => {

  test('親ダッシュボード: ページが表示される', async ({ page }) => {
    await page.goto('/parent');
    await expect(page.locator('h1')).toContainText('おこづかい かんり');
  });

  test('親ダッシュボード: 子ども一覧が表示される', async ({ page }) => {
    await page.goto('/parent');
    // たろう、はなこ が既に登録済み
    await expect(page.getByText('たろう').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('はなこ').first()).toBeVisible();
  });

  test('親ダッシュボード: 子ども追加フォームが開閉する', async ({ page }) => {
    await page.goto('/parent');
    await page.getByText('こどもを ついか').click();
    await expect(page.getByPlaceholder('なまえ')).toBeVisible();
    await page.getByText('やめる').click();
    await expect(page.getByPlaceholder('なまえ')).not.toBeVisible();
  });

  test('親操作ページ: たろうの操作画面が表示される', async ({ page }) => {
    // まずダッシュボードからたろうのカードをクリック
    await page.goto('/parent');
    await page.getByText('たろう').first().click();
    await expect(page.locator('h1')).toContainText('たろう');
    // 残高が表示される
    await expect(page.getByText(/\d+ えん/)).toBeVisible();
    // モードトグルが表示される
    await expect(page.getByRole('button', { name: 'あげる' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'つかう' }).first()).toBeVisible();
  });

  test('親操作ページ: NumPadで金額入力ができる', async ({ page }) => {
    await page.goto('/parent');
    await page.getByText('たろう').first().click();
    await page.waitForSelector('h1');

    // NumPadで100を入力
    await page.getByRole('button', { name: '1', exact: true }).click();
    await page.getByRole('button', { name: '0', exact: true }).click();
    await page.getByRole('button', { name: '0', exact: true }).click();
    await expect(page.getByText('100', { exact: true })).toBeVisible();

    // Cで消去
    await page.getByRole('button', { name: 'C', exact: true }).click();
    await expect(page.getByText('だれが？を えらんでね')).toBeVisible();
  });

  test('子どもページ: 残高が表示される', async ({ page }) => {
    // たろうのchildIdで直接アクセス
    const res = await fetch(`${API_URL}/children`);
    const data = await res.json();
    const taro = data.children.find((c: { name: string }) => c.name === 'たろう');

    await page.goto(`/kids/${taro.childId}`);
    await expect(page.getByText('たろうの おこづかい')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('いまの のこり')).toBeVisible();
    await expect(page.getByText('えん')).toBeVisible();
  });

  test('子どもページ: 履歴ページに遷移できる', async ({ page }) => {
    const res = await fetch(`${API_URL}/children`);
    const data = await res.json();
    const taro = data.children.find((c: { name: string }) => c.name === 'たろう');

    // 取引がない場合は作成
    const txnRes = await fetch(`${API_URL}/children/${taro.childId}/transactions`);
    const txnData = await txnRes.json();
    if (txnData.items.length === 0) {
      await fetch(`${API_URL}/children/${taro.childId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personName: 'おとうさん', amount: 100, type: 'income' }),
      });
    }

    await page.goto(`/kids/${taro.childId}`);
    await page.getByText('りれきを みる').click();
    await expect(page.getByText('おこづかい りれき')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('おとうさん').first()).toBeVisible();
  });

  test('子どもページ: 存在しないIDでエラー表示', async ({ page }) => {
    await page.goto('/kids/nonexistent-id');
    await expect(page.getByText('みつからなかったよ')).toBeVisible({ timeout: 10000 });
  });

  test('レスポンシブ: タッチターゲットが48px以上', async ({ page }) => {
    await page.goto('/parent');
    await page.waitForSelector('h1');
    await page.getByText('たろう').first().click();
    await page.waitForSelector('h1');

    // NumPadボタンのサイズチェック
    const numButton = page.getByRole('button', { name: '1', exact: true });
    const box = await numButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(48);
  });

  test('共有モーダル: QRコードとURLが表示される', async ({ page }) => {
    await page.goto('/parent');
    await page.getByText('たろう').first().waitFor();
    // 共有ボタンをクリック
    await page.getByText('QR / リンクを共有').first().click();
    // モーダルが表示される
    await expect(page.getByText('こども用ページ')).toBeVisible();
    // QRコードが表示される (SVG)
    await expect(page.locator('svg')).toBeVisible();
    // URLが入力欄に表示される
    const urlInput = page.locator('input[readonly]');
    await expect(urlInput).toBeVisible();
    const urlValue = await urlInput.inputValue();
    expect(urlValue).toContain('/kids/');
    // コピーボタンがある
    await expect(page.getByText('コピー')).toBeVisible();
    // 閉じる
    await page.getByText('✕').click();
    await expect(page.getByText('こども用ページ')).not.toBeVisible();
  });

  test('削除機能: 子どもを削除できる', async ({ page }) => {
    // テスト用にユニークな名前で子どもを作成
    const testName = `てすと${Date.now()}`;
    const res = await fetch(`${API_URL}/children`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: testName, avatarIndex: 3 }),
    });
    const created = await res.json();

    await page.goto('/parent');
    await expect(page.getByText(testName)).toBeVisible({ timeout: 10000 });

    // 該当カードの削除ボタンをクリック
    const card = page.locator(`a:has-text("${testName}")`).locator('..');
    await card.getByText('削除').click();

    // 確認モーダル Step 1
    await expect(page.getByText('を削除しますか？')).toBeVisible();
    await page.getByText('削除する').click();
    // 確認モーダル Step 2
    await expect(page.getByText('本当に削除しますか？')).toBeVisible();
    await page.getByText('はい、削除します').click();

    // 削除後、一覧のカードから消える
    await expect(page.locator(`a:has-text("${testName}")`)).not.toBeVisible({ timeout: 10000 });

    // APIでも削除されている
    const checkRes = await fetch(`${API_URL}/children/${created.childId}`);
    expect(checkRes.status).toBe(404);
  });

  test('親ダッシュボード: アバタータップで写真変更できる', async ({ page }) => {
    await page.goto('/parent');
    await page.getByText('たろう').first().waitFor();
    // アバタータップボタン(写真変更)が存在する
    const avatarButtons = page.locator('button[title="写真を変更"]');
    const count = await avatarButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('デザイン: Zen Maru Gothicフォントが適用されている', async ({ page }) => {
    await page.goto('/parent');
    await page.waitForSelector('h1');
    const fontFamily = await page.locator('h1').evaluate(el =>
      window.getComputedStyle(el).fontFamily
    );
    expect(fontFamily).toContain('Zen Maru Gothic');
  });
});
