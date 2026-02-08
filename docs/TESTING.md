# 測試說明

## 常見分類與本專案對應
- 單元測試（Unit）：有
  - 目的：驗證單一函式/模組邏輯正確。
  - 對應：`src/features/convert/converters.test.ts`、`src/features/convert/converters.format-csv.test.ts`、`src/features/redact/redaction.test.ts`。
- 整合測試（Integration）：有
  - 目的：驗證多個模組與元件之間的互動與狀態串接。
  - 對應：`src/App.integration.test.ts`。
- 端對端測試（E2E）：無
  - 目的：驗證接近真實使用者的完整流程（含瀏覽器環境與頁面操作）。
  - 對應：目前未導入（無 Playwright/Cypress 測試）。
- 邊界/異常測試（Boundary / Error）：有
  - 目的：驗證空輸入、無效格式、fallback、極端情境與保底行為。
  - 對應：主要在 `src/features/convert/*.test.ts` 與 `src/features/redact/*.test.ts`。
- 回歸測試（Regression）：有（透過既有測試套件持續覆蓋）
  - 目的：避免既有功能在修改後退化。
  - 對應：目前由單元/整合/邊界測試共同承擔。

## 補充
- 分類以「測試目的與範圍」為主，不以套件名稱分類。
- 目前測試執行工具為 Vitest，整合測試搭配 Vue Test Utils。
