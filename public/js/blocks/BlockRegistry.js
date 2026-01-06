/**
 * BlockRegistry - Registre central pour tous les types de blocks
 */
(function() {
  'use strict';
  
  console.log('🔄 Loading BlockRegistry...');
  
  class BlockRegistryClass {
    constructor() {
      this.blocks = new Map();
      console.log('✅ BlockRegistry instance created');
    }

    register(type, BlockClass) {
      if (this.blocks.has(type)) {
        console.warn(`Block type "${type}" is already registered`);
        return;
      }
      this.blocks.set(type, BlockClass);
      console.log(`✅ Block "${type}" registered`);
    }

    create(type, config = {}) {
      const BlockClass = this.blocks.get(type);
      if (!BlockClass) {
        throw new Error(`Block type "${type}" is not registered`);
      }
      return new BlockClass(config);
    }

    getAvailableTypes() {
      return Array.from(this.blocks.keys());
    }

    getMetadata(type) {
      const BlockClass = this.blocks.get(type);
      if (!BlockClass) {
        return null;
      }
      return BlockClass.metadata;
    }

    getBlocksByCategory() {
      const categories = {};
      
      for (const [type, BlockClass] of this.blocks) {
        const category = BlockClass.metadata.category || 'other';
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push({
          type,
          ...BlockClass.metadata
        });
      }
      
      return categories;
    }

    has(type) {
      return this.blocks.has(type);
    }
  }

  // Créer et exposer l'instance globale
  window.BlockRegistry = new BlockRegistryClass();
  
  console.log('✅ BlockRegistry ready:', typeof window.BlockRegistry.register);
})();
