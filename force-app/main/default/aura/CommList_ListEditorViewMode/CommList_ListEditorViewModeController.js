({
  reloadData: function(component, event, helper) {
    helper.reloadData(component, event);
  },
  refresh: function(component, event, helper) {
    const compEvent = component.getEvent('refreshRecordList');
    compEvent.setParams({
      type: 'refresh',
    });
    compEvent.fire();
  },
  updateColumnSorting: function(component, event, helper) {
    let prefixes = ['refer', 'per', 'pick', 'time', 'cur'];
    let temp = event.getParam('fieldName');
    let sortDESC = component.get('v.isOrderDESC');
    let sortField = component.get('v.orderField');
    let sortColName = temp;

    prefixes.some((prefix) => {
      if (temp.indexOf(prefix) == 0) {
        sortColName = temp.slice(prefix.length);
        return true;
      }
    });

    sortDESC = sortColName == sortField ? !sortDESC : sortDESC;

    component.set('v.sortedBy', temp);
    component.set('v.sortedDirection', sortDESC ? 'desc' : 'asc');
    component.set('v.orderField', sortColName);
    component.set('v.isOrderDESC', sortDESC);
  },
  handleRowAction: function(component, event, helper) {
    let action = event.getParam('action');
    let row = event.getParam('row');
    let rows = component.get('v.rawData');
    let rowIndex = rows.indexOf(row);
    let recordId = rows[rowIndex]['Id'];

    component.set('v.selectedRowId', recordId);

    switch (action.name) {
      case 'edit':
        helper.handleEditRow(component, event);
        break;
      case 'delete':
        component.set('v.isOpen', true);
        break;
    }
  },

  deleteRecord: function(component, event, helper) {
    helper.handleDeleteRow(component);
    component.set('v.isOpen', false);
  },

  closeModel: function(component, event, helper) {
    component.set('v.isOpen', false);
  },

  navigateToListView: function(component, event, helper) {
    let relatedListEvent = $A.get('e.force:navigateToRelatedList');

    relatedListEvent.setParams({
      relatedListId: component.get('v.relationField'),
      parentRecordId: component.get('v.recordId'),
    });

    relatedListEvent.fire();
  },

  switchMode: function(component, event, helper) {
    component.set('v.isEditMode', true);
  },

  addMode: function(component, event, helper) {
    let recordTypes = component.get('v.recordTypes');

    if (recordTypes && (recordTypes.length === 1 || recordTypes.length === 0)) {
      $A.enqueueAction(component.get('c.createRecord'));
    } else if (recordTypes && recordTypes.length > 1) {
      $A.enqueueAction(component.get('c.toggleChooseRecordTypePopup'));
    } else {
      console.error('Undefined RecordType');
    }
  },

  onChangeParent: function(component, event, helper) {
    const compEvent = component.getEvent('refreshRecordList');
    compEvent.setParams({
      type: 'changeParent',
      parentField: component.get('v.parentField'),
    });
    compEvent.fire();
  },

  toggleChooseRecordTypePopup: function(component, event, helper) {
    let isChooseRecordType = component.get('v.isChooseRecordType');
    let recordTypes = component.get('v.recordTypes');

    recordTypes = recordTypes.map((rt) => {
      rt.checked = rt.default;
      return rt;
    });

    if (recordTypes.length) {
      component.set('v.recordTypeId', recordTypes.some((rt) => rt.default).value);
    }

    component.set('v.isChooseRecordType', !isChooseRecordType);
  },
  createRecord: function(component, event, helper) {
    let objectName = component.get('v.objectName');
    let parentField = component.get('v.parentField');
    let recordId = component.get('v.recordId');
    let getDefaultValue = component.get('c.getMapDefaultValue');

    getDefaultValue.setParams({
      objName: objectName,
    });

    getDefaultValue.setCallback(this, (result) => {
      let objectDefaultValue = result.getReturnValue();
      let createObjectEvent = $A.get('e.force:createRecord');

      objectDefaultValue[parentField] = recordId;
      createObjectEvent.setParams({
        entityApiName: objectName,
        recordTypeId: component.get('v.recordTypeId'),
      });

      component.set('v.isChooseRecordType', false);
      createObjectEvent.fire();
    });

    $A.enqueueAction(getDefaultValue);
  },
  changeRecordeTypeId: function(component, event, helper) {
    let recordTypeId = event.getSource().get('v.value');
    let recordTypes = component.get('v.recordTypes');

    recordTypes = recordTypes.map((rt) => {
      rt.checked = rt.value == recordTypeId;
      return rt;
    });

    component.set('v.recordTypes', recordTypes);
    component.set('v.recordTypeId', recordTypeId);
  },
});