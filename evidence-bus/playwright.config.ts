import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./test',testMatch:'ui.spec.ts',workers:1,timeout:30000,reporter:'list',use:{browserName:'chromium',headless:true,viewport:{width:1365,height:1000},trace:'retain-on-failure'}});
