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
    await expect(page.getByText('たろう')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('はなこ')).toBeVisible();
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
    await expect(page.getByText('100')).toBeVisible();

    // Cで消去
    await page.getByRole('button', { name: 'C', exact: true }).click();
    await expect(page.getByText('+0')).toBeVisible();
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

    await page.goto(`/kids/${taro.childId}`);
    await page.getByText('りれきを みる').click();
    await expect(page.getByText('おこづかい りれき')).toBeVisible({ timeout: 10000 });
    // 取引履歴が表示される
    await expect(page.getByText('おとうさん')).toBeVisible();
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

  test('デザイン: Zen Maru Gothicフォントが適用されている', async ({ page }) => {
    await page.goto('/parent');
    await page.waitForSelector('h1');
    const fontFamily = await page.locator('h1').evaluate(el =>
      window.getComputedStyle(el).fontFamily
    );
    expect(fontFamily).toContain('Zen Maru Gothic');
  });
});
