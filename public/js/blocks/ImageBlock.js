/**
 * ImageBlock - Block d'image
 */
class ImageBlock extends BaseBlock {
  static metadata = {
    type: 'image',
    label: 'Image',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>',
    category: 'media'
  };

  getDefaultConfig() {
    return {
      src: 'https://placehold.co/600x400/e5e7eb/6b7280?text=Image',
      alt: 'Image',
      width: '100%',
      align: 'center',
      padding: '16px',
      link: ''
    };
  }

  getPropertiesSchema() {
    return [
      {
        name: 'src',
        label: 'URL de l\'image',
        type: 'text',
        placeholder: 'https://...'
      },
      {
        name: 'alt',
        label: 'Texte alternatif',
        type: 'text'
      },
      {
        name: 'width',
        label: 'Largeur',
        type: 'text',
        placeholder: '100% ou 600px'
      },
      {
        name: 'link',
        label: 'Lien (optionnel)',
        type: 'text',
        placeholder: 'https://...'
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
        name: 'padding',
        label: 'Espacement',
        type: 'text',
        placeholder: '16px'
      }
    ];
  }

  renderEditor() {
    const { src, alt, width, align, padding, link } = this.config;
    const imgTag = `<img src="${src}" alt="${alt}" style="max-width: 100%; width: ${width}; height: auto; display: block; margin: ${align === 'center' ? '0 auto' : align === 'right' ? '0 0 0 auto' : '0'};">`;
    const content = link ? `<a href="${link}">${imgTag}</a>` : imgTag;
    
    return `
      <div style="padding: ${padding};">
        ${content}
      </div>
    `;
  }

  renderEmail() {
    const { src, alt, width, align, padding, link } = this.config;
    const imgTag = `<img src="${src}" alt="${alt}" width="${width.replace('%', '')}" style="max-width: 100%; height: auto; display: block; border: 0;" border="0">`;
    const content = link ? `<a href="${link}" style="display: block;">${imgTag}</a>` : imgTag;
    
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: ${padding}; text-align: ${align};">
            ${content}
          </td>
        </tr>
      </table>
    `;
  }

  validate() {
    const errors = [];
    if (!this.config.src || !this.config.src.startsWith('http')) {
      errors.push('L\'URL de l\'image doit commencer par http:// ou https://');
    }
    if (this.config.link && !this.config.link.startsWith('http')) {
      errors.push('Le lien doit commencer par http:// ou https://');
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Auto-enregistrement
BlockRegistry.register('image', ImageBlock);
