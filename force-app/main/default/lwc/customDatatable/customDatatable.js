import LightningDatatable from 'lightning/datatable';
import htmlBody from './htmlBody.html';

export default class CustomDatatable extends LightningDatatable {
  static customTypes = {
    datattableHtml: {
      template: htmlBody,
      typeAttributes: ['viewType']
    }
  };
}
