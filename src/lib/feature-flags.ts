interface FeatureFlags {
  PRODUCTION_SPECIFICATIONS: boolean;
  ENHANCED_VALIDATION: boolean;
  SPECIFICATION_ANALYTICS: boolean;
  CONDITIONAL_FIELDS: boolean;
  FREIGHT_FIELD: boolean;
}

class FeatureFlagManager {
  private flags: FeatureFlags;
  private readonly STORAGE_PREFIX = 'ff_';

  constructor() {
    this.flags = {
      PRODUCTION_SPECIFICATIONS: this.getFlag('PRODUCTION_SPECIFICATIONS', this.getEnvDefault('PRODUCTION_SPECIFICATIONS', true)),
      ENHANCED_VALIDATION: this.getFlag('ENHANCED_VALIDATION', this.getEnvDefault('ENHANCED_VALIDATION', true)),
      SPECIFICATION_ANALYTICS: this.getFlag('SPECIFICATION_ANALYTICS', this.getEnvDefault('SPECIFICATION_ANALYTICS', true)),
      CONDITIONAL_FIELDS: this.getFlag('CONDITIONAL_FIELDS', this.getEnvDefault('CONDITIONAL_FIELDS', true)),
      FREIGHT_FIELD: this.getFlag('FREIGHT_FIELD', this.getEnvDefault('FREIGHT_FIELD', true)),
    };
  }

  private getEnvDefault(key: keyof FeatureFlags, defaultValue: boolean): boolean {
    // Check NEXT_PUBLIC_ environment variables (available on both server and client)
    const envValue = process.env[`NEXT_PUBLIC_${key}`];
    return envValue !== undefined ? envValue === 'true' : defaultValue;
  }

  private getFlag(key: keyof FeatureFlags, defaultValue: boolean): boolean {
    if (typeof window === 'undefined') {
      return defaultValue;
    }

    // Check localStorage for runtime overrides
    const localValue = localStorage.getItem(`${this.STORAGE_PREFIX}${key}`);
    if (localValue !== null) {
      return localValue === 'true';
    }

    return defaultValue;
  }

  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag] || false;
  }

  enable(flag: keyof FeatureFlags): void {
    this.flags[flag] = true;
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${this.STORAGE_PREFIX}${flag}`, 'true');
      this.notifyFlagChange(flag, true);
    }
  }

  disable(flag: keyof FeatureFlags): void {
    this.flags[flag] = false;
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${this.STORAGE_PREFIX}${flag}`, 'false');
      this.notifyFlagChange(flag, false);
    }
  }

  toggle(flag: keyof FeatureFlags): void {
    const currentValue = this.isEnabled(flag);
    if (currentValue) {
      this.disable(flag);
    } else {
      this.enable(flag);
    }
  }

  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  setFlags(flags: Partial<FeatureFlags>): void {
    Object.entries(flags).forEach(([key, value]) => {
      if (value === true) {
        this.enable(key as keyof FeatureFlags);
      } else if (value === false) {
        this.disable(key as keyof FeatureFlags);
      }
    });
  }

  reset(flag: keyof FeatureFlags): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${this.STORAGE_PREFIX}${flag}`);
    }
    // Reset to environment default
    this.flags[flag] = this.getEnvDefault(flag, false);
  }

  resetAll(): void {
    Object.keys(this.flags).forEach((key) => {
      this.reset(key as keyof FeatureFlags);
    });
  }

  // Development helper for debugging
  getDebugInfo(): { flags: FeatureFlags; environment: Record<string, string | undefined> } {
    const environment: Record<string, string | undefined> = {};

    if (typeof window === 'undefined') {
      Object.keys(this.flags).forEach((key) => {
        environment[`NEXT_PUBLIC_${key}`] = process.env[`NEXT_PUBLIC_${key}`];
      });
    }

    return {
      flags: this.getAllFlags(),
      environment,
    };
  }

  private notifyFlagChange(flag: keyof FeatureFlags, enabled: boolean): void {
    // Dispatch custom event for components that need to react to flag changes
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('featureFlagChanged', {
        detail: { flag, enabled }
      }));
    }
  }

  // Utility methods for specific feature combinations
  areProductionFeaturesEnabled(): boolean {
    return this.isEnabled('PRODUCTION_SPECIFICATIONS') &&
           this.isEnabled('ENHANCED_VALIDATION');
  }

  areAnalyticsEnabled(): boolean {
    return this.isEnabled('SPECIFICATION_ANALYTICS');
  }

  isConditionalLogicEnabled(): boolean {
    return this.isEnabled('CONDITIONAL_FIELDS');
  }
}

// Export singleton instance
export const featureFlags = new FeatureFlagManager();

// Export types for use in components
export type { FeatureFlags };

// Development utilities (only available in development mode)
export const developmentUtils = {
  // Enable all features (for development/testing)
  enableAll: () => {
    if (process.env.NODE_ENV === 'development') {
      Object.keys(featureFlags.getAllFlags()).forEach((key) => {
        featureFlags.enable(key as keyof FeatureFlags);
      });
      console.log('🚀 All feature flags enabled for development');
    }
  },

  // Disable all features
  disableAll: () => {
    if (process.env.NODE_ENV === 'development') {
      Object.keys(featureFlags.getAllFlags()).forEach((key) => {
        featureFlags.disable(key as keyof FeatureFlags);
      });
      console.log('⏹️ All feature flags disabled');
    }
  },

  // Get current state as JSON for debugging
  exportState: () => {
    if (process.env.NODE_ENV === 'development') {
      const state = featureFlags.getDebugInfo();
      console.log('📊 Feature Flags State:', JSON.stringify(state, null, 2));
      return state;
    }
  },

  // Import state from JSON (for testing)
  importState: (state: Partial<FeatureFlags>) => {
    if (process.env.NODE_ENV === 'development') {
      featureFlags.setFlags(state);
      console.log('📥 Feature flags imported:', state);
    }
  },

  // Enable specific preset configurations
  enablePreset: (preset: 'production' | 'development' | 'testing') => {
    if (process.env.NODE_ENV === 'development') {
      switch (preset) {
        case 'production':
          featureFlags.setFlags({
            PRODUCTION_SPECIFICATIONS: true,
            ENHANCED_VALIDATION: true,
            SPECIFICATION_ANALYTICS: true,
            CONDITIONAL_FIELDS: true,
            FREIGHT_FIELD: true,
          });
          break;
        case 'development':
          featureFlags.setFlags({
            PRODUCTION_SPECIFICATIONS: true,
            ENHANCED_VALIDATION: true,
            SPECIFICATION_ANALYTICS: false,
            CONDITIONAL_FIELDS: true,
            FREIGHT_FIELD: true,
          });
          break;
        case 'testing':
          featureFlags.setFlags({
            PRODUCTION_SPECIFICATIONS: true,
            ENHANCED_VALIDATION: false,
            SPECIFICATION_ANALYTICS: false,
            CONDITIONAL_FIELDS: false,
            FREIGHT_FIELD: false,
          });
          break;
      }
      console.log(`🎛️ Applied preset: ${preset}`);
    }
  },
};

// Make development utilities available in console for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const debugWindow = window as typeof window & { featureFlags?: FeatureFlagDebugApi };
  debugWindow.featureFlags = {
    manager: featureFlags,
    devUtils: developmentUtils,
  };
}

type FeatureFlagDebugApi = {
  manager: FeatureFlagManager;
  devUtils: typeof developmentUtils;
};

declare global {
  interface Window {
    featureFlags?: FeatureFlagDebugApi;
  }
}
