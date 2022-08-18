// Copyright 2020 salesforce.com, inc
// All rights reserved.
// SPDX-License-Identifier: BSD-3-Clause
// For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
({
  getRelatedListForEdit: function(component, objectName, fields, sObjectName, parentField, helper, event) {
    var editedRecordList = component.get('v.editedRecordList');
    var action = component.get('c.getRelatedList');
    var params = {
      sObjectName: sObjectName,
      objectName: objectName,
      showFields: fields,
      parentField: parentField
    };

    action.setParams(params);
    action.setCallback(this, function(an) {
      var state = an.getState();

      if (state === 'SUCCESS') {
        var returnValue = an.getReturnValue();
        component.set('v.relatedList', returnValue);
        var insertData = editedRecordList && editedRecordList.recInserts || [];
        var deleteData = editedRecordList && editedRecordList.recDeletes || [];
        var updateData = editedRecordList && editedRecordList.recUpdates || [];

        if (!component.get('v.filterFields')) helper.buildFilterFields(component, returnValue);

        var records = component.get('v.recordList');
        var currentRecords = component.get('v.records');
        component.set('v.requiredFields', returnValue.requiredFields);

        /*
        if (editedRecordList && insertData.length > 0) {
          insertData.forEach((data, idx) => {
            records.splice(0 + idx, 0, data);
          });
        }
        */

        var rowsWithCells = helper.prepareRows(component, records, -1, currentRecords);
        var hasMoreRecord = component.get('v.hasMoreRecord');
        var lblRecShow = hasMoreRecord ? records.length + '+' : rowsWithCells.length;
        var defaultObjectLabel = component.get('v.defaultLabel');

        if (defaultObjectLabel !== '') {
          component.set('v.title', '<span class="header-label">' + defaultObjectLabel + '</span><span class="count">(' + lblRecShow + ')</span>');
        } else {
          component.set('v.title', '<span class="header-label">' + returnValue.labelName + '</span><span class="count">(' + lblRecShow + ')</span>');
        }

        if (editedRecordList) {
          deleteData.forEach((data) => {
            const searchId = data.Id;

            const targetIndex = rowsWithCells.findIndex((targetRecord) => {
              return targetRecord.Id === searchId;
            });

            if (targetIndex > -1) {
              rowsWithCells.splice(targetIndex, 1);
            }
          });

          updateData.forEach((data) => {
            const searchId = data.Id;

            const target = rowsWithCells.find((targetRecord) => {
              return targetRecord.Id === searchId;
            });

            if (target) {
              target.cells.forEach((cellTarget) => {
                const fieldName = cellTarget.fieldApiName;
                const targetVal = target[fieldName] ? target[fieldName] : '';
                const dataVal = data[fieldName] ? data[fieldName] : '';

                if (cellTarget && cellTarget.isEditable && targetVal != dataVal) {
                  cellTarget.isEdited = true;
                  cellTarget.value = data[fieldName];
                }

                target[fieldName] = data[fieldName];
              });
            }
          });
        }

        console.info('rowsWithCells', rowsWithCells);
        component.set('v.records', rowsWithCells);
        component.set('v.numbRecLoaded', rowsWithCells.length);
        component.set('v.defaultRecordTypeId', returnValue.defaultRecordTypeId);

        if (!parentField && returnValue.lstExtraFields.length > 0) {
          component.set('v.parentField', returnValue.lstExtraFields[returnValue.lstExtraFields.length - 1]);
        }
      }
    });
    // enqueue the action
    $A.enqueueAction(action);
  },
  cloneARow: function(component, event, helper, indexRow) {
    var rows = component.get('v.records');
    var newRow = JSON.parse(JSON.stringify(component.get('v.records[' + indexRow + ']')));
    newRow.DMLType = 'toInsert';
    newRow.Id = null;
    //let's link it to this this record .
    var parentField = component.get('v.parentField');
    newRow[parentField] = component.get('v.recordId');
    newRow = helper.tuneRowForUpdateableOnInsert(newRow);
    newRow = this.removeEncryptedFieldValue(newRow);
    rows.splice(indexRow + 1, 0, newRow);
    component.set('v.records', this.updateRowIndex(rows));
  },
  removeEncryptedFieldValue: function(row) {
    for (var i = 0; i < row.cells.length; i++) {
      if (row.cells[i].fieldType == 'ENCRYPTEDSTRING') {
        row.cells[i].value = '';
      }
    }
    return row;
  },
  prepareRows: function(component, rows, newRowIndex, currentRecords) {
    var objectName = component.get('v.objectName').toLowerCase();
    var rl = component.get('v.relatedList');
    var requiredFields = component.get('v.requiredFields');
    var editedRecordList = component.get('v.editedRecordList');

    rows.forEach((row, rowIndex) => {
      row.DMLType = 'toUpdate';
      row.isVisible = true;
      row.DMLError = false;
      //Build cells by matching layout columns and records returned by apex
      var cells = [];
      var isAccountParson = false;
      var oldRecord = currentRecords && currentRecords.find(oldData => {
        return oldData.Id === row.Id;
      });

      if (objectName === 'account') {
        isAccountParson = row.LastName != undefined && row.LastName != '';
      }

      rl.lstObjectFields.forEach((field, colIndex) => {
        var cell = {};
        var fieldApiNameSplit = field.fieldApiName.split('.');
        cell.value = row[fieldApiNameSplit[0]];
        cell.isEditable = true;
        var oldCell = oldRecord && oldRecord.cells.find(oldData => {
          return oldData.fieldApiName === field.fieldApiName;
        });
        cell.isEdited = editedRecordList && (editedRecordList.recUpdates.length > 0 || editedRecordList.recInserts.length > 0 || editedRecordList.deleteData.length > 0)
                        && oldCell && oldCell.isEdited ? true : false;

        for (var k = 1; k < fieldApiNameSplit.length; k++) {
          if (cell.value != null) {
            cell.value = cell.value[fieldApiNameSplit[k]];
          }
          cell.isEditable = false;
        }

        cell.fieldApiName = field.fieldApiName;
        cell.format = field.format;
        cell.fieldType = field.fieldType;
        cell.isRequired = requiredFields.some((field) => field === cell.fieldApiName);

        if (field.controlFieldName) {
          var controllingValue = row[field.controlFieldName];
          cell.picklistOptions = field.picklistDependencyOptions[controllingValue];
        } else {
          cell.picklistOptions = field.picklistOptions;
        }

        // If field is picklist select one or multi, add more option
        var pickListOneOrMulti = cell.fieldType.toLowerCase() == 'picklist' || cell.fieldType.toLowerCase() == 'multipicklist';

        if (!cell.isRequired && pickListOneOrMulti && cell.picklistOptions) {
          cell.picklistOptions = [...cell.picklistOptions, { label: '', value: '' }];
        }

        cell.relationship = field.relationship;
        cell.isVisible = field.isVisible;
        cell.isUpdateable = field.isUpdateable;
        cell.isCreateable = field.isCreateable;
        cell.UpdateableOnlyOnCreate = field.UpdateableOnlyOnCreate;

        // If cell is nonupdateable
        if (!cell.isUpdateable || !cell.isCreateable) {
          cell.isEditable = false;

          if (cell.fieldType == 'DATETIME' && cell.value) {
            var strTargetDt = new Date(cell.value).toLocaleString($A.get('$Locale.language'), $A.get('$Locale.timezone'));
            var targetDt = new Date(strTargetDt);
            var realMonth = targetDt.getMonth() + 1;
            cell.value =
              targetDt.getFullYear() + '/' + realMonth.toString().padStart(2, '0') + '/' + targetDt.getDate().toString().padStart(2, '0') + ' ' + targetDt.getHours().toString().padStart(2, '0') + ':' + targetDt.getMinutes().toString().padStart(2, '0');
          }
        }

        if (cell.fieldType == 'TIME' && (cell.value || cell.value == 0)) {
          var timeInSec = cell.value / 1000;
          var minutesInSec = timeInSec % 3600;
          var hoursInSec = timeInSec - minutesInSec;
          cell.value = this.convertIntToString(hoursInSec / 3600) + ':' + this.convertIntToString(Math.round(minutesInSec / 60)) + ':00.000Z';
        }

        if (newRowIndex >= 0) {
          if (cell.isCreateable && cell.fieldType !== 'ID') {
            cell.isEditable = true;
          }
          cell.rowIndex = newRowIndex;
        } else {
          cell.rowIndex = rowIndex;
        }

        cell.colIndex = colIndex;

        if (field.htmlInputType != null) {
          cell.inputMainType = field.htmlInputType.mainType;
          cell.inputSubType = field.htmlInputType.subType;
          cell.inputFormatType = field.htmlInputType.formatType;
          cell.inputScale = field.htmlInputType.scale;

          if (cell.inputMainType === 'calculated' || cell.fieldApiName === 'RecordTypeId') {
            cell.isEditable = false;
          }
        } else {
          cell.isEditable = false;
          cell.inputMainType = 'undefined';
        }

        //Account or ParsonalAccount
        if (objectName === 'account') {
          if (isAccountParson && cell.fieldApiName.toLowerCase() === 'name') {
            cell.isEditable = false;
          } else if (!isAccountParson && (cell.fieldApiName.toLowerCase() === 'lastname' || cell.fieldApiName.toLowerCase() === 'firstname')) {
            cell.isEditable = false;
          }
        }

        cells.push(cell);
      });

      row.cells = cells;
    });

    return rows;
  },
  addRow: function(component, event, helper) {
    var rl = component.get('v.relatedList');
    var rows = component.get('v.records');
    var parentField = component.get('v.parentField');
    var defaultRecordTypeId = component.get('v.defaultRecordTypeId');
    var defaultValueAddList = component.get('v.defaultValueAddList');

    try {
      var defaultValues = JSON.parse(defaultValueAddList);
    } catch (err) {
      var defaultValues = [];
    }

    var getDefaultValue = component.get('c.getMapDefaultValue');

    getDefaultValue.setParams({
      objName: component.get('v.objectName')
    });

    return new Promise(function(resolve, reject) {
      getDefaultValue.setCallback(this, (response) => {
        var newRow = {};
        var state = response.getState();

        if (state === 'SUCCESS') {
          var defaultMap = response.getReturnValue();

          //let's simulate the retrieval of an empty record from apex.
          for (var i = 0; i < rl.lstObjectFields.length; i++) {
            var field = rl.lstObjectFields[i];
            if (field.fieldApiName == 'OwnerId') {
              newRow[field.fieldApiName] = $A.get('$SObjectType.CurrentUser.Id');
            } else if (field.fieldType == 'ID' || field.fieldType == 'REFERENCE') {
              newRow[field.fieldApiName] = null;
            } else if (!field.isUpdateable) {
              newRow[field.fieldApiName] = '';
            } else if (field.htmlInputType != null && field.htmlInputType.subType == 'number') {
              newRow[field.fieldApiName] = 0;
            } else if (field.htmlInputType != null && field.htmlInputType.subType == 'date') {
              newRow[field.fieldApiName] = '';
            } else if (field.fieldType == 'DATETIME') {
              newRow[field.fieldApiName] = new Date().toISOString();
            } else {
              newRow[field.fieldApiName] = '';
            }

            if (field.fieldApiName in defaultValues) {
              newRow[field.fieldApiName] = defaultValues[field.fieldApiName];
            } else if (defaultMap[field.fieldApiName.toLowerCase()] != undefined) {
              newRow[field.fieldApiName] = defaultMap[field.fieldApiName.toLowerCase()];
            }

            newRow.RecordTypeId = defaultRecordTypeId;
          }

          //let's link it to this this record .
          newRow[parentField] = component.get('v.recordId');

          //let's prepare the row
          var rowsWithCells = helper.prepareRows(component, [newRow], rows.length);
          rowsWithCells[0].DMLType = 'toInsert';
          rowsWithCells[0] = helper.tuneRowForUpdateableOnInsert(rowsWithCells[0]);
          rows = rows.concat(rowsWithCells);
          component.set('v.records', rows);

          resolve(true);
        } else {
          var errors = response.getError();
          reject(errors[0].message);
        }
      });

      $A.enqueueAction(getDefaultValue);
    });
  },
  tuneRowForUpdateableOnInsert: function(row) {
    for (var i = 0; i < row.cells.length; i++) {
      if (row.cells[i].UpdateableOnlyOnCreate) {
        row.cells[i].isEditable = row.DMLType == 'toInsert' ? true : false;
      } else if (row.cells[i].fieldApiName === 'Id' || !row.cells[i].isCreateable) {
        row.cells[i].value = '';
      }

      if (row.cells[i].fieldApiName !== 'Id' && !row.cells[i].isEditable && row.cells[i].isCreateable && (row.cells[i].value === '' || row.cells[i].value === null)) {
        /**
         * No16
         * Add ' && row.cells[i].isCreateable ' to if statement to use
         */
        row.cells[i].isEditable = true;
      }
    }
    return row;
  },

  updateRowIndex: function(rows) {
    rows.forEach(function(row, rowIndex) {
      row.cells.forEach(function(cell) {
        cell.rowIndex = rowIndex;
      });
    });
    return rows;
  },

  tagRowForDeletion: function(component, indexRow) {
    var records = component.get('v.records');
    var newDMLType = records[indexRow].DMLType !== 'toInsert' ? 'toDelete' : 'doNothing';
    records[indexRow].DMLType = newDMLType;
    records[indexRow].isVisible = false;
    component.set('v.records', records);
  },

  prepareRecordsToSave: function(component, event, helper) {
    var rl = component.get('v.relatedList');
    var rows = component.get('v.records');
    var lstShowFieldFls = [];
    var savingRecords = { recUpdates: [], recInserts: [], recDeletes: [] };

    // If list rows empty
    if (rows == null) {
      return null;
    }

    var recIndex = 0;
    var lstItemEmpty = [];
    var orderFieldWithPrefix = component.get('v.orderFieldWithPre');
    var objectName = component.get('v.objectName');

    for (var i = 0; i < rows.length; i++) {
      var rec = {};
      rec.sobjectType = objectName;
      rec.Id = rows[i].Id;
      /* Valid blank record
       * No14
       * Set isBlank to true to use
       */
      rows[i].isBlank = false;

      for (var j = 0; j < rows[i].cells.length; j++) {
        if (rows[i].cells[j].value) {
          rows[i].isBlank = false;
        }

        if (rows[i].cells[j].isUpdateable || (rows[i].cells[j].isCreateable && rows[i].DMLType == 'toInsert')) {
          if (i == 0) {
            lstShowFieldFls.push(rows[i].cells[j].fieldApiName);
          }

          rec[rows[i].cells[j].fieldApiName] = rows[i].cells[j].value;
          if (rows[i].cells[j].fieldType == 'DATETIME' && rows[i].cells[j].value != null) {
            rec[rows[i].cells[j].fieldApiName] = rows[i].cells[j].value;
          }

          if (rows[i].cells[j].fieldType === 'TIME' && rows[i].cells[j].value !== null && rows[i].cells[j].value !== undefined) {
            var splValue = rows[i].cells[j].value.split(':');
            if (splValue.length === 2) {
              this.clearTimeSuffix(splValue);
              var newTime = splValue.join(':') + ':00.000';
              if (splValue[0].length === 1) {
                newTime = '0' + newTime;
              }
              rec[rows[i].cells[j].fieldApiName] = newTime;
            }
          }

          if (rows[i].cells[j].fieldApiName == 'OwnerId' && rows[i].cells[j].value == null) {
            rec[rows[i].cells[j].fieldApiName] = $A.get('$SObjectType.CurrentUser.Id');
            component.set('v.records[' + i + '].cells[' + j + '].value', $A.get('$SObjectType.CurrentUser.Id'));
          }
        }
      }

      recIndex = recIndex + 1;

      // Only setting when the order field is existance.
      if (orderFieldWithPrefix !== '') {
        rec[orderFieldWithPrefix] = recIndex - 1;
      }

      //For records to insert, add the extra fields that are not on the layout
      if (rows[i].DMLType == 'toInsert') {
        for (var j = 0; j < rl.lstExtraFields.length; j++) {
          rec[rl.lstExtraFields[j]] = rows[i][rl.lstExtraFields[j]];
        }
      }

      // Delete Name field if record is ParsonalAccount
      if (rec.sobjectType.toLowerCase() === 'account') {
        if (rec.LastName != undefined && rec.LastName != '') {
          delete rec.Name;
        }
      }

      if (rows[i].DMLType == 'toDelete') {
        savingRecords.recDeletes.push(rec);
      } else if (rows[i].DMLType == 'toUpdate') {
        savingRecords.recUpdates.push(rec);
      } else if (rows[i].DMLType == 'toInsert') {
        if (!rows[i].isBlank) {
          savingRecords.recInserts.push(rec);
        } else {
          rows[i].DMLType = null;
        }
      }
    }
    // clean the records emty:
    if (lstItemEmpty.length > 0) {
      lstItemEmpty.sort(function(a, b) {
        return b - a;
      });

      for (var k = 0; k < lstItemEmpty.length; k++) {
        rows.splice(lstItemEmpty[k], 1);
      }
    }

    component.set('v.records', rows);
    component.set('v.fieldsFls', lstShowFieldFls);

    return savingRecords;
  },
  afterSaveCleaning: function(component, event, helper, saveResult) {
    var rows = component.get('v.records');
    var insertCount = 0;
    var updateCount = 0;
    var deleteCount = 0;
    var errorsCount = { insertErrors: 0, updateErrors: 0, deleteErrors: 0, totalErrors: 0 };

    for (var i = 0; i < rows.length; i++) {
      rows[i].DMLError = false;

      if (rows[i].DMLType == 'toInsert') {
        if (saveResult.insertResults[insertCount].isSuccess) {
          rows[i].Id = saveResult.insertResults[insertCount].id;
          rows[i].DMLType = 'toUpdate';
          rows[i].DMLError = false;
          rows[i] = helper.tuneRowForUpdateableOnInsert(rows[i]);
        } else {
          rows[i].DMLError = true;
          errorsCount.insertErrors++;
          rows[i].DMLMessage = saveResult.insertResults[insertCount].error;
        }
        insertCount++;
      } else if (rows[i].DMLType == 'toDelete') {
        if (!saveResult.deleteResults[deleteCount].isSuccess) {
          rows[i].DMLType = 'toUpdate';
          rows[i].DMLError = true;
          errorsCount.deleteErrors++;
          rows[i].isVisible = true;
          rows[i].DMLMessage = saveResult.deleteResults[deleteCount].error;
        } else {
          rows[i].DMLType = 'doNothing';
        }
        deleteCount++;
      } else if (rows[i].DMLType == 'toUpdate') {
        if (!saveResult.updateResults[updateCount].isSuccess) {
          rows[i].DMLError = true;
          errorsCount.updateErrors++;
          rows[i].DMLMessage = saveResult.updateResults[updateCount].error;
        }
        updateCount++;
      }
    }
    //full refresh and rerender of "v.records" attribute
    component.set('v.records', rows);
    errorsCount.totalErrors = errorsCount.updateErrors + errorsCount.deleteErrors + errorsCount.insertErrors;
    return errorsCount;
  },
  showToast: function(component, event, title, message, type) {
    var toastEvent = $A.get('e.force:showToast');
    toastEvent.setParams({
      title: title,
      message: message,
      type: type,
      duration: 4000
    });
    toastEvent.fire();
  },
  getOrderFieldWithPrefix: function(component, objectName) {
    var action = component.get('c.getOrderFieldWithPrefix');
    var params = {
      objectName: objectName
    };

    action.setParams(params);
    action.setCallback(this, function(response) {
      var state = response.getState();
      if (state === 'SUCCESS') {
        var returnValue = response.getReturnValue();
        component.set('v.orderFieldWithPre', returnValue);
      } else {
        console.error('Error: ' + response.getError());
      }

      var spinner = component.find('loadingSpinner');
      $A.util.addClass(spinner, 'slds-hide');
    });
    // enqueue the action
    $A.enqueueAction(action);
  },
  buildFilterFields: function(component, fields) {
    //Build cells by matching layout columns and records returned by apex
    var cells = fields.lstObjectFields.map((field, i) => {
      var cell = {};
      cell.label = field.fieldName;
      cell.isEditable = true;
      cell.value = null;
      cell.fieldApiName = field.fieldApiName;
      cell.format = field.format;
      cell.fieldType = field.fieldType;
      cell.picklistOptions = field.picklistOptions;
      cell.relationship = field.relationship;
      cell.hasTwoValue = false;

      if (field.fieldType == 'DATE' || field.fieldType == 'DATETIME' || field.fieldType == 'DOUBLE') {
        cell.minValue = null;
        cell.hasTwoValue = true;
        cell.maxValue = null;
      }

      if (field.htmlInputType != null) {
        cell.inputMainType = field.htmlInputType.mainType;
        cell.inputSubType = field.htmlInputType.subType;
        cell.inputFormatType = field.htmlInputType.formatType;
        cell.inputScale = field.htmlInputType.scale;

        if (cell.inputMainType === 'calculated' || cell.fieldApiName === 'RecordTypeId') {
          cell.isEditable = false;
        }
      } else {
        cell.isEditable = false;
        cell.inputMainType = 'undefined';
      }
      return cell;
    });
    component.set('v.filterFields', cells);
  },
  isLoading: function(component, isLoading) {
    component.set('v.isLoading', isLoading);
    var spinner = component.find('loadingSpinner');

    if (isLoading) {
      $A.util.removeClass(spinner, 'slds-hide');
    } else {
      $A.util.addClass(spinner, 'slds-hide');
    }
  },
  clearTimeSuffix: function(timeSplited) {
    var newMin = parseInt(timeSplited[1]);
    var newHour = parseInt(timeSplited[0]);

    if (timeSplited[1].includes('PM')) {
      newHour = newHour == 12 ? 0 : newHour + 12;
    }

    timeSplited[0] = newHour > 9 ? newHour.toString() : '0' + newHour.toString();
    timeSplited[1] = newMin > 9 ? newMin.toString() : '0' + newMin.toString();
  },
  convertIntToString: function(number) {
    return number > 9 ? number.toString() : '0' + number.toString();
  }
});
