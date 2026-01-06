/**
 * EmailBuilder - Interface principale du builder d'emails
 */
class EmailBuilder {
  constructor() {
    this.blocks = [];
    this.selection = null; // { type, blockId, columnIndex, nestedBlockId }
    this.multiSelection = []; // Pour la multi-sélection (Ctrl+clic) - blocs racine
    this.nestedMultiSelection = []; // Pour la multi-sélection des blocs imbriqués { parentBlockId, columnIndex, nestedBlockId }
    this.templateData = window.TEMPLATE_DATA || {};
    this.draggedBlockType = null;
    this.draggedBlockId = null;
    this.dropIndicatorIndex = null;
    
    // État pour le drag de blocs imbriqués
    this.draggedNestedBlock = null; // { parentBlockId, columnIndex, nestedBlockId }
    
    // État pour le drag personnalisé (burger)
    this.isDraggingFromBurger = false;
    this.dragGhost = null;
    this.dragStartY = 0;
    
    this.canvas = document.getElementById('email-canvas');
    this.palette = document.getElementById('block-palette');
    this.propertiesPanel = document.getElementById('properties-panel');
    
    this.init();
  }

  init() {
    // Charger les blocks existants si en mode édition
    if (this.templateData.blocks && this.templateData.blocks.length > 0) {
      this.loadBlocks(this.templateData.blocks);
    }
    
    // Initialiser la palette
    this.renderBlockPalette();
    
    // Initialiser les événements
    this.initEvents();
    
    // Initialiser SortableJS pour le drag & drop (si disponible)
    this.initSortable();
  }

  /**
   * Charger des blocks depuis JSON
   */
  loadBlocks(blocksData) {
    blocksData.forEach(blockData => {
      const block = this.createBlockFromJSON(blockData);
      this.blocks.push(block);
    });
    this.renderCanvas();
  }

  /**
   * Créer un block depuis JSON (avec support des blocks imbriqués)
   */
  createBlockFromJSON(blockData) {
    const block = BlockRegistry.create(blockData.type, {
      id: blockData.id,
      ...blockData.config
    });
    
    // Si c'est un ColumnsBlock ou Columns3Block, recréer les blocks imbriqués
    if ((blockData.type === 'columns' || blockData.type === 'columns3') && blockData.config.columns) {
      block.config.columns = blockData.config.columns.map(column => ({
        ...column,
        blocks: (column.blocks || []).map(nestedBlockData => 
          this.createBlockFromJSON(nestedBlockData)
        )
      }));
    }
    
    return block;
  }

  /**
   * Rendre la palette de blocks
   */
  renderBlockPalette() {
    const categories = BlockRegistry.getBlocksByCategory();
    
    let html = '';
    for (const [category, blocks] of Object.entries(categories)) {
      const categoryLabels = {
        content: 'Contenu',
        media: 'Médias',
        layout: 'Mise en page',
        other: 'Autres'
      };
      
      html += `<div class="mb-4">`;
      html += `<h4 class="text-xs font-semibold text-muted mb-2 uppercase tracking-wider">${categoryLabels[category] || category}</h4>`;
      
      blocks.forEach(block => {
        html += `
          <button 
            class="w-full text-left px-3 py-2.5 rounded-xl hover:bg-primary/5 border border-transparent hover:border-border transition flex items-center gap-3 mb-1 group cursor-move"
            data-block-type="${block.type}"
            draggable="true"
            ondragstart="emailBuilder.handleDragStart(event, '${block.type}')"
            onclick="emailBuilder.addBlock('${block.type}')">
            <span class="text-muted group-hover:text-primary transition">${block.icon}</span>
            <span class="text-sm font-medium text-primary/80 group-hover:text-primary">${block.label}</span>
          </button>
        `;
      });
      
      html += `</div>`;
    }
    
    this.palette.innerHTML = html;
  }

  /**
   * Ajouter un block
   */
  addBlock(type) {
    const block = BlockRegistry.create(type);
    this.blocks.push(block);
    this.renderCanvas();
    this.selectBlock(block.id);
  }

  /**
   * Rendre le canvas
   */
  renderCanvas() {
    if (this.blocks.length === 0) {
      this.canvas.innerHTML = `
        <div class="flex items-center justify-center h-full text-muted p-8">
          <div class="text-center">
            <svg class="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <p class="text-sm">Ajoutez des blocks depuis la palette de gauche</p>
          </div>
        </div>
      `;
      return;
    }
    
    // Calculer les index des articles pour la numérotation (racine + imbriqués)
    let articleIndex = 0;
    this.blocks.forEach(block => {
      if (block.type === 'article') {
        articleIndex++;
        block._articleIndex = articleIndex;
      }
      // Parcourir aussi les articles dans les colonnes
      if ((block.type === 'columns' || block.type === 'columns3') && block.config.columns) {
        block.config.columns.forEach(column => {
          if (column.blocks) {
            column.blocks.forEach(nestedBlock => {
              if (nestedBlock.type === 'article') {
                articleIndex++;
                nestedBlock._articleIndex = articleIndex;
              }
            });
          }
        });
      }
    });
    
    this.canvas.innerHTML = this.blocks.map(block => this.createBlockWrapper(block)).join('');
  }

  /**
   * Créer le wrapper d'un block avec floating toolbar
   */
  createBlockWrapper(block) {
    const isSelected = this.selection && 
                       (this.selection.blockId === block.id || this.selection.type === 'container' && this.selection.blockId === block.id) &&
                       !this.selection.nestedBlockId;
    const isMultiSelected = this.multiSelection.includes(block.id);
    
    return `
      <div 
        class="block-wrapper ${isSelected ? 'selected' : ''} ${isMultiSelected ? 'multi-selected' : ''}" 
        data-block-id="${block.id}"
        onmouseenter="emailBuilder.showFloatingToolbar(event, '${block.id}')"
        onmouseleave="emailBuilder.hideFloatingToolbar()"
        onclick="event.stopPropagation(); emailBuilder.selectBlock('${block.id}', event.ctrlKey || event.metaKey)">
        <div class="block-content">
          ${block.renderEditor(block._articleIndex)}
        </div>
      </div>
    `;
  }

  /**
   * Sélectionner un block (niveau racine)
   * @param {string} blockId - ID du block à sélectionner
   * @param {boolean} ctrlKey - Si Ctrl est enfoncé (multi-sélection)
   */
  selectBlock(blockId, ctrlKey = false) {
    if (ctrlKey) {
      // Multi-sélection avec Ctrl
      // Reset la multi-sélection des blocs imbriqués
      this.nestedMultiSelection = [];
      
      const index = this.multiSelection.indexOf(blockId);
      if (index > -1) {
        // Déjà sélectionné -> retirer
        this.multiSelection.splice(index, 1);
      } else {
        // Ajouter à la multi-sélection
        this.multiSelection.push(blockId);
      }
      this.selection = null; // Pas de sélection simple en mode multi
    } else {
      // Sélection simple
      this.multiSelection = []; // Reset multi-sélection
      this.nestedMultiSelection = []; // Reset multi-sélection imbriquée
      this.selection = {
        type: 'block',
        blockId: blockId,
        columnIndex: null,
        nestedBlockId: null
      };
    }
    this.renderCanvas();
    this.showProperties();
  }

  /**
   * Déselectionner tous les blocks
   */
  deselectAll() {
    if (!this.selection && this.multiSelection.length === 0 && this.nestedMultiSelection.length === 0) return;
    
    this.selection = null;
    this.multiSelection = [];
    this.nestedMultiSelection = [];
    this.renderCanvas();
    this.propertiesPanel.innerHTML = '<p class="text-muted text-sm">Aucun bloc sélectionné</p>';
    
    // Cacher le floating toolbar
    const toolbar = document.getElementById('floating-toolbar');
    if (toolbar) {
      toolbar.style.display = 'none';
    }
  }

  /**
   * Sélectionner un container (ColumnsBlock)
   */
  selectContainer(blockId) {
    this.selection = {
      type: 'container',
      blockId: blockId,
      columnIndex: null,
      nestedBlockId: null
    };
    this.renderCanvas();
    this.showProperties();
  }

  /**
   * Sélectionner une colonne
   */
  selectColumn(blockId, columnIndex) {
    this.selection = {
      type: 'column',
      blockId: blockId,
      columnIndex: columnIndex,
      nestedBlockId: null
    };
    this.renderCanvas();
    this.showProperties();
  }

  /**
   * Sélectionner un block imbriqué dans une colonne
   */
  selectNestedBlock(parentBlockId, columnIndex, nestedBlockId, ctrlKey = false) {
    if (ctrlKey) {
      // Multi-sélection avec Ctrl pour les blocs imbriqués
      // Reset la multi-sélection des blocs racine
      this.multiSelection = [];
      
      const existingIndex = this.nestedMultiSelection.findIndex(
        s => s.parentBlockId === parentBlockId && s.columnIndex === columnIndex && s.nestedBlockId === nestedBlockId
      );
      
      if (existingIndex > -1) {
        // Déjà sélectionné -> retirer
        this.nestedMultiSelection.splice(existingIndex, 1);
      } else {
        // Ajouter à la multi-sélection
        this.nestedMultiSelection.push({ parentBlockId, columnIndex, nestedBlockId });
      }
      this.selection = null;
    } else {
      // Sélection simple
      this.nestedMultiSelection = [];
      this.multiSelection = [];
      this.selection = {
        type: 'nested-block',
        blockId: parentBlockId,
        columnIndex: columnIndex,
        nestedBlockId: nestedBlockId
      };
    }
    this.renderCanvas();
    this.showProperties();
  }

  /**
   * Afficher les propriétés selon la sélection
   */
  showProperties() {
    // Cas multi-sélection blocs racine
    if (this.multiSelection.length > 0) {
      this.showMultiSelectionProperties();
      return;
    }
    
    // Cas multi-sélection blocs imbriqués
    if (this.nestedMultiSelection.length > 0) {
      this.showNestedMultiSelectionProperties();
      return;
    }
    
    if (!this.selection) {
      this.propertiesPanel.innerHTML = '<p class="text-muted text-sm">Aucun élément sélectionné</p>';
      return;
    }

    const { type, blockId, columnIndex, nestedBlockId } = this.selection;
    
    // Cas 1: Block racine ou container
    if (type === 'block' || type === 'container') {
      const block = this.blocks.find(b => b.id === blockId);
      if (!block) return;
      
      this.renderPropertiesForm(block.getPropertiesSchema(), (prop, value) => {
        this.updateBlockProperty(blockId, prop, value);
      }, block);
    }
    
    // Cas 2: Colonne
    else if (type === 'column') {
      const parentBlock = this.blocks.find(b => b.id === blockId);
      if (!parentBlock || (parentBlock.type !== 'columns' && parentBlock.type !== 'columns3')) return;
      
      const column = parentBlock.config.columns[columnIndex];
      if (!column) return;
      
      this.renderPropertiesForm(parentBlock.getColumnPropertiesSchema(), (prop, value) => {
        this.updateColumnProperty(blockId, columnIndex, prop, value);
      });
    }
    
    // Cas 3: Block imbriqué
    else if (type === 'nested-block') {
      const parentBlock = this.blocks.find(b => b.id === blockId);
      if (!parentBlock || (parentBlock.type !== 'columns' && parentBlock.type !== 'columns3')) return;
      
      const column = parentBlock.config.columns[columnIndex];
      if (!column) return;
      
      const nestedBlock = column.blocks.find(b => b.id === nestedBlockId);
      if (!nestedBlock) return;
      
      this.renderPropertiesForm(nestedBlock.getPropertiesSchema(), (prop, value) => {
        this.updateNestedBlockProperty(blockId, columnIndex, nestedBlockId, prop, value);
      }, nestedBlock);
    }
  }

  /**
   * Rendre le formulaire de propriétés
   */
  renderPropertiesForm(schema, onUpdate, block = null) {
    let html = `<div class="space-y-4">`;
    
    schema.forEach(prop => {
      html += `<div class="form-group">`;
      html += `<label class="block text-sm font-medium mb-2">${prop.label}</label>`;
      
      // Récupérer la valeur actuelle
      let value = '';
      if (this.selection.type === 'column') {
        const parentBlock = this.blocks.find(b => b.id === this.selection.blockId);
        value = parentBlock.config.columns[this.selection.columnIndex][prop.name];
      } else if (this.selection.type === 'nested-block') {
        const parentBlock = this.blocks.find(b => b.id === this.selection.blockId);
        const nestedBlock = parentBlock.config.columns[this.selection.columnIndex].blocks.find(b => b.id === this.selection.nestedBlockId);
        value = nestedBlock.config[prop.name];
      } else {
        const block = this.blocks.find(b => b.id === this.selection.blockId);
        value = block.config[prop.name];
      }
      
      switch (prop.type) {
        case 'text':
          // Détecter si c'est une valeur avec unité (px, %, em, rem, etc.)
          const hasUnit = prop.placeholder && (prop.placeholder.includes('px') || prop.placeholder.includes('%') || prop.placeholder.includes('em') || prop.placeholder.includes('rem'));
          
          if (hasUnit) {
            // Extraire la valeur numérique et l'unité
            const numValue = value ? parseFloat(value.toString().replace(/[^\d.-]/g, '')) : '';
            const unit = value ? (value.toString().match(/(px|%|em|rem|vh|vw)/) || ['px'])[0] : 'px';
            
            // Input number avec unité affichée
            html += `
              <div class="flex items-center gap-2">
                <input type="number" class="form-input flex-1 property-input-unit" data-property="${prop.name}" data-unit="${unit}" value="${numValue}" min="0" step="${unit === '%' ? '5' : '1'}">
                <span class="text-sm text-muted font-medium w-8">${unit}</span>
              </div>
            `;
          } else {
            html += `<input type="text" class="form-input w-full property-input" data-property="${prop.name}" value="${value || ''}" placeholder="${prop.placeholder || ''}">`;
          }
          break;
        
        case 'textarea':
          html += `<textarea class="form-input w-full property-input" data-property="${prop.name}" rows="${prop.rows || 3}" placeholder="${prop.placeholder || ''}">${value || ''}</textarea>`;
          break;
        
        case 'number':
          html += `<div class="flex items-center gap-2">`;
          html += `<input type="number" class="form-input flex-1 property-input" data-property="${prop.name}" value="${value || ''}" min="${prop.min || ''}" max="${prop.max || ''}" step="${prop.step || 1}">`;
          if (prop.unit) {
            html += `<span class="text-sm text-muted">${prop.unit}</span>`;
          }
          html += `</div>`;
          break;
        
        case 'color':
          html += `<input type="color" class="form-input w-full h-10 property-input" data-property="${prop.name}" value="${value || '#000000'}">`;
          break;
        
        case 'select':
          html += `<select class="form-input w-full property-input" data-property="${prop.name}">`;
          prop.options.forEach(opt => {
            html += `<option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>${opt.label}</option>`;
          });
          html += `</select>`;
          break;
      }
      
      html += `</div>`;
    });
    
    html += `</div>`;
    
    // Ajouter le bouton "Désassembler" pour les ArticleBlocks
    if (block && block.type === 'article') {
      html += `
        <hr class="border-border my-4">
        <button 
          onclick="emailBuilder.breakArticle('${block.id}')"
          class="w-full border border-orange-300 bg-orange-50 text-orange-700 px-4 py-3 rounded-lg font-semibold hover:bg-orange-100 transition flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5m-5-9V3m0 0L7 8m5-5l5 5"/>
          </svg>
          Désassembler l'article
        </button>
        <p class="text-xs text-muted text-center mt-2">
          Sépare l'article en blocs individuels (Image, Titre, Description)
        </p>
      `;
    }
    
    this.propertiesPanel.innerHTML = html;
    
    // Attacher les event listeners pour les inputs normaux
    this.propertiesPanel.querySelectorAll('.property-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const propertyName = e.target.dataset.property;
        let value = e.target.value;
        
        // Convertir en nombre si c'est un input number
        if (e.target.type === 'number') {
          value = parseFloat(value);
        }
        
        onUpdate(propertyName, value);
      });
    });
    
    // Attacher les event listeners pour les inputs avec unités
    this.propertiesPanel.querySelectorAll('.property-input-unit').forEach(input => {
      input.addEventListener('change', (e) => {
        const propertyName = e.target.dataset.property;
        const numValue = e.target.value;
        const unit = e.target.dataset.unit;
        
        // Combiner la valeur et l'unité
        const value = numValue ? `${numValue}${unit}` : '';
        
        onUpdate(propertyName, value);
      });
    });
  }

  /**
   * Mettre à jour une propriété d'un block
   */
  updateBlockProperty(blockId, propertyName, value) {
    const block = this.blocks.find(b => b.id === blockId);
    if (!block) return;
    
    block.updateConfig({ [propertyName]: value });
    this.renderCanvas();
    this.showProperties();
  }

  /**
   * Mettre à jour une propriété d'une colonne
   */
  updateColumnProperty(blockId, columnIndex, propertyName, value) {
    const block = this.blocks.find(b => b.id === blockId);
    if (!block || (block.type !== 'columns' && block.type !== 'columns3')) return;
    
    const column = block.config.columns[columnIndex];
    if (!column) return;
    
    column[propertyName] = value;
    this.renderCanvas();
    this.showProperties();
  }

  /**
   * Mettre à jour une propriété d'un block imbriqué
   */
  updateNestedBlockProperty(parentBlockId, columnIndex, nestedBlockId, propertyName, value) {
    const parentBlock = this.blocks.find(b => b.id === parentBlockId);
    if (!parentBlock || (parentBlock.type !== 'columns' && parentBlock.type !== 'columns3')) return;
    
    const column = parentBlock.config.columns[columnIndex];
    if (!column) return;
    
    const nestedBlock = column.blocks.find(b => b.id === nestedBlockId);
    if (!nestedBlock) return;
    
    nestedBlock.updateConfig({ [propertyName]: value });
    this.renderCanvas();
    this.showProperties();
  }

  /**
   * Afficher les propriétés pour la multi-sélection
   */
  showMultiSelectionProperties() {
    const selectedBlocks = this.multiSelection.map(id => this.blocks.find(b => b.id === id)).filter(Boolean);
    const blockTypes = selectedBlocks.map(b => b.type);
    
    let html = `
      <div class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="font-semibold text-blue-900 mb-2">
            ${selectedBlocks.length} éléments sélectionnés
          </p>
          <p class="text-sm text-blue-700">
            ${blockTypes.join(', ')}
          </p>
        </div>
        
        <button 
          onclick="emailBuilder.createArticleFromSelection()"
          class="w-full bg-primary text-white px-4 py-3 rounded-lg font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
          </svg>
          Créer un Article
        </button>
        
        <p class="text-xs text-muted text-center">
          Fusionne les éléments sélectionnés en un bloc Article réutilisable
        </p>
        
        <hr class="border-border">
        
        <button 
          onclick="emailBuilder.deselectAll()"
          class="w-full border border-border px-4 py-2 rounded-lg font-semibold hover:bg-muted/10 transition text-sm">
          Annuler la sélection
        </button>
      </div>
    `;
    
    this.propertiesPanel.innerHTML = html;
  }

  /**
   * Afficher les propriétés pour la multi-sélection de blocs imbriqués
   */
  showNestedMultiSelectionProperties() {
    // Récupérer les blocs imbriqués sélectionnés
    const selectedBlocks = this.nestedMultiSelection.map(sel => {
      const parentBlock = this.blocks.find(b => b.id === sel.parentBlockId);
      if (!parentBlock || !parentBlock.config.columns) return null;
      const column = parentBlock.config.columns[sel.columnIndex];
      if (!column || !column.blocks) return null;
      return column.blocks.find(b => b.id === sel.nestedBlockId);
    }).filter(Boolean);
    
    const blockTypes = selectedBlocks.map(b => b.type);
    
    let html = `
      <div class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="font-semibold text-blue-900 mb-2">
            ${selectedBlocks.length} éléments sélectionnés
          </p>
          <p class="text-sm text-blue-700">
            ${blockTypes.join(', ')}
          </p>
        </div>
        
        <button 
          onclick="emailBuilder.createArticleFromNestedSelection()"
          class="w-full bg-primary text-white px-4 py-3 rounded-lg font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
          </svg>
          Créer un Article
        </button>
        
        <p class="text-xs text-muted text-center">
          Fusionne les éléments sélectionnés en un bloc Article réutilisable
        </p>
        
        <hr class="border-border">
        
        <button 
          onclick="emailBuilder.deselectAll()"
          class="w-full border border-border px-4 py-2 rounded-lg font-semibold hover:bg-muted/10 transition text-sm">
          Annuler la sélection
        </button>
      </div>
    `;
    
    this.propertiesPanel.innerHTML = html;
  }

  /**
   * Créer un Article à partir de la multi-sélection de blocs imbriqués
   */
  createArticleFromNestedSelection() {
    if (this.nestedMultiSelection.length === 0) return;
    
    // Vérifier que tous les blocs sont dans la même colonne
    const firstSel = this.nestedMultiSelection[0];
    const allSameColumn = this.nestedMultiSelection.every(sel => 
      sel.parentBlockId === firstSel.parentBlockId && sel.columnIndex === firstSel.columnIndex
    );
    
    if (!allSameColumn) {
      alert('Veuillez sélectionner des blocs dans la même colonne');
      return;
    }
    
    // Récupérer le parent et la colonne
    const parentBlock = this.blocks.find(b => b.id === firstSel.parentBlockId);
    if (!parentBlock || !parentBlock.config.columns) return;
    const column = parentBlock.config.columns[firstSel.columnIndex];
    if (!column || !column.blocks) return;
    
    // Récupérer les blocs imbriqués sélectionnés
    const selectedBlockIds = this.nestedMultiSelection.map(sel => sel.nestedBlockId);
    const selectedBlocks = column.blocks.filter(b => selectedBlockIds.includes(b.id));
    
    if (selectedBlocks.length === 0) return;
    
    // Trouver l'index du premier bloc sélectionné dans la colonne
    const firstBlockIndex = column.blocks.findIndex(b => selectedBlockIds.includes(b.id));
    
    // Créer l'ArticleBlock
    const articleBlock = ArticleBlock.createFromBlocks(selectedBlocks);
    
    // Supprimer les blocs sélectionnés de la colonne
    column.blocks = column.blocks.filter(b => !selectedBlockIds.includes(b.id));
    
    // Insérer l'article dans la colonne à la position du premier bloc
    column.blocks.splice(firstBlockIndex, 0, articleBlock);
    
    // Reset la sélection
    this.nestedMultiSelection = [];
    this.selection = {
      type: 'nested-block',
      blockId: firstSel.parentBlockId,
      columnIndex: firstSel.columnIndex,
      nestedBlockId: articleBlock.id
    };
    
    this.renderCanvas();
    this.showProperties();
    
    console.log('✅ Article créé dans la colonne à partir de', selectedBlocks.length, 'blocs imbriqués');
  }

  /**
   * Désassembler un Article en blocs individuels
   */
  breakArticle(articleId) {
    const articleBlock = this.blocks.find(b => b.id === articleId);
    if (!articleBlock || articleBlock.type !== 'article') return;
    
    const articleIndex = this.blocks.findIndex(b => b.id === articleId);
    if (articleIndex === -1) return;
    
    // Créer les blocs individuels à partir de l'article
    const newBlocks = [];
    
    // 1. Image
    const imageBlock = BlockRegistry.create('image', {
      src: articleBlock.config.image.src,
      alt: articleBlock.config.image.alt,
      width: articleBlock.config.image.width,
      borderRadius: articleBlock.config.image.borderRadius
    });
    newBlocks.push(imageBlock);
    
    // 2. Titre (bloc texte)
    const titleBlock = BlockRegistry.create('text', {
      text: articleBlock.config.title.text,
      fontSize: articleBlock.config.title.fontSize,
      fontWeight: articleBlock.config.title.fontWeight,
      color: articleBlock.config.title.color,
      textAlign: 'left'
    });
    newBlocks.push(titleBlock);
    
    // 3. Description (bloc texte)
    const descBlock = BlockRegistry.create('text', {
      text: articleBlock.config.description.text,
      fontSize: articleBlock.config.description.fontSize,
      fontWeight: articleBlock.config.description.fontWeight,
      color: articleBlock.config.description.color,
      lineHeight: articleBlock.config.description.lineHeight,
      textAlign: 'left'
    });
    newBlocks.push(descBlock);
    
    // Supprimer l'article et insérer les nouveaux blocs
    this.blocks.splice(articleIndex, 1, ...newBlocks);
    
    // Sélectionner le premier bloc créé
    this.selection = {
      type: 'block',
      blockId: imageBlock.id,
      columnIndex: null,
      nestedBlockId: null
    };
    
    this.renderCanvas();
    this.showProperties();
    
    console.log('✅ Article désassemblé en', newBlocks.length, 'blocs');
  }

  /**
   * Créer un Article à partir de la multi-sélection
   */
  createArticleFromSelection() {
    if (this.multiSelection.length === 0) return;
    
    // Récupérer les blocs sélectionnés dans l'ordre
    const selectedBlocks = this.multiSelection
      .map(id => this.blocks.find(b => b.id === id))
      .filter(Boolean);
    
    if (selectedBlocks.length === 0) return;
    
    // Trouver l'index du premier bloc sélectionné
    const firstIndex = Math.min(...this.multiSelection.map(id => 
      this.blocks.findIndex(b => b.id === id)
    ).filter(i => i >= 0));
    
    // Créer l'ArticleBlock
    const articleBlock = ArticleBlock.createFromBlocks(selectedBlocks);
    
    // Supprimer les blocs sélectionnés
    this.blocks = this.blocks.filter(b => !this.multiSelection.includes(b.id));
    
    // Insérer l'article à la position du premier bloc
    this.blocks.splice(firstIndex, 0, articleBlock);
    
    // Reset la sélection
    this.multiSelection = [];
    this.selection = {
      type: 'block',
      blockId: articleBlock.id,
      columnIndex: null,
      nestedBlockId: null
    };
    
    this.renderCanvas();
    this.showProperties();
    
    console.log('✅ Article créé à partir de', selectedBlocks.length, 'blocs');
  }

  /**
   * Déplacer un block vers le haut
   */
  moveBlockUp(blockId) {
    const index = this.blocks.findIndex(b => b.id === blockId);
    if (index > 0) {
      [this.blocks[index - 1], this.blocks[index]] = [this.blocks[index], this.blocks[index - 1]];
      this.renderCanvas();
    }
  }

  /**
   * Déplacer un block vers le bas
   */
  moveBlockDown(blockId) {
    const index = this.blocks.findIndex(b => b.id === blockId);
    if (index < this.blocks.length - 1) {
      [this.blocks[index], this.blocks[index + 1]] = [this.blocks[index + 1], this.blocks[index]];
      this.renderCanvas();
    }
  }

  /**
   * Dupliquer un block
   */
  duplicateBlock(blockId) {
    const block = this.blocks.find(b => b.id === blockId);
    if (!block) return;
    
    const clone = block.clone();
    const index = this.blocks.findIndex(b => b.id === blockId);
    this.blocks.splice(index + 1, 0, clone);
    this.renderCanvas();
    this.selectBlock(clone.id);
  }

  /**
   * Supprimer un block
   */
  deleteBlock(blockId) {
    if (!confirm('Supprimer ce block ?')) return;
    
    this.blocks = this.blocks.filter(b => b.id !== blockId);
    this.selection = null;
    this.renderCanvas();
    this.propertiesPanel.innerHTML = '<p class="text-muted text-sm">Aucun élément sélectionné</p>';
  }

  /**
   * Dupliquer un bloc imbriqué
   */
  duplicateNestedBlock(parentBlockId, columnIndex, nestedBlockId) {
    const parentBlock = this.blocks.find(b => b.id === parentBlockId);
    if (!parentBlock || (parentBlock.type !== 'columns' && parentBlock.type !== 'columns3')) return;
    
    const column = parentBlock.config.columns[columnIndex];
    if (!column || !column.blocks) return;
    
    const blockIndex = column.blocks.findIndex(b => b.id === nestedBlockId);
    if (blockIndex === -1) return;
    
    const block = column.blocks[blockIndex];
    const clone = block.clone();
    
    // Insérer après le bloc original
    column.blocks.splice(blockIndex + 1, 0, clone);
    
    this.renderCanvas();
    this.selectNestedBlock(parentBlockId, columnIndex, clone.id);
  }

  /**
   * Supprimer un bloc imbriqué
   */
  deleteNestedBlock(parentBlockId, columnIndex, nestedBlockId) {
    if (!confirm('Supprimer ce bloc ?')) return;
    
    const parentBlock = this.blocks.find(b => b.id === parentBlockId);
    if (!parentBlock || (parentBlock.type !== 'columns' && parentBlock.type !== 'columns3')) return;
    
    const column = parentBlock.config.columns[columnIndex];
    if (!column || !column.blocks) return;
    
    column.blocks = column.blocks.filter(b => b.id !== nestedBlockId);
    
    this.selection = null;
    this.renderCanvas();
    this.propertiesPanel.innerHTML = '<p class="text-muted text-sm">Aucun élément sélectionné</p>';
  }

  /**
   * Désassembler un article imbriqué en blocs individuels
   */
  disassembleNestedArticle(parentBlockId, columnIndex, articleId) {
    const parentBlock = this.blocks.find(b => b.id === parentBlockId);
    if (!parentBlock || (parentBlock.type !== 'columns' && parentBlock.type !== 'columns3')) return;
    
    const column = parentBlock.config.columns[columnIndex];
    if (!column || !column.blocks) return;
    
    const articleIndex = column.blocks.findIndex(b => b.id === articleId);
    if (articleIndex === -1) return;
    
    const articleBlock = column.blocks[articleIndex];
    if (articleBlock.type !== 'article') return;
    
    // Créer les blocs individuels à partir de l'article
    const newBlocks = [];
    
    // 1. Image
    const imageBlock = BlockRegistry.create('image', {
      src: articleBlock.config.image.src,
      alt: articleBlock.config.image.alt,
      width: articleBlock.config.image.width,
      borderRadius: articleBlock.config.image.borderRadius
    });
    newBlocks.push(imageBlock);
    
    // 2. Titre (bloc texte)
    const titleBlock = BlockRegistry.create('text', {
      text: articleBlock.config.title.text,
      fontSize: articleBlock.config.title.fontSize,
      fontWeight: articleBlock.config.title.fontWeight,
      color: articleBlock.config.title.color,
      textAlign: 'left'
    });
    newBlocks.push(titleBlock);
    
    // 3. Description (bloc texte)
    const descBlock = BlockRegistry.create('text', {
      text: articleBlock.config.description.text,
      fontSize: articleBlock.config.description.fontSize,
      fontWeight: articleBlock.config.description.fontWeight,
      color: articleBlock.config.description.color,
      lineHeight: articleBlock.config.description.lineHeight,
      textAlign: 'left'
    });
    newBlocks.push(descBlock);
    
    // Remplacer l'article par les nouveaux blocs dans la colonne
    column.blocks.splice(articleIndex, 1, ...newBlocks);
    
    // Sélectionner le premier bloc créé
    this.selection = {
      type: 'nested-block',
      blockId: parentBlockId,
      columnIndex: columnIndex,
      nestedBlockId: imageBlock.id
    };
    
    this.renderCanvas();
    this.showProperties();
    
    console.log('✅ Article imbriqué désassemblé en', newBlocks.length, 'blocs');
  }

  /**
   * Générer le HTML email
   */
  generateEmailHTML() {
    const bodyContent = this.blocks.map(block => block.renderEmail()).join('\n');
    
    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${this.templateData.name}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
    table { border-collapse: collapse; }
    img { border: 0; display: block; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 600px;">
          <tr>
            <td>
              ${bodyContent}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Sauvegarder le template
   */
  async save() {
    const saveBtn = document.getElementById('save-btn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="flex items-center gap-2">⏳ Enregistrement...</span>';
    
    try {
      const name = document.getElementById('template-name').value;
      const description = document.getElementById('template-description').value;
      const blocks = this.blocks.map(block => block.toJSON());
      const html = this.generateEmailHTML();
      
      const response = await fetch('/templates/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: this.templateData.id || null,
          name,
          description,
          blocks: JSON.stringify(blocks),
          html
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('✅ Template enregistré avec succès !');
        if (!this.templateData.id) {
          // Rediriger vers l'édition si c'était une création
          window.location.href = `/templates/${result.templateId}/edit`;
        }
      } else {
        alert('❌ Erreur : ' + result.error);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span class="flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>Enregistrer</span>';
    }
  }

  /**
   * Afficher l'aperçu
   */
  showPreview() {
    const modal = document.getElementById('preview-modal');
    const content = document.getElementById('preview-content');
    
    content.innerHTML = this.generateEmailHTML();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  /**
   * Initialiser les événements
   */
  initEvents() {
    // Bouton Sauvegarder
    document.getElementById('save-btn').addEventListener('click', () => this.save());
    
    // Bouton Aperçu
    document.getElementById('preview-btn').addEventListener('click', () => this.showPreview());
    
    // Fermer l'aperçu
    document.getElementById('close-preview').addEventListener('click', () => {
      const modal = document.getElementById('preview-modal');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    });
    
    // Drag & Drop sur le canvas
    this.canvas.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.canvas.addEventListener('drop', (e) => this.handleDrop(e));
    this.canvas.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    
    // Empêcher la propagation des clics dans le canvas
    this.canvas.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Empêcher la propagation des clics dans le properties panel
    this.propertiesPanel.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Clic en dehors du canvas pour déselectionner
    document.addEventListener('click', (e) => {
      // Si on arrive ici, c'est qu'on a cliqué en dehors
      this.deselectAll();
    });
    
    // Raccourcis clavier
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + S pour sauvegarder
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.save();
      }
      
      // Delete pour supprimer l'élément sélectionné
      if (e.key === 'Delete' && this.selection) {
        if (this.selection.type === 'block' || this.selection.type === 'container') {
          this.deleteBlock(this.selection.blockId);
        }
        // TODO: ajouter la suppression de blocks imbriqués si nécessaire
      }
      
      // Escape pour déselectionner
      if (e.key === 'Escape') {
        this.deselectAll();
      }
    });
  }

  /**
   * Début du drag depuis la palette
   */
  handleDragStart(event, blockType) {
    this.draggedBlockType = blockType;
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text/plain', blockType);
    
    // Style visuel
    event.target.style.opacity = '0.5';
  }

  /**
   * Début du drag d'un block existant
   */
  handleBlockDragStart(event, blockId) {
    this.draggedBlockId = blockId;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', blockId);
    
    // Style visuel
    event.target.style.opacity = '0.4';
  }

  /**
   * Fin du drag d'un block
   */
  handleBlockDragEnd(event) {
    event.target.style.opacity = '1';
    this.draggedBlockId = null;
  }

  /**
   * Survol du canvas pendant le drag
   */
  handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    
    // Vérifier si on survole une zone de colonne
    const columnZone = event.target.closest('.column-drop-zone');
    if (columnZone) {
      // On survole une colonne, gérer le drop dans la colonne
      columnZone.classList.add('column-drag-over');
      return;
    }
    
    // Sinon, comportement normal (canvas principal)
    const afterElement = this.getDragAfterElement(event.clientY);
    this.showDropIndicator(afterElement);
  }

  /**
   * Quitter le canvas
   */
  handleDragLeave(event) {
    if (event.target === this.canvas) {
      this.removeDropIndicator();
    }
  }

  /**
   * Drop dans le canvas
   */
  handleDrop(event) {
    event.preventDefault();
    
    console.log('📍 Drop event triggered!');
    console.log('   draggedBlockType:', this.draggedBlockType);
    console.log('   draggedBlockId:', this.draggedBlockId);
    
    // Vérifier si on drop dans une colonne
    const columnZone = event.target.closest('.column-drop-zone');
    if (columnZone) {
      columnZone.classList.remove('column-drag-over');
      this.handleDropInColumn(event, columnZone);
      return;
    }
    
    // Cas 1: Drag depuis la palette (nouveau block)
    if (this.draggedBlockType) {
      console.log('🆕 Creating new block of type:', this.draggedBlockType);
      const blockType = this.draggedBlockType;
      this.draggedBlockType = null;
      
      // Trouver où insérer
      const afterElement = this.getDragAfterElement(event.clientY);
      const insertIndex = afterElement ? 
        this.blocks.findIndex(b => b.id === afterElement.dataset.blockId) : 
        this.blocks.length;
      
      // Créer et insérer le block
      const block = BlockRegistry.create(blockType);
      this.blocks.splice(insertIndex, 0, block);
      
      // Nettoyer et re-render
      this.removeDropIndicator();
      this.renderCanvas();
      this.selectBlock(block.id);
    }
    
    // Cas 2: Réorganisation d'un block existant
    else if (this.draggedBlockId) {
      console.log('🔄 Reordering block:', this.draggedBlockId);
      const draggedId = this.draggedBlockId;
      this.draggedBlockId = null;
      
      // Trouver les index
      const draggedIndex = this.blocks.findIndex(b => b.id === draggedId);
      console.log('   draggedIndex:', draggedIndex);
      const afterElement = this.getDragAfterElement(event.clientY);
      let insertIndex = afterElement ? 
        this.blocks.findIndex(b => b.id === afterElement.dataset.blockId) : 
        this.blocks.length;
      
      // Si on drop après le block lui-même, ne rien faire
      if (draggedIndex === insertIndex || draggedIndex + 1 === insertIndex) {
        this.removeDropIndicator();
        return;
      }
      
      // Ajuster l'index si on déplace vers le bas
      if (draggedIndex < insertIndex) {
        insertIndex--;
      }
      
      // Déplacer le block
      const [block] = this.blocks.splice(draggedIndex, 1);
      this.blocks.splice(insertIndex, 0, block);
      
      // Nettoyer et re-render
      this.removeDropIndicator();
      this.renderCanvas();
      this.selectBlock(block.id);
    }
  }

  /**
   * Gérer le drop dans une colonne
   */
  handleDropInColumn(event, columnZone) {
    const parentBlockId = columnZone.dataset.parentBlockId;
    const columnIndex = parseInt(columnZone.dataset.columnIndex);
    
    // Trouver le block parent (ColumnsBlock ou Columns3Block)
    const parentBlock = this.blocks.find(b => b.id === parentBlockId);
    if (!parentBlock || (parentBlock.type !== 'columns' && parentBlock.type !== 'columns3')) {
      console.error('Parent ColumnsBlock or Columns3Block not found');
      return;
    }
    
    // Calculer la position d'insertion basée sur la position Y du curseur
    const insertionIndex = this.getNestedBlockInsertionIndex(event, columnZone);
    
    // Cas 1: Déplacement d'un bloc imbriqué
    if (this.draggedNestedBlock) {
      const { parentBlockId: sourceParentId, columnIndex: sourceColumnIndex, nestedBlockId } = this.draggedNestedBlock;
      
      // Trouver le bloc source
      const sourceParent = this.blocks.find(b => b.id === sourceParentId);
      if (!sourceParent || !sourceParent.config.columns) return;
      
      const sourceColumn = sourceParent.config.columns[sourceColumnIndex];
      if (!sourceColumn || !sourceColumn.blocks) return;
      
      const blockIndex = sourceColumn.blocks.findIndex(b => b.id === nestedBlockId);
      if (blockIndex === -1) return;
      
      const block = sourceColumn.blocks[blockIndex];
      
      // Retirer du bloc source
      sourceColumn.blocks.splice(blockIndex, 1);
      
      // Calculer l'index ajusté si on déplace dans la même colonne
      let adjustedIndex = insertionIndex;
      if (sourceParentId === parentBlockId && sourceColumnIndex === columnIndex && blockIndex < insertionIndex) {
        adjustedIndex--;
      }
      
      // Ajouter à la position calculée au lieu de la fin
      if (parentBlock.config.columns && parentBlock.config.columns[columnIndex]) {
        parentBlock.config.columns[columnIndex].blocks.splice(adjustedIndex, 0, block);
      }
      
      this.draggedNestedBlock = null;
      this.renderCanvas();
      this.selectNestedBlock(parentBlockId, columnIndex, nestedBlockId);
      return;
    }
    
    // Cas 2: Nouveau bloc depuis la palette
    if (this.draggedBlockType) {
      const blockType = this.draggedBlockType;
      this.draggedBlockType = null;
      
      const block = BlockRegistry.create(blockType);
      
      // Ajouter à la position calculée au lieu de la fin
      if (parentBlock.config.columns && parentBlock.config.columns[columnIndex]) {
        parentBlock.config.columns[columnIndex].blocks.splice(insertionIndex, 0, block);
      }
      
      // Re-render
      this.renderCanvas();
      this.selectNestedBlock(parentBlockId, columnIndex, block.id);
    }
  }

  /**
   * Début du drag d'un bloc imbriqué
   */
  handleNestedBlockDragStart(event, parentBlockId, columnIndex, nestedBlockId) {
    this.draggedNestedBlock = { parentBlockId, columnIndex, nestedBlockId };
    event.dataTransfer.effectAllowed = 'move';
    event.target.style.opacity = '0.5';
  }

  /**
   * Fin du drag d'un bloc imbriqué
   */
  handleNestedBlockDragEnd(event) {
    event.target.style.opacity = '1';
    this.draggedNestedBlock = null;
  }

  /**
   * Calculer l'index d'insertion dans une colonne basé sur la position du curseur
   */
  getNestedBlockInsertionIndex(event, columnZone) {
    const mouseY = event.clientY;
    const nestedBlocks = [...columnZone.querySelectorAll('.nested-block')];
    
    if (nestedBlocks.length === 0) {
      return 0; // Si la colonne est vide, insérer à la position 0
    }
    
    // Trouver le bloc le plus proche avant la position du curseur
    for (let i = 0; i < nestedBlocks.length; i++) {
      const block = nestedBlocks[i];
      const rect = block.getBoundingClientRect();
      const blockMiddle = rect.top + rect.height / 2;
      
      // Si le curseur est au-dessus du milieu de ce bloc, insérer avant
      if (mouseY < blockMiddle) {
        return i;
      }
    }
    
    // Si on arrive ici, le curseur est après tous les blocs
    return nestedBlocks.length;
  }

  /**
   * Trouver l'élément après lequel insérer
   */
  getDragAfterElement(y) {
    const draggableElements = [...this.canvas.querySelectorAll('.block-wrapper')];
    
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  /**
   * Afficher l'indicateur de drop
   */
  showDropIndicator(afterElement) {
    this.removeDropIndicator();
    
    const indicator = document.createElement('div');
    indicator.className = 'drop-indicator';
    indicator.style.cssText = 'height: 4px; background: #0f172a; margin: 8px 0; border-radius: 2px; transition: all 0.2s;';
    
    if (afterElement) {
      afterElement.parentNode.insertBefore(indicator, afterElement);
    } else {
      this.canvas.appendChild(indicator);
    }
  }

  /**
   * Retirer l'indicateur de drop
   */
  removeDropIndicator() {
    const indicator = this.canvas.querySelector('.drop-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Initialiser SortableJS (optionnel)
   */
  initSortable() {
    // Désactivé car on utilise le floating toolbar maintenant
  }

  /**
   * Afficher le floating toolbar
   */
  showFloatingToolbar(event, blockId) {
    const toolbar = document.getElementById('floating-toolbar');
    if (!toolbar) return;
    
    const blockWrapper = event.currentTarget;
    const rect = blockWrapper.getBoundingClientRect();
    const canvasContainer = blockWrapper.closest('.max-w-3xl');
    const containerRect = canvasContainer.getBoundingClientRect();
    
    // Positionner à gauche du block
    const top = rect.top - containerRect.top;
    toolbar.style.top = `${top}px`;
    toolbar.style.display = 'flex';
    
    // Stocker l'ID du block actuel
    toolbar.dataset.blockId = blockId;
    
    // Afficher/cacher le bouton désassembler selon le type de bloc
    const block = this.blocks.find(b => b.id === blockId);
    const disassembleBtn = document.getElementById('disassemble-btn');
    if (disassembleBtn) {
      disassembleBtn.style.display = (block && block.type === 'article') ? 'flex' : 'none';
    }
  }

  /**
   * Cacher le floating toolbar
   */
  hideFloatingToolbar() {
    const toolbar = document.getElementById('floating-toolbar');
    if (!toolbar) return;
    
    // Petit délai pour permettre de cliquer sur les boutons
    setTimeout(() => {
      if (!toolbar.matches(':hover') && !document.querySelector('.block-wrapper:hover')) {
        toolbar.style.display = 'none';
        toolbar.dataset.blockId = '';
      }
    }, 150);
  }

  /**
   * Dupliquer le block depuis le toolbar
   */
  duplicateBlockFromToolbar() {
    const toolbar = document.getElementById('floating-toolbar');
    const blockId = toolbar.dataset.blockId;
    if (blockId) {
      this.duplicateBlock(blockId);
    }
  }

  /**
   * Supprimer le block depuis le toolbar
   */
  deleteBlockFromToolbar() {
    const toolbar = document.getElementById('floating-toolbar');
    const blockId = toolbar.dataset.blockId;
    if (blockId) {
      this.deleteBlock(blockId);
      toolbar.style.display = 'none';
    }
  }

  /**
   * Désassembler le block article depuis le toolbar
   */
  disassembleBlockFromToolbar() {
    const toolbar = document.getElementById('floating-toolbar');
    const blockId = toolbar.dataset.blockId;
    if (blockId) {
      this.breakArticle(blockId);
      toolbar.style.display = 'none';
      toolbar.dataset.blockId = '';
    }
  }

  /**
   * Début du drag depuis le toolbar handle
   */
  /**
   * Démarrer le drag personnalisé depuis le burger (mousedown)
   */
  startBurgerDrag(event, blockId) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('🎯 Burger drag started, blockId:', blockId);
    
    this.isDraggingFromBurger = true;
    this.draggedBlockId = blockId;
    this.dragStartY = event.clientY;
    
    // Trouver le block wrapper original
    const blockWrapper = document.querySelector(`.block-wrapper[data-block-id="${blockId}"]`);
    if (!blockWrapper) {
      console.error('❌ Block wrapper not found');
      return;
    }
    
    // Créer un ghost (clone visuel)
    this.dragGhost = blockWrapper.cloneNode(true);
    this.dragGhost.classList.add('drag-ghost');
    this.dragGhost.style.cssText = `
      position: fixed;
      pointer-events: none;
      opacity: 0.8;
      z-index: 1000;
      width: ${blockWrapper.offsetWidth}px;
      transform: rotate(2deg);
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      left: ${blockWrapper.getBoundingClientRect().left}px;
      top: ${event.clientY - 20}px;
    `;
    document.body.appendChild(this.dragGhost);
    
    // Rendre le block original semi-transparent
    blockWrapper.style.opacity = '0.3';
    
    // Cacher le toolbar
    const toolbar = document.getElementById('floating-toolbar');
    if (toolbar) toolbar.style.display = 'none';
    
    // Écouter les événements de mouvement et relâchement
    document.addEventListener('mousemove', this.handleBurgerDragMove);
    document.addEventListener('mouseup', this.handleBurgerDragEnd);
  }
  
  /**
   * Mouvement pendant le drag (mousemove)
   */
  handleBurgerDragMove = (event) => {
    if (!this.isDraggingFromBurger || !this.dragGhost) return;
    
    // Déplacer le ghost
    this.dragGhost.style.top = `${event.clientY - 20}px`;
    
    // Afficher l'indicateur de drop
    const afterElement = this.getDragAfterElement(event.clientY);
    this.showDropIndicator(afterElement);
  }
  
  /**
   * Fin du drag (mouseup)
   */
  handleBurgerDragEnd = (event) => {
    if (!this.isDraggingFromBurger) return;
    
    console.log('📍 Burger drag ended');
    
    // Supprimer le ghost
    if (this.dragGhost) {
      this.dragGhost.remove();
      this.dragGhost = null;
    }
    
    // Restaurer l'opacité du block original
    const blockWrapper = document.querySelector(`.block-wrapper[data-block-id="${this.draggedBlockId}"]`);
    if (blockWrapper) {
      blockWrapper.style.opacity = '1';
    }
    
    // Effectuer le déplacement
    if (this.draggedBlockId) {
      const afterElement = this.getDragAfterElement(event.clientY);
      this.moveBlockToPosition(this.draggedBlockId, afterElement);
    }
    
    // Nettoyer
    this.isDraggingFromBurger = false;
    this.draggedBlockId = null;
    this.removeDropIndicator();
    
    // Retirer les listeners
    document.removeEventListener('mousemove', this.handleBurgerDragMove);
    document.removeEventListener('mouseup', this.handleBurgerDragEnd);
  }
  
  /**
   * Déplacer un block à une nouvelle position
   */
  moveBlockToPosition(blockId, afterElement) {
    const currentIndex = this.blocks.findIndex(b => b.id === blockId);
    if (currentIndex === -1) return;
    
    let targetIndex;
    if (afterElement) {
      targetIndex = this.blocks.findIndex(b => b.id === afterElement.dataset.blockId);
    } else {
      targetIndex = this.blocks.length;
    }
    
    // Pas de déplacement nécessaire
    if (currentIndex === targetIndex || currentIndex + 1 === targetIndex) {
      return;
    }
    
    // Ajuster l'index si on déplace vers le bas
    if (currentIndex < targetIndex) {
      targetIndex--;
    }
    
    // Déplacer le block
    const [block] = this.blocks.splice(currentIndex, 1);
    this.blocks.splice(targetIndex, 0, block);
    
    console.log(`✅ Block moved from ${currentIndex} to ${targetIndex}`);
    
    this.renderCanvas();
    this.selectBlock(blockId);
  }
  
  // === LEGACY (pour compatibilité avec ondragstart inline) ===
  handleToolbarDragStart(event) {
    // Utiliser le nouveau système à la place
    const toolbar = document.getElementById('floating-toolbar');
    const blockId = toolbar?.dataset?.blockId;
    if (blockId) {
      this.startBurgerDrag(event, blockId);
    }
  }

  /**
   * Fin du drag depuis le toolbar handle
   */
  handleToolbarDragEnd(event) {
    // Restaurer l'opacité de tous les blocks
    document.querySelectorAll('.block-wrapper').forEach(wrapper => {
      wrapper.style.opacity = '1';
    });
    
    // Réinitialiser
    this.draggedBlockId = null;
  }

}

// Initialiser le builder au chargement de la page
let emailBuilder;
document.addEventListener('DOMContentLoaded', () => {
  emailBuilder = new EmailBuilder();
});
