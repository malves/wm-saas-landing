/**
 * DividerBlock - Block de séparateur
 */
class DividerBlock extends BaseBlock {
  static metadata = {
    type: 'divider',
    label: 'Séparateur',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/></svg>',
    category: 'layout'
  };

  getDefaultConfig() {
    return {
      color: '#e5e7eb',
      height: 1,
      width: '100%',
      style: 'solid',
      padding: '16px 0'
    };
  }

  getPropertiesSchema() {
    return [
      {
        name: 'color',
        label: 'Couleur',
        type: 'color'
      },
      {
        name: 'height',
        label: 'Épaisseur',
        type: 'number',
        min: 1,
        max: 10,
        unit: 'px'
      },
      {
        name: 'width',
        label: 'Largeur',
        type: 'text',
        placeholder: '100%'
      },
      {
        name: 'style',
        label: 'Style',
        type: 'select',
        options: [
          { value: 'solid', label: 'Plein' },
          { value: 'dashed', label: 'Tirets' },
          { value: 'dotted', label: 'Points' }
        ]
      },
      {
        name: 'padding',
        label: 'Espacement',
        type: 'text',
        placeholder: '16px 0'
      }
    ];
  }

  renderEditor() {
    const { color, height, width, style, padding } = this.config;
    return `
      <div style="padding: ${padding};">
        <hr style="border: none; border-top: ${height}px ${style} ${color}; width: ${width}; margin: 0;">
      </div>
    `;
  }

  renderEmail() {
    const { color, height, width, style, padding } = this.config;
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: ${padding};">
            <table role="presentation" align="center" width="${width.replace('%', '')}" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="border-top: ${height}px ${style} ${color}; line-height: 1px; font-size: 1px;">&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }
}

// Auto-enregistrement
BlockRegistry.register('divider', DividerBlock);
