// Copyright 2020 salesforce.com, inc
// All rights reserved.
// SPDX-License-Identifier: BSD-3-Clause
// For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
({
  getRecordList: function(component, event, helper, isRefresh) {
    const objectName = component.get('v.objectName');
    const fields = component.get('v.fields');
    const rowsToLoad = component.get('v.viewRowsToLoad');
    const parentField = component.get('v.parentField');
    const conditionsFilterList = component.get('v.conditionsFilterList');
    const searchText = component.get('v.searchText');
    const isOrderDESC = component.get('v.isOrderDESC');
    const orderField = component.get('v.orderField');
    const offset = component.get('v.loadMoreOffset') || 0;
    let recordId = component.get('v.recordId');
    const selectedRows = component.get('v.selectedRows');

    if (recordId && (recordId.length != 15 && recordId.length != 18)) {
      recordId = null;
    }

    component.set('v.isLoading', true);
    // create a server side action.
    const action = component.get('c.getRecordList');
    action.setParams({
      objectName: objectName,
      fields: fields,
      limitRecs: rowsToLoad,
      recordId: recordId,
      parentField: parentField,
      offset: offset,
      filter: conditionsFilterList,
      searchText: searchText,
      isOrderDESC: isOrderDESC,
      orderField: orderField || 'CreatedDate'
    });

    // set a call back
    action.setCallback(this, (a) => {
      // store the response return value (wrapper class insatance)
      const result = a.getReturnValue();

      // set the component attributes value with wrapper class properties.
      if (result && a.getState() === 'SUCCESS') {
        result.fieldsLocation.forEach((field) => {
          fields = fields.replace(field.fieldApi, field.fieldDetail);
        });

        //Remove if fields seperated on two mode
        component.set('v.fields', fields);
        component.set('v.parentFieldList', result.parentFieldList);
        component.set('v.parentField', result.parentField);
        component.set('v.sObjectName', result.sObjectName);
        component.set('v.objectName', result.objectName);
        component.set('v.isHaveOrderField', result.hasLEOrderField);
        component.set('v.orderFieldAPI', result.orderFieldAPI);
        component.set('v.recordTypes', result.recordTypes);

        if (result.caseField != '') {
          result.records.forEach((e) => {
            if (e['ToCase__r'] && !e['ToCase__r']['Subject']) {
              e['ToCase__r']['Subject'] = e['ToCase__r']['CaseNumber'];
            }
          });
        }

        let recordList = result.records;
        const originalRecordList = JSON.parse(JSON.stringify(result.records));

        if (!isRefresh) {
          component.set('v.originalRecordList', [...component.get('v.originalRecordList'), ...originalRecordList]);
          recordList = (component.get('v.recordList') || []).concat(recordList);
          component.set('v.margeSelectedRows', selectedRows);
        } else {
          component.set('v.originalRecordList', originalRecordList);
          component.set('v.margeSelectedRows', null);
          component.set('v.selectedRowIds', null);
        }

        component.set('v.hasMoreRecord', result.hasMoreRecord);
        component.set('v.loadMoreOffset', recordList.length);
        component.set('v.recordList', recordList);
      } else if (a.getState() === 'ERROR') {
        console.error(this.getComponentTitle(component), a.getError()[0] || a.getError());
        this.handleListEditorException(component, `${$A.get('$Label.c.CommList_ExceptionGetRecord')} ===> [${a.getError()[0].exceptionType}] ${a.getError()[0].message}`, 'sticky');
      }
      component.set('v.isLoading', false);
    });

    // enqueue the action
    $A.enqueueAction(action);
  },

  getFlowInfo: function (component, flowItem) {
    const action = component.get('c.getFlowInfo');

    action.setParams({
      flowNames: flowItem
    });

    action.setCallback(this, (returnVal) => {
      const result = returnVal.getReturnValue();

      if (result && result.length > 0 && returnVal.getState() === 'SUCCESS') {
        const flowItem = result.map(record => {
          return {
            id: record.Id,
            value: record.ApiName,
            label: record.Label
          };
        })

        component.set('v.flowItem', flowItem);
      }
    });

    $A.enqueueAction(action);
  },

  handleListEditorException: function(component, exceptionMessage, mode) {
    const title = this.getComponentTitle(component);
    const toastEvent = $A.get('e.force:showToast');
    const popupmode = mode || 'dismissible';

    toastEvent.setParams({
      title: `Threw exception in CommList: ${title}`,
      message: exceptionMessage,
      type: 'error',
      duration: 5000,
      mode: popupmode
    });

    toastEvent.fire();
    component.set('v.isHaveNoError', false);
  },

  getComponentTitle: function(component) {
    const defaultTitle = component.get('v.defaultLabel');

    if (defaultTitle) {
      return defaultTitle;
    }

    return component.get('v.title');
  },

  getDeepData: function(recordData, alias) {
    if (alias && alias.length > 1) {
      let shiftApiName = alias.shift();

      if (recordData[shiftApiName]) {
        return this.getDeepData(recordData[shiftApiName], alias);
      }

      return null;
    }

    return recordData[alias] || null;
  }
});
