// Copyright 2020 salesforce.com, inc
// All rights reserved.
// SPDX-License-Identifier: BSD-3-Clause
// For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
({
  reloadData: function(component, event) {
    let recordList = component.get('v.recordList');
    let isHaveNoError = component.get('v.isHaveNoError');
    let recordTypes = component.get('v.recordTypes');

    if (isHaveNoError) {
      this.getColumnDefinitions(component, recordList);
      this.getObjectLabel(component);
      this.getRelationshipName(component);
      this.getTabStyle(component);

      if (recordTypes.length) {
        component.set('v.recordTypeId', recordTypes.some((rt) => rt.checked).value);
      }
    }
  },
  getColumnDefinitions: function(component, recordList) {
    let columns = [];
    let spinner = component.find('loadingSpinner');
    const imageMaxHeight = component.get('v.imageMaxHeight');
    const imageMaxWidth = component.get('v.imageMaxWidth');

    $A.util.removeClass(spinner, 'slds-hide');
    const enableRecordAction = component.get('v.enableRecordAction');
    // create a server side action.
    let action = component.get('c.getColumnInfo');

    action.setParams({
      objectName: component.get('v.objectName'),
      fields: component.get('v.fields')
    });

    // set a call back
    action.setCallback(this, function(a) {
      // store the response return value (wrapper class insatance)
      let result = a.getReturnValue();

      // set the component attributes value with wrapper class properties.
      if (result && a.getState() === 'SUCCESS') {
        let referFields = [];
        let addressFields = [];
        let uniqueFields = [];
        let currencyFields = [];
        let percentFields = [];
        let pickListFields = [];
        let timeZone = $A.get('$Locale.timezone');
        let shortTimeFormat = $A.get('$Locale.shortTimeFormat');
        let currency = $A.get('$Locale.currency');

        for (let i = 0; i < result.length; i++) {
          let column;

          //if data is reference then change type to url
          if (result[i].type.toLowerCase() == 'id' || result[i].type.toLowerCase() == 'reference') {
            if (result[i].referenceTo != 'RecordType') {
              result[i].type = 'url';
              referFields.push({
                originField: result[i].apiName,
                backgroundLink: 'refer' + result[i].typeAttribute.label.fieldName,
                displayField: result[i].typeAttribute.label.fieldName,
                referenceTo: result[i].referenceTo ? result[i].referenceTo : component.get('v.objectName')
              });
              result[i].apiName = 'refer' + result[i].typeAttribute.label.fieldName;
              //if data is address then change type to url and add background link to google map
              column = {
                label: result[i].label,
                fieldName: result[i].apiName,
                type: result[i].type.toLowerCase(),
                typeAttributes: result[i].typeAttribute,
                sortable: true
              };
            } else {
              referFields.push({
                originField: result[i].apiName,
                backgroundLink: 'refer' + result[i].typeAttribute.label.fieldName,
                displayField: result[i].typeAttribute.label.fieldName,
                referenceTo: result[i].referenceTo ? result[i].referenceTo : component.get('v.objectName')
              });
              result[i].type = 'text';
              //if data is address then change type to url and add background link to google map
              column = {
                label: result[i].label,
                fieldName: result[i].typeAttribute.label.fieldName,
                type: result[i].type.toLowerCase(),
                sortable: true
              };
            }
          } else if (result[i].type.toLowerCase() == 'address') {
            result[i].type = 'url';
            addressFields.push(result[i].apiName);

            let labelValue = { fieldName: result[i].apiName };
            let typeAttribute = { target: '_self', label: labelValue };

            result[i].typeAttribute = typeAttribute;
            result[i].apiName = 'refer' + result[i].apiName;

            column = {
              label: result[i].label,
              fieldName: result[i].apiName,
              type: result[i].type.toLowerCase(),
              typeAttributes: result[i].typeAttribute,
              sortable: true
            };
          } else if (result[i].type.toLowerCase() == 'unique') {
            result[i].type = 'url';
            uniqueFields.push(result[i].apiName);

            result[i].apiName = 'refer' + result[i].apiName;

            column = {
              label: result[i].label,
              fieldName: result[i].apiName,
              type: result[i].type.toLowerCase(),
              typeAttributes: result[i].typeAttribute,
              sortable: true
            };
          } else if (result[i].type.toLowerCase() === 'percent') {
            percentFields.push(result[i].apiName);

            result[i].apiName = 'per' + result[i].apiName;

            column = {
              label: result[i].label,
              fieldName: result[i].apiName,
              type: 'text',
              sortable: true
            };
          } else if (result[i].type.toLowerCase() == 'date') {
            result[i].type = 'date-local';

            let typeAttribute = {
              timeZone: timeZone,
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            };

            result[i].typeAttribute = typeAttribute;

            column = {
              label: result[i].label,
              fieldName: result[i].apiName,
              type: result[i].type.toLowerCase(),
              typeAttributes: result[i].typeAttribute,
              sortable: true
            };
          } else if (result[i].type.toLowerCase() == 'datetime') {
            result[i].type = 'date';

            let typeAttribute = {
              timeZone: timeZone,
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            };

            result[i].typeAttribute = typeAttribute;

            column = {
              label: result[i].label,
              fieldName: result[i].apiName,
              type: result[i].type.toLowerCase(),
              typeAttributes: result[i].typeAttribute,
              sortable: true
            };
          } else if (result[i].type.toLowerCase() == 'currency') {
            currencyFields.push(result[i].apiName);

            result[i].apiName = 'cur' + result[i].apiName;

            column = {
              label: result[i].label,
              fieldName: result[i].apiName,
              type: 'text',
              sortable: true
            };
          } else if (result[i].type.toLowerCase() == 'number') {
            let cellAttribute = { alignment: 'left' };

            column = {
              label: result[i].label,
              fieldName: result[i].apiName,
              type: result[i].type.toLowerCase(),
              typeAttributes: result[i].typeAttribute,
              sortable: true,
              cellAttributes: cellAttribute
            };
          } else if (result[i].type.toLowerCase() == 'action') {
            if (!enableRecordAction) {
              column = {
                type: 'action',
                typeAttributes: result[i].typeAttribute
              };
            }
          } else if (result[i].type.toLowerCase() === 'picklist') {
            pickListFields.push({ apiFieldName: result[i].apiName, picklistOptions: result[i].picklistOptions });

            result[i].apiName = 'pick' + result[i].apiName;

            column = {
              label: result[i].label,
              fieldName: result[i].apiName,
              type: result[i].type.toLowerCase(),
              sortable: true
            };
          } else if (result[i].type.toLowerCase() === 'boolean') {
            column = {
              label: result[i].label,
              fieldName: result[i].apiName,
              type: 'boolean',
              sortable: true
            };
          } else if (result[i].type.toLowerCase() === 'time') {
            recordList.forEach((record) => {
              if (record[result[i].apiName] || record[result[i].apiName] == 0) {
                let timeInSec = record[result[i].apiName] / 1000;
                let minutesInSec = timeInSec % 3600;
                let hoursInSec = timeInSec - minutesInSec;
                record['time' + result[i].apiName] = this.formatTime(hoursInSec / 3600, minutesInSec / 60, shortTimeFormat);
              }
            });

            column = {
              label: result[i].label,
              fieldName: 'time' + result[i].apiName,
              type: 'text',
              sortable: true
            };
          } else if (result[i].type.toLowerCase() == 'url') {
            result[i].type = 'url';

            let labelValue = { fieldName: result[i].apiName };
            let typeAttribute = { target: '_blank', label: labelValue };

            result[i].typeAttribute = typeAttribute;

            column = {
              label: result[i].label,
              fieldName: result[i].apiName,
              type: result[i].type.toLowerCase(),
              typeAttributes: result[i].typeAttribute,
              sortable: true
            };
          } else if (result[i].type == 'calculated') {
            column = {
              label: result[i].label,
              fieldName: result[i].apiName,
              type: 'datattableHtml',
              sortable: true,
              typeAttributes: {
                viewType: { fieldName: 'viewType' }
              }
            };
          } else {
            column = {
              label: result[i].label,
              fieldName: result[i].apiName,
              type: 'text',
              sortable: true
            };
          }

          if (column && Object.keys(column).length > 0) {
            columns.push(column);
          }
        }

        //Load data to display
        let upperLimit = recordList.length;
        let linksReferFieldsToFix = [];
        //for all refer field, add 2 more columns: 1 label + 1 background link
        for (let j = 0; j < referFields.length; j++) {
          let referField = referFields[j];

          for (let i = 0; i < upperLimit; i++) {
            if (recordList[i][referField.originField]) {
              //add column for background link
              linksReferFieldsToFix.push(this.fixLink(component, recordList[i][referField.originField], referField.referenceTo));
            }
          }
        }

        //for all address fields, add more compound fields
        for (let j = 0; j < addressFields.length; j++) {
          let addressField = addressFields[j];
          let city = addressField.replace('Address', 'City');
          let state = addressField.replace('Address', 'State');
          let country = addressField.replace('Address', 'Country');
          let postalCode = addressField.replace('Address', 'PostalCode');
          let street = addressField.replace('Address', 'Street');

          for (let i = 0; i < upperLimit; i++) {
            if (recordList[i][addressField]) {
              let cityStr = '';
              let stateStr = '';
              let countryStr = '';
              let postalCodeStr = '';
              let streetStr = '';

              if (recordList[i][city]) cityStr = recordList[i][city] + ', ';
              if (recordList[i][state]) stateStr = recordList[i][state] + ', ';
              if (recordList[i][country]) countryStr = recordList[i][country] + ', ';
              if (recordList[i][postalCode]) postalCodeStr = recordList[i][postalCode] + ', ';
              if (recordList[i][street]) streetStr = recordList[i][street] + ', ';

              recordList[i][addressField] = postalCodeStr + countryStr + stateStr + cityStr + streetStr;

              recordList[i]['refer' + addressField] = 'https://google.com/maps/search/' + postalCodeStr + countryStr + stateStr + cityStr + streetStr;
            }
          }
        }

        let linksUniqueFieldsToFixed = [];

        for (let j = 0; j < uniqueFields.length; j++) {
          for (let i = 0; i < upperLimit; i++) {
            //add column for background link
            linksUniqueFieldsToFixed.push(this.fixLink(component, recordList[i]['Id'], component.get('v.objectName')));
          }
        }

        //if there is unique field, then add referId column
        recordList.forEach(function(record) {
          percentFields.forEach(function(percentField) {
            record['per' + percentField] = record[percentField] != null ? record[percentField].toLocaleString('en-IE') + '%' : '';
          });
          currencyFields.forEach(function(currencyField) {
            record['cur' + currencyField] = record[currencyField] != null ? currency + record[currencyField].toLocaleString('en-IE') : '';
          });
          pickListFields.forEach(function(pickListField) {
            const originalValue = record[pickListField.apiFieldName];
            const option = pickListField.picklistOptions.find((opt) => opt.value === originalValue);

            if (option) {
              record['pick' + pickListField.apiFieldName] = option.label;
            }
          });
        });

        let that = this;

        //Set initial width
        Promise.all(linksUniqueFieldsToFixed)
          .then(
            $A.getCallback(function(urls) {
              for (let j = 0; j < uniqueFields.length; j++) {
                let uniqueField = uniqueFields[j];

                for (let i = 0; i < upperLimit; i++) {
                  //add column for background link
                  recordList[i]['refer' + uniqueField] = urls[i];
                }
              }

              return Promise.all(linksReferFieldsToFix);
            })
          )
          .then(
            $A.getCallback(function(urls) {
              let urlIndex = 0;

              for (let j = 0; j < referFields.length; j++) {
                let referField = referFields[j];
                for (let i = 0; i < upperLimit; i++) {
                  if (recordList[i][referField.originField]) {
                    //add column for background link
                    recordList[i][referField.backgroundLink] = urls[urlIndex++];

                    //add column for display field
                    let displayFields = referField.displayField.split('.');

                    if (displayFields.length == 1) {
                      recordList[i][referField.displayField] = recordList[i][displayFields[0]];
                    } else if (displayFields.length == 2) {
                      recordList[i][referField.displayField] = recordList[i][displayFields[0]][displayFields[1]];
                    }
                  }
                }
              }
            })
          )
          .then(
            $A.getCallback(function(result) {
              let dom = component.find('checkSizeBox').getElement();

              if (dom != null) {
                dom.classList.remove('slds-hide');
                let initWidthCols = that.getWidthCols(recordList, dom, columns, imageMaxWidth);
                dom.style.width = '100%';
                let widthBlank = dom.offsetWidth;
                dom.style.width = 'auto';
                that.setWidthColumns(columns, initWidthCols, dom, widthBlank, imageMaxWidth);
                dom.classList.add('slds-hide');
              }

              component.set('v.data', recordList);
              component.set('v.rawData', recordList);
              component.set('v.columns', columns);
            })
          );
      } else if (state === 'ERROR') {
        let errors = a.getError();
        console.error(errors);
      }

      $A.util.addClass(spinner, 'slds-hide');
    });

    // enqueue the action
    $A.enqueueAction(action);
  },

  getRelationshipName: function(component) {
    let action = component.get('c.getChildRelationshipName');

    action.setParams({
      childObject: component.get('v.objectName'),
      parentObject: component.get('v.parentObject'),
      parentField: component.get('v.parentField')
    });

    // set a call back
    action.setCallback(this, function(a) {
      // store the response return value (wrapper class insatance)
      let result = a.getReturnValue();

      // set the component attributes value with wrapper class properties.
      if (result && a.getState() === 'SUCCESS') {
        component.set('v.relationField', result);
      } else if (a.getState() === 'ERROR') {
        // Dung chỉnh sửa
        let errors = a.getError();
        console.error(errors);
      }
    });

    // enqueue the action
    $A.enqueueAction(action);
  },

  getObjectLabel: function(component) {
    let action = component.get('c.getObjectLabel');

    action.setParams({
      objectName: component.get('v.objectName')
    });

    // set a call back
    action.setCallback(this, function(a) {
      // store the response return value (wrapper class insatance)
      let result = a.getReturnValue();

      // set the component attributes value with wrapper class properties.
      if (result && a.getState() === 'SUCCESS') {
        let hasMoreRecord = component.get('v.hasMoreRecord');
        let dataList = component.get('v.recordList');

        let lblRecShow = hasMoreRecord ? dataList.length + '+' : dataList.length;
        let defaultObjectLabel = component.get('v.defaultLabel');

        if (defaultObjectLabel !== '') {
          component.set('v.title', '<span class="header-label">' + defaultObjectLabel + '</span><span class="count">(' + lblRecShow + ')</span>');
        } else {
          component.set('v.title', '<span class="header-label">' + result + '</span><span class="count">(' + lblRecShow + ')</span>');
        }

        component.set('v.titleStyleClass', '');
        component.set('v.objectLabel', result);
      } else if (state === 'ERROR') {
        let errors = a.getError();
        console.error(errors);
      }
    });

    // enqueue the action
    $A.enqueueAction(action);
  },

  getTabStyle: function(component) {
    let action = component.get('c.getTabStyle');

    action.setParams({
      objectName: component.get('v.objectName')
    });

    // set a call back
    action.setCallback(this, function(a) {
      // store the response return value (wrapper class insatance)
      let result = a.getReturnValue();

      if (result == '') {
        result = 'standard:custom';
      }

      // set the component attributes value with wrapper class properties.
      if (result && a.getState() === 'SUCCESS') {
        const iconData = result.split(':');
        component.set('v.iconCategory', iconData[0]);
        component.set('v.iconPattern', iconData[1]);
        component.set('v.iconName', result);
      } else if (state === 'ERROR') {
        let errors = a.getError();
        console.error(errors);
      }
    });

    // enqueue the action
    $A.enqueueAction(action);
  },
  handleEditRow: function(component, event) {
    let recordId = component.get('v.selectedRowId');
    let editRecordEvent = $A.get('e.force:editRecord');

    editRecordEvent.setParams({
      recordId: recordId
    });

    editRecordEvent.fire();
  },
  handleDeleteRow: function(component) {
    let recordId = component.get('v.selectedRowId');
    let action = component.get('c.deleteRelatedRecord');

    action.setParams({
      recordId: recordId
    });

    // set a call back
    action.setCallback(this, function(a) {
      // store the response return value (wrapper class insatance)
      let result = a.getReturnValue();
      // set the component attributes value with wrapper class properties.
      if (result && a.getState() === 'SUCCESS') {
        let compEvent = component.getEvent('refreshRecordList');

        compEvent.setParams({
          parentField: component.get('v.parentField'),
          type: 'refresh'
        });

        compEvent.fire();
      } else if (state === 'ERROR') {
        let errors = a.getError();
        console.error(errors);
      }
    });

    // enqueue the action
    $A.enqueueAction(action);
  },
  getWidthCols: function(records, dom, columns, imageMaxWidth) {
    let widthCols = {};
    let widthCurrentField = 0;

    records.forEach((record) => {
      for (let field in record) {
        if (typeof record[field] != 'object') {
          let col = columns.filter((item) => {
            return item.fieldName == field;
          });
          widthCurrentField = this.getWidthTextOnDOM(dom, record[field], col && col[0] && col[0].typeAttributes, imageMaxWidth);

          if (widthCols[field]) {
            widthCols[field] = widthCurrentField > widthCols[field] ? widthCurrentField : widthCols[field];
          } else {
            widthCols[field] = widthCurrentField;
          }
        }
      }
    });

    return widthCols;
  },
  setWidthColumns: function(cols, widthCols, dom, widthBlank, imageMaxWidth) {
    let fieldCompared = '';
    let widthLable = 0;

    cols.forEach((col) => {
      fieldCompared = col.typeAttributes && col.typeAttributes.label ? col.typeAttributes.label.fieldName : col.fieldName;
      widthLable = this.getWidthTextOnDOM(dom, col.label, col.typeAttributes, imageMaxWidth);

      if (widthCols[fieldCompared]) {
        col.initialWidth = widthLable > widthCols[fieldCompared] ? widthLable : widthCols[fieldCompared];
      } else {
        col.initialWidth = widthLable;
      }

      widthBlank -= col.initialWidth;
    });

    if (widthBlank > 0) {
      cols[cols.length - 2].initialWidth = null;
    }
  },
  getWidthTextOnDOM: function(dom, text, fieldCompared, imageMaxWidth) {
    let offsetMargin = 0;
    dom.innerHTML = text;

    //Case Calcurated
    if (fieldCompared && fieldCompared.viewType && imageMaxWidth) {
      dom.style.maxWidth = imageMaxWidth;
    } else {
      offsetMargin = 50;
    }

    return dom.offsetWidth + offsetMargin;
  },
  fixLink: function(component, recordId, objectName) {
    let navService = component.find('navService');

    // Sets the route to /lightning/o/Account/home
    let pageReference = {
      type: 'standard__recordPage',
      attributes: {
        objectApiName: objectName,
        actionName: 'view',
        recordId: recordId
      }
    };

    component.set('v.pageReference', pageReference);

    // Set the URL on the link or use the default if there's an error
    return navService.generateUrl(pageReference);
  },
  formatTime: function(hours, minutes, format) {
    if (format.includes('a')) {
      let suffix = hours < 11 ? 'AM' : 'PM';

      if (hours > 12) {
        hours = hours - 12;
      } else if (hours == 0) {
        hours = 12;
      }

      return `${this.convertIntToString(hours)}:${this.convertIntToString(minutes)} ${suffix}`;
    }
    return `${this.convertIntToString(hours)}:${this.convertIntToString(minutes)}`;
  },
  convertIntToString: function(number) {
    return number > 9 ? number.toString() : '0' + number.toString();
  }
});
