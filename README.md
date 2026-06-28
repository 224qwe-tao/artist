# NovelAI 畫師串網站 v3

離線靜態網站，用於整理 NovelAI 畫師 tag、建立多畫師畫師串、隨機抽取 prompt。

## v3 更新

- 修正部分瀏覽器載入舊版快取導致「編輯」按鈕消失的問題：CSS / JS / data 檔改用 v3 檔名。
- 每張畫師方格右上方加入明顯的「編輯」按鈕。
- 方格底部加入「Danbooru」按鈕。
- 每個畫師自動加入 Danbooru Posts 搜尋 URL：`https://danbooru.donmai.us/posts?tags=<artist tag>`。
- 編輯視窗可加入 / 打開 Danbooru URL。
- 可為畫師加入 Pixiv、X、Fanbox、Patreon、Bluesky、Danbooru 等相關 URL。
- 可上傳畫師圖片 icon 或填入圖片 URL，方便在 n×n 方格中辨認。
- 編輯資料會保存於瀏覽器 localStorage。

## 使用方法

1. 解壓 ZIP。
2. 雙擊 `index.html`。
3. 在畫師卡片右上按「編輯」。
4. 在編輯視窗加入畫師 URL、圖片 icon、備註。
5. 按「儲存方格資料」。

## 注意

- 上傳圖片 icon 會儲存在瀏覽器 localStorage，建議使用小圖。
- 只整理 tag 和 URL；使用作品時請遵守相關平台規則。
