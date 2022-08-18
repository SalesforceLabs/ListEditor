// Copyright 2020 salesforce.com, inc
// All rights reserved.
// SPDX-License-Identifier: BSD-3-Clause
// For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
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
    const imageMaxHeight = component.get('v.imageMaxHeight');
    const imageMaxWidth = component.get('v.imageMaxWidth');
    const imageMinHeight = component.get('v.imageMinHeight');
    const imageMinWidth = component.get('v.imageMinWidth');

    const wrapper = component.find('listEditorWrapper').getElement();
    let styleSheet = '';

    if (bgColor && bgColor != '') {
      styleSheet += `
      ${globalClass} .cCommList_ListEditorViewMode.bound-border:not(.slds-modal),
        ${globalClass} .listeditCommList_ListEditorViewMode.bound-border:not(.slds-modal) {
          background: ${bgColor};
        }
        ${globalClass} .cCommList_ListEditorViewMode header.slds-card__header,
        ${globalClass} .listeditCommList_ListEditorViewMode header.slds-card__header {
          background: ${bgColor};
        }`;
    }

    if (imageMaxHeight && imageMaxHeight != '') {
      styleSheet += `
        ${globalClass} .cCommList_ListEditorViewMode lightning-formatted-rich-text img,
        ${globalClass} .listeditCommList_ListEditorViewMode lightning-formatted-rich-text img {
          max-height: ${imageMaxHeight};
        }`;
    }

    if (imageMaxWidth && imageMaxWidth != '') {
      styleSheet += `
        ${globalClass} .cCommList_ListEditorViewMode lightning-formatted-rich-text img,
        ${globalClass} .listeditCommList_ListEditorViewMode lightning-formatted-rich-text img {
          max-width: ${imageMaxWidth};
        }`;
    }

    if (imageMinHeight && imageMinHeight != '') {
      styleSheet += `
        ${globalClass} .cCommList_ListEditorViewMode lightning-formatted-rich-text img,
        ${globalClass} .listeditCommList_ListEditorViewMode lightning-formatted-rich-text img {
          min-height: ${imageMinHeight};
        }`;
    }

    if (imageMinWidth && imageMinWidth != '') {
      styleSheet += `
        ${globalClass} .cCommList_ListEditorViewMode lightning-formatted-rich-text img,
        ${globalClass} .listeditCommList_ListEditorViewMode lightning-formatted-rich-text img {
          min-width: ${imageMinWidth};
        }`;
    }

    if (txtColor && txtColor != '') {
      styleSheet += `
        ${globalClass} .cCommList_ListEditorViewMode header.slds-card__header,
        ${globalClass} .listeditCommList_ListEditorViewMode header.slds-card__header {
          color: ${txtColor};
        }`;
    }

    if (rowColor && rowColor != '') {
      styleSheet += `
        ${globalClass} .cCommList_ListEditorViewMode .slds-table tbody tr:nth-child(even),
        ${globalClass} .listeditCommList_ListEditorViewMode .slds-table tbody tr:nth-child(even) {
          background: ${rowColor};
        }

        @media all and (max-width:767px) {
          ${globalClass} .cCommList_ListEditorViewMode .slds-table tbody tr:nth-child(even),
          ${globalClass} .listeditCommList_ListEditorViewMode .slds-table tbody tr:nth-child(even) {
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
  }
});
