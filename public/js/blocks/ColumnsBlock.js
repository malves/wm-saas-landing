/**
 * ColumnsBlock - Block de colonnes (container)
 */
class ColumnsBlock extends BaseBlock {
  static metadata = {
    type: 'columns',
    label: '2 Colonnes',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 4H5a2 2 0 00-2 2v12a2 2 0 002 2h4m0-16v16m0-16h10a2 2 0 012 2v12a2 2 0 01-2 2H9"/></svg>',
    category: 'layout'
  };

  getDefaultConfig() {
    return {
      columnCount: 2,
      gap: '16px',
      padding: '16px',
      backgroundColor: 'transparent',
      borderWidth: '0px',
      borderColor: '#e5e7eb',
      borderStyle: 'solid',
      borderRadius: '0px',
      columns: [
        { 
          blocks: [],
          verticalAlign: 'top',
          horizontalAlign: 'left',
          padding: '16px',
          backgroundColor: 'transparent',
          borderWidth: '0px',
          borderColor: '#e5e7eb',
          borderStyle: 'solid',
          borderRadius: '0px'
        },
        { 
          blocks: [],
          verticalAlign: 'top',
          horizontalAlign: 'left',
          padding: '16px',
          backgroundColor: 'transparent',
          borderWidth: '0px',
          borderColor: '#e5e7eb',
          borderStyle: 'solid',
          borderRadius: '0px'
        }
      ]
    };
  }

  getPropertiesSchema() {
    return [
      {
        name: 'gap',
        label: 'Espacement entre colonnes',
        type: 'text',
        placeholder: '16px'
      },
      {
        name: 'padding',
        label: 'Espacement intérieur du container',
        type: 'text',
        placeholder: '16px'
      },
      {
        name: 'backgroundColor',
        label: 'Couleur de fond du container',
        type: 'color'
      },
      {
        name: 'borderWidth',
        label: 'Épaisseur de bordure',
        type: 'text',
        placeholder: '0px'
      },
      {
        name: 'borderColor',
        label: 'Couleur de bordure',
        type: 'color'
      },
      {
        name: 'borderStyle',
        label: 'Style de bordure',
        type: 'select',
        options: [
          { value: 'solid', label: 'Plein' },
          { value: 'dashed', label: 'Tirets' },
          { value: 'dotted', label: 'Points' },
          { value: 'none', label: 'Aucune' }
        ]
      },
      {
        name: 'borderRadius',
        label: 'Coins arrondis',
        type: 'text',
        placeholder: '0px'
      }
    ];
  }

  /**
   * Schéma des propriétés d'une colonne
   */
  getColumnPropertiesSchema() {
    return [
      {
        name: 'verticalAlign',
        label: 'Alignement vertical',
        type: 'select',
        options: [
          { value: 'top', label: 'Haut' },
          { value: 'middle', label: 'Milieu' },
          { value: 'bottom', label: 'Bas' }
        ]
      },
      {
        name: 'horizontalAlign',
        label: 'Alignement horizontal',
        type: 'select',
        options: [
          { value: 'left', label: 'Gauche' },
          { value: 'center', label: 'Centre' },
          { value: 'right', label: 'Droite' }
        ]
      },
      {
        name: 'padding',
        label: 'Espacement intérieur',
        type: 'text',
        placeholder: '16px'
      },
      {
        name: 'backgroundColor',
        label: 'Couleur de fond',
        type: 'color'
      },
      {
        name: 'borderWidth',
        label: 'Épaisseur de bordure',
        type: 'text',
        placeholder: '0px'
      },
      {
        name: 'borderColor',
        label: 'Couleur de bordure',
        type: 'color'
      },
      {
        name: 'borderStyle',
        label: 'Style de bordure',
        type: 'select',
        options: [
          { value: 'solid', label: 'Plein' },
          { value: 'dashed', label: 'Tirets' },
          { value: 'dotted', label: 'Points' },
          { value: 'none', label: 'Aucune' }
        ]
      },
      {
        name: 'borderRadius',
        label: 'Coins arrondis',
        type: 'text',
        placeholder: '0px'
      }
    ];
  }

  renderEditor() {
    const { gap, columns, padding, backgroundColor, borderWidth, borderColor, borderStyle, borderRadius } = this.config;
    const selection = window.emailBuilder ? window.emailBuilder.selection : null;
    
    const containerStyle = `
      display: flex;
      gap: ${gap};
      padding: ${padding};
      background-color: ${backgroundColor};
      border: ${borderWidth} ${borderStyle} ${borderColor};
      border-radius: ${borderRadius};
    `;
    
    let html = `
      <div class="columns-container" style="${containerStyle}" onclick="event.stopPropagation(); emailBuilder.selectContainer('${this.id}')">
    `;
    
    columns.forEach((column, index) => {
      const isColumnSelected = selection && selection.type === 'column' && 
                                selection.blockId === this.id && 
                                selection.columnIndex === index;
      
      const colStyle = `
        flex: 1;
        min-height: 100px;
        padding: ${column.padding};
        background-color: ${column.backgroundColor};
        border: ${column.borderWidth} ${column.borderStyle} ${column.borderColor};
        border-radius: ${column.borderRadius};
        text-align: ${column.horizontalAlign};
      `;
      
      html += `
        <div 
          class="column-drop-zone ${isColumnSelected ? 'selected' : ''}" 
          data-column-index="${index}"
          data-parent-block-id="${this.id}"
          onclick="event.stopPropagation(); emailBuilder.selectColumn('${this.id}', ${index})"
          style="${colStyle}">
      `;
      
      if (column.blocks && column.blocks.length > 0) {
        column.blocks.forEach(block => {
          const isBlockSelected = selection && selection.type === 'nested-block' && 
                                   selection.blockId === this.id && 
                                   selection.columnIndex === index && 
                                   selection.nestedBlockId === block.id;
          
          // Vérifier si le bloc est dans la multi-sélection imbriquée
          const isNestedMultiSelected = typeof emailBuilder !== 'undefined' && 
            emailBuilder.nestedMultiSelection && 
            emailBuilder.nestedMultiSelection.some(s => 
              s.parentBlockId === this.id && s.columnIndex === index && s.nestedBlockId === block.id
            );
          
          // Récupérer l'index de l'article s'il existe
          const articleIndex = block._articleIndex || null;
          
          html += `
            <div 
              class="nested-block ${isBlockSelected ? 'selected' : ''} ${isNestedMultiSelected ? 'multi-selected' : ''}" 
              data-block-id="${block.id}"
              data-parent-block-id="${this.id}"
              data-column-index="${index}"
              draggable="true"
              ondragstart="emailBuilder.handleNestedBlockDragStart(event, '${this.id}', ${index}, '${block.id}')"
              ondragend="emailBuilder.handleNestedBlockDragEnd(event)"
              onclick="event.stopPropagation(); emailBuilder.selectNestedBlock('${this.id}', ${index}, '${block.id}', event.ctrlKey || event.metaKey)"
              style="margin-bottom: 8px; background: white; border-radius: 6px; cursor: move;">
              
              <!-- Mini Toolbar -->
              <div class="nested-block-toolbar">
                <button class="nested-block-action" onclick="event.stopPropagation(); emailBuilder.duplicateNestedBlock('${this.id}', ${index}, '${block.id}')" title="Dupliquer">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                </button>
                ${block.type === 'article' ? `
                <button class="nested-block-action" onclick="event.stopPropagation(); emailBuilder.disassembleNestedArticle('${this.id}', ${index}, '${block.id}')" title="Désassembler l'article">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="6" cy="6" r="3"/>
                    <circle cx="6" cy="18" r="3"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"/>
                  </svg>
                </button>
                ` : ''}
                <button class="nested-block-action text-danger" onclick="event.stopPropagation(); emailBuilder.deleteNestedBlock('${this.id}', ${index}, '${block.id}')" title="Supprimer">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
              
              ${block.renderEditor(articleIndex)}
            </div>
          `;
        });
      } else {
        html += `
          <div style="text-align: center; padding: 32px 8px; color: #9ca3af; font-size: 12px; pointer-events: none;">
            Glissez un block ici
          </div>
        `;
      }
      
      html += `
        </div>
      `;
    });
    
    html += `
      </div>
    `;
    
    return html;
  }

  renderEmail() {
    const { gap, columns, padding, backgroundColor, borderWidth, borderColor, borderStyle, borderRadius } = this.config;
    const gapValue = parseInt(gap) || 16;
    const columnWidth = Math.floor((600 - gapValue * (columns.length - 1)) / columns.length);
    
    const containerStyle = `
      padding: ${padding};
      background-color: ${backgroundColor};
      border: ${borderWidth} ${borderStyle} ${borderColor};
      border-radius: ${borderRadius};
    `;
    
    let html = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${containerStyle}">
        <tr>
    `;
    
    columns.forEach((column, index) => {
      const colStyle = `
        padding: ${column.padding};
        padding-right: ${index < columns.length - 1 ? gapValue + 'px' : column.padding};
        background-color: ${column.backgroundColor};
        border: ${column.borderWidth} ${column.borderStyle} ${column.borderColor};
        border-radius: ${column.borderRadius};
        text-align: ${column.horizontalAlign};
      `;
      
      html += `
          <td width="${columnWidth}" valign="${column.verticalAlign}" style="${colStyle}">
      `;
      
      if (column.blocks && column.blocks.length > 0) {
        column.blocks.forEach(block => {
          html += block.renderEmail();
        });
      }
      
      html += `
          </td>
      `;
    });
    
    html += `
        </tr>
      </table>
    `;
    
    return html;
  }

  /**
   * Ajouter un block dans une colonne
   */
  addBlockToColumn(columnIndex, block) {
    if (!this.config.columns[columnIndex]) {
      console.error('Invalid column index');
      return;
    }
    
    this.config.columns[columnIndex].blocks.push(block);
  }

  /**
   * Retirer un block d'une colonne
   */
  removeBlockFromColumn(columnIndex, blockId) {
    if (!this.config.columns[columnIndex]) {
      console.error('Invalid column index');
      return;
    }
    
    const blocks = this.config.columns[columnIndex].blocks;
    const index = blocks.findIndex(b => b.id === blockId);
    
    if (index !== -1) {
      blocks.splice(index, 1);
    }
  }

  /**
   * Obtenir tous les blocks imbriqués (pour la sérialisation)
   */
  getAllNestedBlocks() {
    const allBlocks = [];
    this.config.columns.forEach(column => {
      if (column.blocks) {
        allBlocks.push(...column.blocks);
      }
    });
    return allBlocks;
  }

  /**
   * Sérialiser en JSON
   */
  toJSON() {
    const config = {
      ...this.config,
      columns: this.config.columns.map(column => ({
        blocks: column.blocks.map(block => block.toJSON())
      }))
    };
    
    return {
      id: this.id,
      type: this.type,
      config
    };
  }

  validate() {
    return { valid: true, errors: [] };
  }
}

// Auto-enregistrement
BlockRegistry.register('columns', ColumnsBlock);
