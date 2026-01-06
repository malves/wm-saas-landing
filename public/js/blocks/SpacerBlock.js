/**
 * SpacerBlock - Block d'espacement
 */
class SpacerBlock extends BaseBlock {
  static metadata = {
    type: 'spacer',
    label: 'Espacement',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>',
    category: 'layout'
  };

  getDefaultConfig() {
    return {
      height: 32
    };
  }

  getPropertiesSchema() {
    return [
      {
        name: 'height',
        label: 'Hauteur',
        type: 'number',
        min: 8,
        max: 200,
        unit: 'px'
      }
    ];
  }

  renderEditor() {
    const { height } = this.config;
    return `
      <div style="height: ${height}px; background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 10px,
        #e5e7eb 10px,
        #e5e7eb 11px
      ); position: relative;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; color: #6b7280;">
          ${height}px
        </div>
      </div>
    `;
  }

  renderEmail() {
    const { height } = this.config;
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="height: ${height}px; line-height: ${height}px; font-size: 1px;">&nbsp;</td>
        </tr>
      </table>
    `;
  }
}

// Auto-enregistrement
BlockRegistry.register('spacer', SpacerBlock);
