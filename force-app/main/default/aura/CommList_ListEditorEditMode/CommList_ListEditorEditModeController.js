({
  reloadData: function(component, event, helper) {
    let spinner = component.find('loadingSpinner');
    $A.util.removeClass(spinner, 'slds-hide');
    const isUnsavedRecords = component.get('v.isUnsavedRecords');

    // Load data related list:
    let objectName = component.get('v.objectName');
    let fields = component.get('v.showFields');
    let sObjectName = component.get('v.parentObject');
    let parentField = component.get('v.parentField');

    // Get related infor and setting data in grid
    helper.getRelatedListForEdit(component, objectName, fields, sObjectName, parentField, helper, event);
    helper.getOrderFieldWithPrefix(component, objectName);
    component.set('v.isUnsavedRecords', isUnsavedRecords);
  },
  refreshEditMode: function(component, event, helper) {
    let spinner = component.find('loadingSpinner');
    $A.util.removeClass(spinner, 'slds-hide');

    // Reset all mode(tab, text)
    component.set('v.editedRecordList', null);
    component.set('v.displayPicklistAsText', false);
    let relatedList = component.get('v.relatedList');
    let records = component.get('v.recordList');

    let rowsWithCells = helper.prepareRows(component, records, -1);
    let parentField = component.get('v.parentField');
    let hasMoreRecord = component.get('v.hasMoreRecord');
    let lblRecShow = hasMoreRecord ? records.length + '+' : rowsWithCells.length;
    let defaultObjectLabel = component.get('v.defaultLabel');

    if (defaultObjectLabel !== '') {
      component.set('v.title', '<span class="header-label">' + defaultObjectLabel + '</span><span class="count">(' + lblRecShow + ')</span>');
    } else {
      component.set('v.title', '<span class="header-label">' + relatedList.labelName + '</span><span class="count">(' + lblRecShow + ')</span>');
    }

    component.set('v.records', rowsWithCells);
    component.set('v.isUnsavedRecords', false);
    component.set('v.displaySaveStatus', false);
    component.set('v.numbRecLoaded', rowsWithCells.length);

    if (!parentField && relatedList.lstExtraFields.length > 0) {
      component.set('v.parentField', relatedList.lstExtraFields[relatedList.lstExtraFields.length - 1]);
    }

    $A.util.addClass(spinner, 'slds-hide');
  },
  onFieldChange: function(component, event, helper) {
    if (event.getParam('fieldType') === 'picklist' || event.getParam('fieldType') === 'checkbox') {
      let columns = component.get('v.relatedList').lstObjectFields;
      let controlFieldName = event.getParam('fieldName');
      //Get all dependendFields in edit mode
      let dependentFields = [];

      columns.forEach((column, index) => {
        if (column.controlFieldName === controlFieldName) {
          dependentFields = [...dependentFields, { iCol: index, dependentField: column }];
        }
      });

      if (dependentFields.length > 0) {
        let records = component.get('v.records');
        const rowIndex = event.getParam('rowIndex');
        const newValue = event.getParam('newValue');
        let listCells = records[rowIndex].cells;

        dependentFields.forEach((field) => {
          //Set new options for each dependent field
          let newOptions = field.dependentField.picklistDependencyOptions[newValue] || [];
          let cell = listCells[field.iCol];

          if (!cell.isRequired && newOptions.length > 0) {
            newOptions = [...newOptions, { label: '', value: '' }];
          }

          cell.picklistOptions = newOptions;
          cell.value = '';
        });

        component.set('v.records', records);
      }
    }

    component.set('v.displaySaveStatus', false);
    component.set('v.isUnsavedRecords', true);
  },
  cloneRow: function(component, event, helper) {
    let indexRow = event.getSource().get('v.value');
    helper.cloneARow(component, event, helper, indexRow);
    component.set('v.displaySaveStatus', false);
    component.set('v.isUnsavedRecords', true);
  },
  createRow: function(component, event, helper) {
    helper
      .addRow(component, event, helper)
      .then(
        $A.getCallback((data) => {
          if (data) {
            const margin = 4;
            const tableBodyPosition = document.querySelector('.dataGridBody').getClientRects()[0].top;
            const scrollToPosition = document.querySelector('.editer-row:last-child').getClientRects()[0].top;
            const cardBody = component.find('editBodyScroller').getElement();
            cardBody.scrollTop = scrollToPosition - tableBodyPosition - margin;
          }
        })
      )
      .catch(
        $A.getCallback((errorMessage) => {
          //ブラウザのコンソールにエラー表示
          console.error('Error: ', errorMessage);
        })
      );
  },
  deleteRow: function(component, event, helper) {
    let indexRow = event.getSource().get('v.value');
    helper.tagRowForDeletion(component, indexRow);
    component.set('v.displaySaveStatus', false);
    component.set('v.isUnsavedRecords', true);
  },
  menuClick: function(component, event, helper) {
    let selectedMenuItemValue = event.getParam('value');

    if (selectedMenuItemValue === 'save') {
    } else if (selectedMenuItemValue === 'textMode') {
      let currentDisv = component.get('v.displayPicklistAsText');
      component.set('v.displayPicklistAsText', !currentDisv);
    }
  },
  moveToDetail: function(component, event) {
    let recordId = event.getSource().get('v.value');
    let navEvt = $A.get('e.force:navigateToSObject');
    navEvt.setParams({
      recordId: recordId
    });
    navEvt.fire();
  },
  closeModal: function(component) {
    let cmpTarget = component.find('Modalbox');
    let cmpBack = component.find('Modalbackdrop');
    $A.util.removeClass(cmpBack, 'slds-backdrop--open');
    $A.util.removeClass(cmpTarget, 'slds-fade-in-open');
  },
  sort: function(component, event, helper) {
    if (component.get('v.isUnsavedRecords')) {
      component.set('v.isConfirmingSort', true);
      component.set('v.sortingFieldConfirmed', event.currentTarget.dataset.colname);
    } else {
      let sortColName = event.currentTarget.dataset.colname;
      let sortDESC = component.get('v.isOrderDESC');
      let sortField = component.get('v.sortField');

      sortDESC = sortColName == sortField ? !sortDESC : sortDESC;
      component.set('v.sortField', sortColName);
      component.set('v.isOrderDESC', sortDESC);
    }
  },
  confirmSorting: function(component, event, helper) {
    let sortColName = component.get('v.sortingFieldConfirmed');
    let sortDESC = component.get('v.isOrderDESC');
    let sortField = component.get('v.sortField');

    sortDESC = sortColName == sortField ? !sortDESC : sortDESC;
    component.set('v.editedRecordList', null);
    component.set('v.sortField', sortColName);
    component.set('v.isOrderDESC', sortDESC);

    $A.enqueueAction(component.get('c.closeSortingConfirmationModal'));
  },
  closeSortingConfirmationModal: function(component, event, helper) {
    component.set('v.isConfirmingSort', false);
  },
  confirmModal: function(component, event, helper) {
    if (component.get('v.isUnsavedRecords')) {
      let cmpTarget = component.find('ModalConfirm');
      let cmpBack = component.find('ModalConfirmBackdrop');

      $A.util.addClass(cmpTarget, 'slds-fade-in-open');
      $A.util.addClass(cmpBack, 'slds-backdrop--open');
    } else {
      component.set('v.editedRecordList', null);
      component.set('v.isEditMode', false);
    }
  },
  closeConfirmModal: function(component) {
    let cmpTarget = component.find('ModalConfirm');
    let cmpBack = component.find('ModalConfirmBackdrop');

    $A.util.removeClass(cmpBack, 'slds-backdrop--open');
    $A.util.removeClass(cmpTarget, 'slds-fade-in-open');
  },
  closeAllModal: function(component, event, helper) {
    //Close the current confirm modal
    let refreshCell = component.get('c.refreshEditMode');
    $A.enqueueAction(refreshCell);
    let cmpTarget = component.find('ModalConfirm');
    let cmpBack = component.find('ModalConfirmBackdrop');

    $A.util.removeClass(cmpBack, 'slds-backdrop--open');
    $A.util.removeClass(cmpTarget, 'slds-fade-in-open');

    //Close the edit modal
    component.set('v.editedRecordList', null);
    component.set('v.isEditMode', false);
  },

  //DUC added
  dragstart: function(component, event, helper) {
    component.set('v.dragid', event.target.dataset.dragId);
    event.dataTransfer.setData('Text', component.id);
  },
  drop: function(component, event, helper) {
    let oldIndex = component.get('v.dragid');
    let newIndex = event.target.dataset.dragId;
    let pos = event.clientY;
    let target = event.target;
    let rect;

    if (target.nodeName == 'TD') {
      rect = target.firstChild.getBoundingClientRect();
    } else if (target.nodeName == 'DIV') {
      rect = target.getBoundingClientRect();
    }

    if (pos > rect.bottom) {
      //newIndex = parseInt(newIndex) + 1;
    } else if (pos < rect.top) {
      newIndex = parseInt(newIndex) - 1;
    }

    if (newIndex && oldIndex) {
      var values = component.get('v.records');

      while (newIndex < 0) {
        newIndex += values.length;
      }

      if (newIndex >= values.length) {
        var k = newIndex - values.length + 1;
        while (k--) {
          values.push(undefined);
        }
      }

      values.splice(newIndex, 0, values.splice(oldIndex, 1)[0]);
      component.set('v.records', values);
    }

    event.preventDefault();
  },
  cancel: function(component, event, helper) {
    event.preventDefault();
  },
  mouseOverDragIcon: function(cmp, event, helper) {
    let thisRow = event.currentTarget;
    let parentDiv = thisRow.parentElement.parentElement;
    parentDiv.setAttribute('draggable', true);
  },
  mouseOutDragIcon: function(cmp, event, helper) {
    let thisRow = event.currentTarget;
    let parentDiv = thisRow.parentElement.parentElement;
    parentDiv.setAttribute('draggable', false);
  },
  //End DUC Added
  save: function(component, event, helper) {
    helper.isLoading(component, true);

    let lstTargetRecords = helper.prepareRecordsToSave(component, event, helper);
    let parentField = component.get('v.parentField');
    let lstShowField = component.get('v.fieldsFls');
    let action = component.get('c.saveRecords');

    let params = {
      sObjectName: component.get('v.parentObject'),
      objectName: component.get('v.objectName'),
      toUpdate: lstTargetRecords.recUpdates,
      toInsert: lstTargetRecords.recInserts,
      toDelete: lstTargetRecords.recDeletes,
      recordId: component.get('v.recordId'),
      parentField: parentField,
      lstShowField: lstShowField
    };

    action.setParams(params);
    action.setCallback(this, function(a) {
      let state = a.getState();

      if (state === 'SUCCESS') {
        let ec = helper.afterSaveCleaning(component, event, helper, a.getReturnValue());
        component.set('v.displaySaveStatus', true);

        if (ec.totalErrors != 0) {
          let msg = $A.get('$Label.c.CommList_SaveError');
          helper.showToast(component, event, '', msg, 'error');
        } else {
          //Close the edit modal
          component.set('v.displaySaveStatus', false);
          let objectLabelname = component.get('v.relatedList').labelName;
          let saveSuccessMessage = $A.get('$Label.c.CommList_SaveSuccess');
          saveSuccessMessage = saveSuccessMessage.replace('{0}', objectLabelname);

          helper.showToast(component, event, '', saveSuccessMessage, 'success');

          let refreshRecords = component.getEvent('refreshRecordList');
          refreshRecords.setParams({
            type: 'save'
          });

          component.set('v.editedRecordList', null);
          component.set('v.isEditMode', false);

          refreshRecords.fire();
        }
      } else if (state === 'ERROR') {
        let errors = a.getError();
        console.error(errors);
      }
      helper.isLoading(component, false);
    });

    $A.enqueueAction(action);
  },
  showCreateRecordPopup: function(cmp, event, helper) {
    let objectName = event.getParam('objectApiName');
    cmp.set('v.isCreateRecord', true);
    cmp.set('v.objectToCreate', objectName);
  },
  isLoading: function(cmp, event, helper) {
    if (cmp.get('v.isLoading')) {
      helper.isLoading(cmp, true);
    }
  },
  loadMoreAction: function (cmp, event, helper) {
    const loadMoreAction = cmp.getEvent('loadMoreAction');
    let lstTargetRecords = helper.prepareRecordsToSave(cmp, event, helper);
    const editedRecordList = [...lstTargetRecords.recInserts, ...lstTargetRecords.recUpdates];
    cmp.set('v.editedRecordList', editedRecordList);

    loadMoreAction.fire();
  }
});
