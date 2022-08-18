// Copyright 2020 salesforce.com, inc
// All rights reserved.
// SPDX-License-Identifier: BSD-3-Clause
// For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause

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
