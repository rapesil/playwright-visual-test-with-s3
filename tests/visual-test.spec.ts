import { test, expect } from '@playwright/test';
import { uploadFileToS3, downloadFileFromS3 } from './aws/aws-config';
import path from 'path';
import fs from 'fs';

const downloadImage = async (s3Key: string, localPath: string): Promise<boolean> => {
  try {
      console.log(`🟡 Tentando baixar imagem base do S3: ${s3Key}`);
      await downloadFileFromS3(s3Key, localPath);
      return true;
  } catch (error) {
      console.warn(`⚠️ Nenhuma imagem base encontrada no S3. Continuando o teste...`);
      return false;
  }
};

const uploadImage = async (shouldUpdateSnapshots: boolean, hasImageBase: boolean, localImagePath: string, s3ImageKey: string): Promise<void> => {
  if (shouldUpdateSnapshots || !hasImageBase) {
      console.log("🟡 Fazendo upload do novo snapshot...");
      await uploadFileToS3(localImagePath, s3ImageKey);
  } else {
      console.log("Nenhum upload será feito.");
  }
};

const removeLocalImage = async (localImagePath: string): Promise<void> => {
  try {
      if (fs.existsSync(localImagePath)) {
          fs.unlinkSync(localImagePath);
          console.log(`🟢 Imagem excluída: ${localImagePath}`);
      } else {
          console.warn(`⚠️ Arquivo não encontrado para exclusão: ${localImagePath}`);
      }
  } catch (error) {
      console.error(`❌ Erro ao excluir a imagem ${localImagePath}:`, error);
  }
};

test.describe('Playwright Visual Test', async () => {
  const viewports = [
    { width: 1280, height: 720 },
    { width: 1920, height: 1080 },
    { width: 360, height: 640 }
  ];
  for (const viewport of viewports) {
    test(`Visual test ${viewport.width}x${viewport.height}`, async ({ page, viewport }, testInfo) => {
      await page.setViewportSize(viewport);
      const screenshotName = `${testInfo.title}`.replace(/\s/g, '-');
      const localScreenshotPath = `tests/__screenshots__/${screenshotName}.png`;
      const s3ImageKey = `playwright-screenshots/${path.basename(localScreenshotPath)}`;

      const hasImageBase = await downloadImage(s3ImageKey, localScreenshotPath);

      await page.goto('https://playwright.dev/');
      await expect(page).toHaveTitle(/Playwright/);
      await expect(page).toHaveScreenshot(`${screenshotName}.png`, {
        maxDiffPixelRatio: 0.25,
      });

      const shouldUpdateSnapshots = testInfo.config.updateSnapshots === 'changed';
      await uploadImage(shouldUpdateSnapshots, hasImageBase, localScreenshotPath, s3ImageKey);

      removeLocalImage(localScreenshotPath);
    });
  }
});

