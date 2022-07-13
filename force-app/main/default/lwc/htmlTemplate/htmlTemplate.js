import { LightningElement, api } from 'lwc';
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
