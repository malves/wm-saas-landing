/**
 * TextBlock - Block de texte
 */
class TextBlock extends BaseBlock {
  static metadata = {
    type: 'text',
    label: 'Texte',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/></svg>',
    category: 'content'
  };

  getDefaultConfig() {
    return {
      text: 'Votre texte ici...',
      fontSize: 16,
      color: '#000000',
      align: 'left',
      lineHeight: 1.5,
      fontWeight: 'normal',
      padding: '16px'
    };
  }

  getPropertiesSchema() {
    return [
      {
        name: 'text',
        label: 'Texte',
        type: 'textarea',
        rows: 4
      },
      {
        name: 'fontSize',
        label: 'Taille de police',
        type: 'number',
        min: 10,
        max: 48,
        unit: 'px'
      },
      {
        name: 'fontWeight',
        label: 'Graisse',
        type: 'select',
        options: [
          { value: 'normal', label: 'Normal' },
          { value: 'bold', label: 'Gras' },
          { value: '600', label: 'Semi-gras' }
        ]
      },
      {
        name: 'color',
        label: 'Couleur',
        type: 'color'
      },
      {
        name: 'align',
        label: 'Alignement',
        type: 'select',
        options: [
          { value: 'left', label: 'Gauche' },
          { value: 'center', label: 'Centre' },
          { value: 'right', label: 'Droite' }
        ]
      },
      {
        name: 'lineHeight',
        label: 'Hauteur de ligne',
        type: 'number',
        min: 1,
        max: 3,
        step: 0.1
      },
      {
        name: 'padding',
        label: 'Espacement',
        type: 'text',
        placeholder: '16px'
      }
    ];
  }

  renderEditor() {
    const { text, fontSize, color, align, lineHeight, fontWeight, padding } = this.config;
    return `
      <div style="padding: ${padding}; text-align: ${align}; font-size: ${fontSize}px; color: ${color}; line-height: ${lineHeight}; font-weight: ${fontWeight};" class="text-block">
        ${this.escapeHtml(text)}
      </div>
    `;
  }

  renderEmail() {
    const { text, fontSize, color, align, lineHeight, fontWeight, padding } = this.config;
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: ${padding}; text-align: ${align}; font-size: ${fontSize}px; color: ${color}; line-height: ${lineHeight}; font-weight: ${fontWeight}; font-family: Arial, sans-serif;">
            ${this.escapeHtml(text)}
          </td>
        </tr>
      </table>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
  }

  validate() {
    const errors = [];
    if (!this.config.text || this.config.text.trim() === '') {
      errors.push('Le texte ne peut pas être vide');
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Auto-enregistrement
BlockRegistry.register('text', TextBlock);
