/**
 * ButtonBlock - Block de bouton
 */
class ButtonBlock extends BaseBlock {
  static metadata = {
    type: 'button',
    label: 'Bouton',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="8" rx="2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>',
    category: 'content'
  };

  getDefaultConfig() {
    return {
      text: 'Cliquez ici',
      url: 'https://example.com',
      bgColor: '#0f172a',
      textColor: '#ffffff',
      width: 'auto',
      align: 'center',
      borderRadius: '8px',
      padding: '12px 24px',
      fontSize: 16,
      fontWeight: 'bold'
    };
  }

  getPropertiesSchema() {
    return [
      {
        name: 'text',
        label: 'Texte du bouton',
        type: 'text'
      },
      {
        name: 'url',
        label: 'URL',
        type: 'text',
        placeholder: 'https://...'
      },
      {
        name: 'bgColor',
        label: 'Couleur de fond',
        type: 'color'
      },
      {
        name: 'textColor',
        label: 'Couleur du texte',
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
        name: 'fontSize',
        label: 'Taille de police',
        type: 'number',
        min: 10,
        max: 24,
        unit: 'px'
      },
      {
        name: 'borderRadius',
        label: 'Coins arrondis',
        type: 'text',
        placeholder: '8px'
      },
      {
        name: 'padding',
        label: 'Espacement interne',
        type: 'text',
        placeholder: '12px 24px'
      }
    ];
  }

  renderEditor() {
    const { text, url, bgColor, textColor, align, borderRadius, padding, fontSize, fontWeight } = this.config;
    return `
      <div style="text-align: ${align}; padding: 16px;">
        <a href="${url}" style="display: inline-block; background-color: ${bgColor}; color: ${textColor}; padding: ${padding}; border-radius: ${borderRadius}; text-decoration: none; font-size: ${fontSize}px; font-weight: ${fontWeight}; font-family: Arial, sans-serif;">
          ${this.escapeHtml(text)}
        </a>
      </div>
    `;
  }

  renderEmail() {
    const { text, url, bgColor, textColor, align, borderRadius, padding, fontSize, fontWeight } = this.config;
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 16px; text-align: ${align};">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:auto;v-text-anchor:middle;width:auto;" arcsize="10%" stroke="f" fillcolor="${bgColor}">
              <w:anchorlock/>
              <center>
            <![endif]-->
            <a href="${url}" style="background-color: ${bgColor}; border-radius: ${borderRadius}; color: ${textColor}; display: inline-block; font-family: Arial, sans-serif; font-size: ${fontSize}px; font-weight: ${fontWeight}; line-height: 1.5; text-align: center; text-decoration: none; padding: ${padding}; -webkit-text-size-adjust: none; mso-hide: all;">
              ${this.escapeHtml(text)}
            </a>
            <!--[if mso]>
              </center>
            </v:roundrect>
            <![endif]-->
          </td>
        </tr>
      </table>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  validate() {
    const errors = [];
    if (!this.config.text || this.config.text.trim() === '') {
      errors.push('Le texte du bouton ne peut pas être vide');
    }
    if (!this.config.url || !this.config.url.startsWith('http')) {
      errors.push('L\'URL doit commencer par http:// ou https://');
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Auto-enregistrement
BlockRegistry.register('button', ButtonBlock);
