/**
 * Columns3Block - Block de 3 colonnes (container)
 */
class Columns3Block extends BaseBlock {
  static metadata = {
    type: 'columns3',
    label: '3 Colonnes',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="5" height="16" stroke-width="2" rx="1"/><rect x="9.5" y="4" width="5" height="16" stroke-width="2" rx="1"/><rect x="16" y="4" width="5" height="16" stroke-width="2" rx="1"/></svg>',
    category: 'layout'
  };

  getDefaultConfig() {
    return {
      columnCount: 3,
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
      { name: 'gap', label: 'Espacement entre colonnes', type: 'text', placeholder: '16px' },
      { name: 'padding', label: 'Padding du container', type: 'text', placeholder: '16px' },
      { name: 'backgroundColor', label: 'Couleur de fond', type: 'color' },
      { name: 'borderWidth', label: 'Épaisseur bordure', type: 'text', placeholder: '0px' },
      { name: 'borderColor', label: 'Couleur bordure', type: 'color' },
      { name: 'borderStyle', label: 'Style bordure', type: 'select', options: [
        { value: 'solid', label: 'Plein' },
        { value: 'dashed', label: 'Tirets' },
        { value: 'dotted', label: 'Points' },
        { value: 'none', label: 'Aucune' }
      ]},
      { name: 'borderRadius', label: 'Coins arrondis', type: 'text', placeholder: '0px' }
    ];
  }

  renderEditor() {
    const containerStyle = `
      padding: ${this.config.padding};
      background-color: ${this.config.backgroundColor};
      border: ${this.config.borderWidth} ${this.config.borderStyle} ${this.config.borderColor};
      border-radius: ${this.config.borderRadius};
    `;

    return `
      <div class="columns-container" style="${containerStyle}">
        <div style="display: flex; gap: ${this.config.gap};">
          ${this.config.columns.map((column, index) => {
            const columnStyle = `
              flex: 1;
              padding: ${column.padding};
              background-color: ${column.backgroundColor};
              border: ${column.borderWidth} ${column.borderStyle} ${column.borderColor};
              border-radius: ${column.borderRadius};
              min-height: 100px;
            `;
            return `
              <div class="column-drop-zone" 
                   data-parent-block-id="${this.id}" 
                   data-column-index="${index}"
                   style="${columnStyle}"
                   ondragover="event.preventDefault(); event.stopPropagation();"
                   ondrop="emailBuilder.handleDropInColumn(event, this)">
                ${column.blocks.length === 0 ? '<p style="text-align: center; color: #9ca3af; font-size: 14px; padding: 20px;">Glissez un bloc ici</p>' : ''}
                ${column.blocks.map(nestedBlock => {
                  const blockInstance = BlockRegistry.create(nestedBlock.type, nestedBlock.config);
                  blockInstance.id = nestedBlock.id;
                  
                  // Vérifier si le bloc est dans la multi-sélection imbriquée
                  const isNestedMultiSelected = typeof emailBuilder !== 'undefined' && 
                    emailBuilder.nestedMultiSelection && 
                    emailBuilder.nestedMultiSelection.some(s => 
                      s.parentBlockId === this.id && s.columnIndex === index && s.nestedBlockId === nestedBlock.id
                    );
                  
                  // Récupérer l'index de l'article s'il existe
                  const articleIndex = nestedBlock._articleIndex || null;
                  
                  return `
                    <div class="nested-block ${isNestedMultiSelected ? 'multi-selected' : ''}" 
                         data-block-id="${nestedBlock.id}"
                         data-parent-block-id="${this.id}"
                         data-column-index="${index}"
                         draggable="true"
                         ondragstart="emailBuilder.handleNestedBlockDragStart(event, '${this.id}', ${index}, '${nestedBlock.id}')"
                         ondragend="emailBuilder.handleNestedBlockDragEnd(event)"
                         onclick="event.stopPropagation(); emailBuilder.selectNestedBlock('${this.id}', ${index}, '${nestedBlock.id}', event.ctrlKey || event.metaKey)"
                         style="margin-bottom: 8px; cursor: move; border: 2px solid transparent; border-radius: 4px; transition: all 0.2s;"
                         onmouseover="this.style.borderColor='#e5e7eb'"
                         onmouseout="this.style.borderColor='transparent'">
                      
                      <!-- Mini Toolbar -->
                      <div class="nested-block-toolbar">
                        <button class="nested-block-action" onclick="event.stopPropagation(); emailBuilder.duplicateNestedBlock('${this.id}', ${index}, '${nestedBlock.id}')" title="Dupliquer">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                          </svg>
                        </button>
                        ${nestedBlock.type === 'article' ? `
                        <button class="nested-block-action" onclick="event.stopPropagation(); emailBuilder.disassembleNestedArticle('${this.id}', ${index}, '${nestedBlock.id}')" title="Désassembler l'article">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="6" cy="6" r="3"/>
                            <circle cx="6" cy="18" r="3"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"/>
                          </svg>
                        </button>
                        ` : ''}
                        <button class="nested-block-action text-danger" onclick="event.stopPropagation(); emailBuilder.deleteNestedBlock('${this.id}', ${index}, '${nestedBlock.id}')" title="Supprimer">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                      
                      ${blockInstance.renderEditor(articleIndex)}
                    </div>
                  `;
                }).join('')}
              </div>
            `;
          }).join('')}
        </div>
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

    const columnWidth = Math.floor(100 / 3); // 33% pour chaque colonne

    return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="${containerStyle}">
        <tr>
          ${this.config.columns.map((column, index) => {
            const columnStyle = `
              width: ${columnWidth}%;
              padding: ${column.padding};
              background-color: ${column.backgroundColor};
              border: ${column.borderWidth} ${column.borderStyle} ${column.borderColor};
              border-radius: ${column.borderRadius};
              vertical-align: ${column.verticalAlign};
            `;
            return `
              <td style="${columnStyle}">
                ${column.blocks.map(nestedBlock => {
                  const blockInstance = BlockRegistry.create(nestedBlock.type, nestedBlock.config);
                  blockInstance.id = nestedBlock.id;
                  return blockInstance.renderEmail();
                }).join('')}
              </td>
            `;
          }).join('')}
        </tr>
      </table>
    `;
  }

  /**
   * Sérialiser en JSON avec les blocks imbriqués
   */
  toJSON() {
    const config = {
      ...this.config,
      columns: this.config.columns.map(column => ({
        ...column,
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
BlockRegistry.register('columns3', Columns3Block);
