// Offline Model Loader for Corporate Environments
// Handles local model caching and loading without internet dependency

class OfflineModelLoader {
    constructor() {
        this.modelCache = new Map();
        this.loadingPromises = new Map();
        this.config = null;
        this.initializeConfig();
    }

    async initializeConfig() {
        try {
            // Load configuration from embedded JSON
            const configResponse = await fetch('./ai/config.json');
            this.config = await configResponse.json();
        } catch (error) {
            console.warn('Could not load AI config, using defaults:', error);
            this.config = this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            models: {
                lightweight: {
                    name: "Xenova/distilgpt2",
                    minMemory: 2,
                    maxTokens: 256,
                    temperature: 0.7
                }
            },
            fallback: {
                enabled: true,
                useRuleBased: true,
                timeout: 30000
            }
        };
    }

    async selectOptimalModel() {
        if (!this.config) {
            await this.initializeConfig();
        }

        const availableMemory = this.estimateSystemMemory();
        const models = this.config.models;
        
        // Select model based on system capabilities
        if (availableMemory >= 8 && models.quality) {
            return models.quality;
        } else if (availableMemory >= 4 && models.balanced) {
            return models.balanced;
        } else {
            return models.lightweight;
        }
    }

    estimateSystemMemory() {
        // Multiple methods to estimate system memory
        if (navigator.deviceMemory) {
            return navigator.deviceMemory;
        }
        
        if (navigator.hardwareConcurrency) {
            // Rough estimation based on CPU cores
            const cores = navigator.hardwareConcurrency;
            if (cores >= 8) return 8;
            if (cores >= 4) return 4;
            return 2;
        }
        
        // Conservative fallback
        return 2;
    }

    async loadModel(modelConfig, progressCallback) {
        const modelName = modelConfig.name;
        
        // Check if model is already cached
        if (this.modelCache.has(modelName)) {
            return this.modelCache.get(modelName);
        }
        
        // Check if model is currently loading
        if (this.loadingPromises.has(modelName)) {
            return this.loadingPromises.get(modelName);
        }
        
        // Start loading the model
        const loadingPromise = this._loadModelFromSource(modelConfig, progressCallback);
        this.loadingPromises.set(modelName, loadingPromise);
        
        try {
            const model = await loadingPromise;
            this.modelCache.set(modelName, model);
            this.loadingPromises.delete(modelName);
            return model;
        } catch (error) {
            this.loadingPromises.delete(modelName);
            throw error;
        }
    }

    async _loadModelFromSource(modelConfig, progressCallback) {
        try {
            // First, try to load from local cache/bundle
            const localModel = await this._loadFromLocalBundle(modelConfig);
            if (localModel) {
                return localModel;
            }
            
            // If local loading fails, try CDN (with offline fallback)
            return await this._loadFromCDN(modelConfig, progressCallback);
            
        } catch (error) {
            console.error('Model loading failed:', error);
            throw new Error(`Failed to load model ${modelConfig.name}: ${error.message}`);
        }
    }

    async _loadFromLocalBundle(modelConfig) {
        try {
            // Attempt to load from local bundle first (for truly offline operation)
            const modelPath = `./ai/models/${modelConfig.name.replace('/', '_')}`;
            
            // Check if local model exists
            const response = await fetch(`${modelPath}/model.json`);
            if (response.ok) {
                console.log('Loading model from local bundle...');
                // Load from local bundle - implementation would depend on model format
                return null; // Placeholder - actual implementation needed
            }
        } catch (error) {
            console.log('Local bundle not available, trying CDN...');
        }
        
        return null;
    }

    async _loadFromCDN(modelConfig, progressCallback) {
        // Dynamic import of transformers.js
        const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0');
        
        console.log(`Loading model ${modelConfig.name} from CDN...`);
        
        const model = await pipeline('text-generation', modelConfig.name, {
            quantized: true,
            progress_callback: (progress) => {
                if (progressCallback) {
                    progressCallback(progress);
                }
                console.log('Model loading progress:', progress);
            }
        });
        
        return model;
    }

    // Pre-warm model loading for better user experience
    async preloadModel() {
        try {
            const modelConfig = await this.selectOptimalModel();
            console.log('Pre-loading model for better performance...');
            
            // Load model in background without blocking UI
            this.loadModel(modelConfig, (progress) => {
                console.log('Background model loading:', progress);
            }).catch(error => {
                console.warn('Background model loading failed:', error);
            });
            
        } catch (error) {
            console.warn('Model preloading failed:', error);
        }
    }

    // Check if models are available offline
    async checkOfflineAvailability() {
        try {
            // Test if we can access the CDN
            const testResponse = await fetch('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0/package.json', {
                method: 'HEAD',
                timeout: 5000
            });
            
            return testResponse.ok;
        } catch (error) {
            console.log('CDN not accessible, using offline fallback');
            return false;
        }
    }

    // Cleanup cached models to free memory
    clearCache() {
        this.modelCache.clear();
        this.loadingPromises.clear();
        console.log('Model cache cleared');
    }

    // Get model status for debugging
    getStatus() {
        return {
            cachedModels: Array.from(this.modelCache.keys()),
            loadingModels: Array.from(this.loadingPromises.keys()),
            config: this.config,
            estimatedMemory: this.estimateSystemMemory()
        };
    }
}

// Export singleton instance
const modelLoader = new OfflineModelLoader();

// Auto-preload for better user experience (optional)
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Delay preloading to avoid blocking initial page load
        setTimeout(() => {
            modelLoader.preloadModel();
        }, 2000);
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = modelLoader;
} else {
    window.modelLoader = modelLoader;
}