// cypress.config.ts - Atualização

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    
    env: {
      // Feature flags para testes
      NEXT_PUBLIC_PRODUCTION_SPECIFICATIONS: 'true',
      NEXT_PUBLIC_FREIGHT_FIELD: 'true',
      NEXT_PUBLIC_CONDITIONAL_FIELDS: 'true'
    }
  },
  
  component: {
    supportFile: false,
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  }
});
