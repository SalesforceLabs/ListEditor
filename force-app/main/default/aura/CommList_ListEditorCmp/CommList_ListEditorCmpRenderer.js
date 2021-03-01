({
  afterRender: function(component, helper) {
    this.superAfterRender();

    const globalId = component.getGlobalId();
    const globalClass = '.comm-list-' + globalId.replace(/[;:]/g, '-');
    const bgColor = component.get('v.brandBgColor');
    const txtColor = component.get('v.brandTxtColor');
    const rowColor = component.get('v.brandRowColor');
    const iconFillColor = component.get('v.iconFillColor');
    const iconBgColor = component.get('v.iconBgColor');

    const wrapper = component.find('listEditorWrapper').getElement();
    let styleSheet = '';

    if (bgColor && bgColor != '') {
      styleSheet += `
				${globalClass} .cCommList_ListEditorViewMode.bound-border:not(.slds-modal) {
					background: ${bgColor};
				}
				${globalClass} .cCommList_ListEditorViewMode header.slds-card__header {
					background: ${bgColor};
				}`;
    }

    if (txtColor && txtColor != '') {
      styleSheet += `
				${globalClass} .cCommList_ListEditorViewMode header.slds-card__header {
					color: ${txtColor};
				}`;
    }

    if (rowColor && rowColor != '') {
      styleSheet += `
				${globalClass} .cCommList_ListEditorViewMode .slds-table tbody tr:nth-child(even) {
					background: ${rowColor};
				}

				@media all and (max-width:767px) {
					${globalClass} .cCommList_ListEditorViewMode .slds-table tbody tr:nth-child(even) {
						background: inherit;
					}
				}`;
    }

    if (iconFillColor && iconFillColor != '') {
      styleSheet += `
				${globalClass} h2 svg {
					fill: ${iconFillColor} !important;
				}`;
    }

    if (iconBgColor && iconBgColor != '') {
      styleSheet += `
				${globalClass} h2 svg {
					background: ${iconBgColor} !important;
				}`;
    }

    const styleNode = document.createTextNode(styleSheet);
    const styleTag = document.createElement('style');

    styleTag.setAttribute('type', 'text/css');
    styleTag.appendChild(styleNode);
    wrapper.appendChild(styleTag);
  },
});