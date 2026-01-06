/**
 * ArticleBlock - Bloc Article (groupe Image + Titre + Description)
 * Peut être alimenté par un flux RSS plus tard
 */
class ArticleBlock extends BaseBlock {
  static metadata = {
    type: 'article',
    label: 'Article',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>',
    category: 'content'
  };

  getDefaultConfig() {
    return {
      // Structure de l'article
      image: {
        src: 'https://placehold.co/1200x600/dbeafe/1e40af.png?text=Article&font=roboto',
        alt: 'Image de l\'article',
        width: '100%',
        borderRadius: '8px'
      },
      title: {
        text: 'Titre de l\'article',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#0f172a',
        marginTop: '16px',
        marginBottom: '8px'
      },
      description: {
        text: 'Description de l\'article. Cliquez pour éditer ce texte et ajouter votre contenu.',
        fontSize: '16px',
        fontWeight: 'normal',
        color: '#64748b',
        lineHeight: '1.6'
      },
      // Lien de l'article
      link: {
        url: '#',
        target: '_blank'
      },
      // Style du container
      padding: '16px',
      backgroundColor: 'transparent',
      borderWidth: '0px',
      borderColor: '#e5e7eb',
      borderStyle: 'solid',
      borderRadius: '8px',
      // Métadonnées RSS (pour plus tard)
      rssField: null // 'item.0', 'item.1', etc.
    };
  }

  getPropertiesSchema() {
    return [
      // Image
      { name: 'image.src', label: 'URL de l\'image', type: 'text', placeholder: 'https://...' },
      { name: 'image.alt', label: 'Texte alternatif', type: 'text', placeholder: 'Description de l\'image' },
      { name: 'image.borderRadius', label: 'Coins arrondis image', type: 'text', placeholder: '8px' },
      
      // Titre
      { name: 'title.text', label: 'Titre', type: 'text', placeholder: 'Titre de l\'article' },
      { name: 'title.fontSize', label: 'Taille du titre', type: 'text', placeholder: '24px' },
      { name: 'title.color', label: 'Couleur du titre', type: 'color' },
      
      // Description
      { name: 'description.text', label: 'Description', type: 'textarea', rows: 3, placeholder: 'Description...' },
      { name: 'description.fontSize', label: 'Taille description', type: 'text', placeholder: '16px' },
      { name: 'description.color', label: 'Couleur description', type: 'color' },
      
      // Lien
      { name: 'link.url', label: 'Lien de l\'article', type: 'text', placeholder: 'https://...' },
      { name: 'link.target', label: 'Ouvrir dans', type: 'select', options: [
        { value: '_blank', label: 'Nouvel onglet' },
        { value: '_self', label: 'Même onglet' }
      ]},
      
      // Container
      { name: 'padding', label: 'Padding', type: 'text', placeholder: '16px' },
      { name: 'backgroundColor', label: 'Couleur de fond', type: 'color' },
      { name: 'borderRadius', label: 'Coins arrondis', type: 'text', placeholder: '8px' }
    ];
  }

  /**
   * Obtenir une valeur imbriquée (ex: 'image.src')
   */
  getNestedValue(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  /**
   * Définir une valeur imbriquée (ex: 'image.src')
   */
  setNestedValue(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, this.config);
    target[lastKey] = value;
  }

  /**
   * Surcharge pour gérer les propriétés imbriquées
   */
  updateConfig(newConfig) {
    for (const [key, value] of Object.entries(newConfig)) {
      if (key.includes('.')) {
        this.setNestedValue(key, value);
      } else {
        this.config[key] = value;
      }
    }
  }

  renderEditor(articleIndex) {
    const containerStyle = `
      padding: ${this.config.padding};
      background-color: ${this.config.backgroundColor};
      border: ${this.config.borderWidth} ${this.config.borderStyle} ${this.config.borderColor};
      border-radius: ${this.config.borderRadius};
    `;

    const indexLabel = articleIndex ? ` ${articleIndex}` : '';

    return `
      <div class="article-block" style="position: relative; ${containerStyle}">
        <!-- Badge Article -->
        <div style="position: absolute; top: 8px; right: 8px; background: #7c3aed; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          Article${indexLabel}
        </div>
        
        <!-- Image -->
        <div style="margin-bottom: 12px;">
          <img 
            src="${this.config.image.src}" 
            alt="${this.config.image.alt}"
            style="width: ${this.config.image.width}; border-radius: ${this.config.image.borderRadius}; display: block;"
            onerror="this.src='https://placehold.co/600x300?text=Image'"
          />
        </div>
        
        <!-- Titre -->
        <h3 style="
          font-size: ${this.config.title.fontSize};
          font-weight: ${this.config.title.fontWeight};
          color: ${this.config.title.color};
          margin: ${this.config.title.marginTop} 0 ${this.config.title.marginBottom} 0;
          line-height: 1.3;
        ">
          ${this.config.title.text}
        </h3>
        
        <!-- Description -->
        <p style="
          font-size: ${this.config.description.fontSize};
          font-weight: ${this.config.description.fontWeight};
          color: ${this.config.description.color};
          line-height: ${this.config.description.lineHeight};
          margin: 0;
        ">
          ${this.config.description.text}
        </p>
      </div>
    `;
  }

  renderEmail() {
    const containerStyle = `
      padding: ${this.config.padding};
      background-color: ${this.config.backgroundColor};
      border: ${this.config.borderWidth} ${this.config.borderStyle} ${this.config.borderColor};
      border-radius: ${this.config.borderRadius};
    `;

    const linkStart = this.config.link.url ? `<a href="${this.config.link.url}" target="${this.config.link.target}" style="text-decoration: none; color: inherit;">` : '';
    const linkEnd = this.config.link.url ? '</a>' : '';

    return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="${containerStyle}">
            ${linkStart}
            <!-- Image -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="padding-bottom: 12px;">
                  <img 
                    src="${this.config.image.src}" 
                    alt="${this.config.image.alt}"
                    width="100%"
                    style="width: 100%; max-width: 100%; border-radius: ${this.config.image.borderRadius}; display: block;"
                  />
                </td>
              </tr>
            </table>
            
            <!-- Titre -->
            <h3 style="
              font-size: ${this.config.title.fontSize};
              font-weight: ${this.config.title.fontWeight};
              color: ${this.config.title.color};
              margin: ${this.config.title.marginTop} 0 ${this.config.title.marginBottom} 0;
              line-height: 1.3;
            ">
              ${this.config.title.text}
            </h3>
            
            <!-- Description -->
            <p style="
              font-size: ${this.config.description.fontSize};
              font-weight: ${this.config.description.fontWeight};
              color: ${this.config.description.color};
              line-height: ${this.config.description.lineHeight};
              margin: 0;
            ">
              ${this.config.description.text}
            </p>
            ${linkEnd}
          </td>
        </tr>
      </table>
    `;
  }

  /**
   * Créer un ArticleBlock à partir de blocs existants
   */
  static createFromBlocks(blocks) {
    const config = {
      image: { src: 'https://placehold.co/1200x600/dbeafe/1e40af.png?text=Article&font=roboto', alt: 'Image de l\'article', width: '100%', borderRadius: '8px' },
      title: { text: 'Titre', fontSize: '24px', fontWeight: 'bold', color: '#0f172a', marginTop: '16px', marginBottom: '8px' },
      description: { text: 'Description', fontSize: '16px', fontWeight: 'normal', color: '#64748b', lineHeight: '1.6' },
      link: { url: '#', target: '_blank' },
      padding: '16px',
      backgroundColor: 'transparent',
      borderWidth: '0px',
      borderColor: '#e5e7eb',
      borderStyle: 'solid',
      borderRadius: '8px'
    };

    // Extraire les données des blocs sélectionnés (sauf l'image, on garde toujours l'image par défaut)
    blocks.forEach(block => {
      if (block.type === 'text') {
        // Le premier texte devient le titre, le second la description
        if (config.title.text === 'Titre') {
          config.title.text = block.config.text || config.title.text;
          config.title.fontSize = block.config.fontSize || config.title.fontSize;
          config.title.color = block.config.color || config.title.color;
        } else {
          config.description.text = block.config.text || config.description.text;
          config.description.fontSize = block.config.fontSize || config.description.fontSize;
          config.description.color = block.config.color || config.description.color;
        }
      } else if (block.type === 'button') {
        config.link.url = block.config.url || config.link.url;
      }
    });

    return new ArticleBlock(config);
  }
}

// Auto-enregistrement
BlockRegistry.register('article', ArticleBlock);
