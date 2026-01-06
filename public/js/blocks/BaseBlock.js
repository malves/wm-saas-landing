/**
 * BaseBlock - Classe abstraite de base pour tous les blocks
 */
class BaseBlock {
  // Métadonnées statiques (à override dans les classes enfants)
  static metadata = {
    type: 'base',
    label: 'Base Block',
    icon: '📦',
    category: 'basic'
  };

  constructor(config = {}) {
    this.id = config.id || `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.type = this.constructor.metadata.type;
    this.config = {
      ...this.getDefaultConfig(),
      ...config
    };
  }

  /**
   * Configuration par défaut (à override)
   */
  getDefaultConfig() {
    return {};
  }

  /**
   * Schéma des propriétés éditables (à override)
   * Format: [{ name, label, type, options }]
   */
  getPropertiesSchema() {
    return [];
  }

  /**
   * Rendu dans l'éditeur (à override)
   */
  renderEditor() {
    return `<div class="p-4 border-2 border-dashed border-gray-300 rounded">
      <p class="text-gray-500">Base Block (override renderEditor)</p>
    </div>`;
  }

  /**
   * Rendu pour l'email final (à override)
   */
  renderEmail() {
    return `<!-- Base Block (override renderEmail) -->`;
  }

  /**
   * Mettre à jour la configuration
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }

  /**
   * Obtenir la configuration complète
   */
  getConfig() {
    return {
      id: this.id,
      type: this.type,
      config: this.config
    };
  }

  /**
   * Cloner le block
   */
  clone() {
    const BlockClass = this.constructor;
    return new BlockClass({
      ...this.config,
      id: undefined // Nouveau ID généré automatiquement
    });
  }

  /**
   * Valider la configuration
   */
  validate() {
    return { valid: true, errors: [] };
  }

  /**
   * Sérialiser en JSON
   */
  toJSON() {
    return this.getConfig();
  }

  /**
   * Créer depuis JSON
   */
  static fromJSON(data) {
    return new this({
      id: data.id,
      ...data.config
    });
  }
}

// Export global
window.BaseBlock = BaseBlock;
