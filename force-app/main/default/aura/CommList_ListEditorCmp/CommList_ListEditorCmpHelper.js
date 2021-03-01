({
  getRecordList: function(component, event, helper, isRefresh) {
    const objectName = component.get('v.objectName');
    const fields = component.get('v.fields');
    const rowsToLoad = component.get('v.viewRowsToLoad');
    const recordId = component.get('v.recordId');
    const parentField = component.get('v.parentField');
    const conditionsFilterList = component.get('v.conditionsFilterList');
    const searchText = component.get('v.searchText');
    const isOrderDESC = component.get('v.isOrderDESC');
    const orderField = component.get('v.orderField');
    const offset = component.get('v.loadMoreOffset') || 0;

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

        if (!isRefresh) {
          recordList = (component.get('v.recordList') || []).concat(recordList);
        }

        component.set('v.hasMoreRecord', result.hasMoreRecord);
        component.set('v.loadMoreOffset', recordList.length);
        component.set('v.recordList', this.getSortData(recordList, isOrderDESC, orderField));
      } else if (a.getState() === 'ERROR') {
        this.handleListEditorException(component, $A.get('$Label.c.CommList_ExceptionGetRecord'));
      }
      component.set('v.isLoading', false);
    });

    // enqueue the action
    $A.enqueueAction(action);
  },

  handleListEditorException: function(component, exceptionMessage) {
    const title = this.getComponentTitle(component);
    const toastEvent = $A.get('e.force:showToast');

    toastEvent.setParams({
      title: `Threw exception in CommList: ${title}`,
      message: exceptionMessage,
      type: 'error'
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
  },

  getSortData: function(recordList, sortDESC, sortColName) {
    let delection = sortDESC ? 1 : -1;
    let sortField = sortColName ? sortColName.split('.') : [sortColName];

    return recordList.sort((a, b) => {
      let aName = this.getDeepData(a, sortField.slice());
      let bName = this.getDeepData(b, sortField.slice());
      if (!aName || String(aName).trim() === '') return 1;
      if (!bName || String(bName).trim() === '') return -1;
      if (aName < bName) return delection;
      if (aName > bName) return -delection;
      return 0;
    });
  }
});