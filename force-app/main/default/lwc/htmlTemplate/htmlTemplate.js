// Copyright 2020 salesforce.com, inc
// All rights reserved.
// SPDX-License-Identifier: BSD-3-Clause
// For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
import template from './htmlTemplate.html';

export default class HtmlTemplate extends LightningElement {
  @api htmlBody;
  @api type = 'html';
  isHtml = false;
  isText = false;

  render() {
    return template;
  }

  connectedCallback() {
    switch (this.type) {
      case 'html':
        this.isHtml = true;
        break;
      case 'text':
        this.isText = true;
        break;
      default:
        this.isHtml = true;
    }
  }
}
