/**
 * HTMLBlock - Bloc HTML personnalisé pour utilisateurs avancés
 */
class HTMLBlock extends BaseBlock {
  static metadata = {
    type: 'html',
    label: 'HTML personnalisé',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>',
    category: 'advanced'
  };

  getDefaultConfig() {
    return {
      html: '<p style="padding: 20px; text-align: center; color: #374151;">Entrez votre code HTML ici...</p>',
      showWarning: true,
      padding: '0px',
      backgroundColor: 'transparent'
    };
  }

  getPropertiesSchema() {
    return [
      { 
        name: 'html', 
        label: 'Code HTML', 
        type: 'textarea', 
        rows: 12,
        placeholder: '<p>Votre HTML...</p>'
      },
      { 
        name: 'padding', 
        label: 'Padding du conteneur', 
        type: 'text', 
        placeholder: '0px' 
      },
      { 
        name: 'backgroundColor', 
        label: 'Couleur de fond', 
        type: 'color' 
      }
    ];
  }

  /**
   * Valider et nettoyer le HTML (basique)
   */
  sanitizeHTML(html) {
    // Liste noire de balises dangereuses
    const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'];
    let sanitized = html;

    dangerousTags.forEach(tag => {
      const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gi');
      sanitized = sanitized.replace(regex, '');
      // Balises auto-fermantes
      const selfClosingRegex = new RegExp(`<${tag}[^>]*/>`, 'gi');
      sanitized = sanitized.replace(selfClosingRegex, '');
    });

    // Supprimer les attributs dangereux
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, ''); // onclick, onload, etc.
    sanitized = sanitized.replace(/javascript:/gi, '');

    return sanitized;
  }

  /**
   * Vérifier si le HTML contient des éléments non email-safe
   */
  getWarnings(html) {
    const warnings = [];
    
    // Vérifier les éléments non supportés
    if (html.match(/<(video|audio|canvas|svg)/i)) {
      warnings.push('⚠️ Les balises <video>, <audio>, <canvas>, <svg> ne sont pas supportées par tous les clients email');
    }
    
    if (html.match(/display:\s*flex|display:\s*grid/i)) {
      warnings.push('⚠️ Flexbox et Grid ne sont pas supportés par tous les clients email. Privilégiez les tables');
    }
    
    if (html.match(/<style/i)) {
      warnings.push('⚠️ Les balises <style> sont souvent ignorées. Privilégiez le CSS inline');
    }
    
    if (html.match(/position:\s*(absolute|fixed)/i)) {
      warnings.push('⚠️ Position absolute/fixed n\'est pas supportée par tous les clients email');
    }

    return warnings;
  }

  renderEditor() {
    const sanitized = this.sanitizeHTML(this.config.html);
    const warnings = this.getWarnings(sanitized);

    const containerStyle = `
      padding: ${this.config.padding};
      background-color: ${this.config.backgroundColor};
      border: 1px dashed #e5e7eb;
      border-radius: 8px;
      position: relative;
    `;

    let warningsHTML = '';
    if (warnings.length > 0 && this.config.showWarning) {
      warningsHTML = `
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 12px; margin-bottom: 12px; font-size: 12px;">
          <div style="font-weight: 600; margin-bottom: 6px; color: #92400e;">⚠️ Avertissements :</div>
          ${warnings.map(w => `<div style="color: #92400e; margin-left: 8px;">${w}</div>`).join('')}
        </div>
      `;
    }

    return `
      <div style="${containerStyle}">
        <div style="position: absolute; top: 8px; right: 8px; background: #f3f4f6; color: #6b7280; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
          HTML
        </div>
        ${warningsHTML}
        <div style="min-height: 40px;">
          ${sanitized}
        </div>
      </div>
    `;
  }

  renderEmail() {
    const sanitized = this.sanitizeHTML(this.config.html);
    
    return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: ${this.config.padding}; background-color: ${this.config.backgroundColor};">
            ${sanitized}
          </td>
        </tr>
      </table>
    `;
  }
}

// Auto-enregistrement
BlockRegistry.register('html', HTMLBlock);
