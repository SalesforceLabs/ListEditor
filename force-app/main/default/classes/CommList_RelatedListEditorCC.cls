// Copyright 2020 salesforce.com, inc
// All rights reserved.
// SPDX-License-Identifier: BSD-3-Clause
// For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause

/**
 * CommList_RelatedListEditorCC
 * @version 1.0
 * @Description: Handling list editor
 */
public with sharing class CommList_RelatedListEditorCC {
  /**
   * Get prefix of the target object
   * @param  Schema.SobjectField
   * @return GetRecordListResult
   */
  @AuraEnabled
  public static String getOrderFieldWithPrefix(String objectName) {
    Map<String, Schema.SObjectType> schemaMap = Schema.getGlobalDescribe();
    Schema.SObjectType leadSchema = schemaMap.get(objectName);

    if (leadSchema == null) {
      return '';
    }

    Map<String, Schema.SObjectField> fieldMap = leadSchema.getDescribe()
      .fields.getMap();
    String iterateFieldName = '';
    String prefixOrderField = '';

    for (Schema.SobjectField strFldObj : fieldMap.values()) {
      iterateFieldName = strFldObj.getDescribe().getName();

      if (iterateFieldName.endsWithIgnoreCase('LE_Order__c')) {
        prefixOrderField = iterateFieldName;
        break;
      }
    }

    return prefixOrderField;
  }

  /**
   * Checking the unique fields
   * @param  Schema.SobjectField
   * @return Boolean
   */
  private static Boolean isUniqueField(Schema.SobjectField objField) {
    return (objField.getDescribe().isNameField() ||
    objField.getDescribe().isAutoNumber() ||
    objField.getDescribe().isUnique());
  }

  /**
   * Get list data record for showing the screen
   * @param  Schema.SobjectField
   * @return GetRecordListResult
   */
  @AuraEnabled
  public static GetRecordListResult getRecordList(
    String objectName,
    String fields,
    String limitRecs,
    String recordId,
    String parentField,
    String offset,
    String filter,
    String searchText,
    Boolean isOrderDESC,
    String orderField
  ) {
    List<ColumnInfo> parentFieldList = new List<ColumnInfo>();
    String sObjectName = String.escapeSingleQuotes(objectName);
    String tObjectName = String.escapeSingleQuotes(objectName);
    Schema.DescribeSObjectResult dsr = Schema.getGlobalDescribe()
      .get(sObjectName)
      .getDescribe();
    Map<String, Schema.SObjectField> fieldMap = dsr.fields.getMap();
    String orderName = '';
    String firstParent;
    Boolean parentMatched = false;
    Boolean hasParsonalAccount = (sObjectName.equalsIgnoreCase('account') &&
    fieldMap.get('LastName') != null);
    String relationRegExp = '__c$';

    if (!String.isEmpty(recordId)) {
      sObjectName = ((Id) recordId).getSObjectType().getDescribe().getName();
    }

    String caseField;
    GetRecordListResult result = new GetRecordListResult();
    result.objectName = dsr.getName();

    if (fields.containsIgnoreCase('recordtypeid')) {
      fields = checkAndRemoveInvalidRecordType(fields, dsr);
    }

    for (Schema.SobjectField strFld : fieldMap.values()) {
      if (
        strFld.getDescribe().getType() == Schema.DisplayType.ENCRYPTEDSTRING
      ) {
        result.encryptedFields.add(strFld.getDescribe().getName());
      }

      if (strFld.getDescribe().getType() == Schema.DisplayType.REFERENCE) {
        //browse all posibilities of refer object
        for (
          Schema.SObjectType reference : strFld.getDescribe().getReferenceTo()
        ) {
          String referObject = reference.getDescribe().getName();

          if (fields.containsIgnoreCase(strFld.getDescribe().getName())) {
            String extraField;

            if (referObject == 'Case') {
              extraField =
                strFld.getDescribe()
                  .getName()
                  .removeEnd('Id')
                  .replaceFirst(relationRegExp, '__r') +
                '.Subject' +
                ', ' +
                strFld.getDescribe()
                  .getName()
                  .removeEnd('Id')
                  .replaceFirst(relationRegExp, '__r') +
                '.CaseNumber';
              caseField = strFld.getDescribe()
                .getName()
                .removeEnd('Id')
                .replaceFirst(relationRegExp, '__r');
            } else if (referObject == 'ContentDocument') {
              extraField =
                strFld.getDescribe()
                  .getName()
                  .removeEnd('Id')
                  .replaceFirst(relationRegExp, '__r') + '.Title';
            } else {
              extraField =
                strFld.getDescribe()
                  .getName()
                  .removeEnd('Id')
                  .replaceFirst(relationRegExp, '__r') + '.Name';
            }

            if (extraField != null && !fields.containsIgnoreCase(extraField)) {
              fields += (', ' + extraField);
            }
          }

          if (referObject.equalsIgnoreCase(sObjectName)) {
            parentFieldList.add(
              new ColumnInfo(
                strFld.getDescribe().getName(),
                null,
                strFld.getDescribe().getLabel()
              )
            );

            if (String.isBlank(firstParent)) {
              firstParent = strFld.getDescribe().getName();
            }

            if (strFld.getDescribe().getName().equalsIgnoreCase(parentField)) {
              parentMatched = true;
            }
          }
        }
      } else if (strFld.getDescribe().getType() == Schema.DisplayType.ADDRESS) {
        if (fields.containsIgnoreCase(strFld.getDescribe().getName())) {
          String addressField = strFld.getDescribe()
            .getName()
            .removeEnd('Address');
          fields += (', ' + addressField + 'City');
          fields += (', ' + addressField + 'State');
          fields += (', ' + addressField + 'Country');
          fields += (', ' + addressField + 'PostalCode');
          fields += (', ' + addressField + 'Street');
          fields += (', ' + addressField + 'Latitude');
          fields += (', ' + addressField + 'Longitude');
        }
      } else if (
        strFld.getDescribe().getType() == Schema.DisplayType.LOCATION
      ) {
        if (fields.containsIgnoreCase(strFld.getDescribe().getName())) {
          LocationField fieldLocation = new LocationField(
            strFld.getDescribe().getName()
          );
          fields = fields.replace(
            fieldLocation.fieldApi,
            fieldLocation.fieldDetail
          );
          result.fieldsLocation.add(fieldLocation);
        }
      } else if (
        (('account'.equalsIgnoreCase(tObjectName) && hasParsonalAccount) ||
        'contact'.equalsIgnoreCase(tObjectName) ||
        'lead'.equalsIgnoreCase(tObjectName)) &&
        'name'.endsWithIgnoreCase(strFld.getDescribe().getName())
      ) {
        fields += (', FirstName, LastName');
      } else if (
        strFld.getDescribe().getName().containsIgnoreCase('LE_Order__c')
      ) {
        orderName = strFld.getDescribe().getName();

        if (!fields.containsIgnoreCase('LE_Order__c'))
          fields += (', ' + orderName);

        result.hasLEOrderField = true;
        result.orderFieldAPI = orderName;
      }
    }

    if (!parentMatched) {
      parentField = firstParent;
    }

    // Creating the query.
    String query;

    if (!String.isBlank(orderField)) {
      orderName = orderField;
    }

    String order = isOrderDESC == true
      ? ' DESC NULLS LAST'
      : ' ASC NULLS FIRST';
    String strOrder = String.isBlank(orderName)
      ? ' ORDER BY LastModifiedDate' + order
      : ' ORDER BY ' + String.escapeSingleQuotes(orderName) + order + ', LastModifiedDate DESC ';

    String strFilter = replaceQueryFilter(filter);
    Integer recLimit = Integer.valueOf(limitRecs);

    Set<String> fieldsAsSet = new Set<String>(fields.split(','));

    String searchWhere = '';

    if (searchText != null && !searchText.equals('')) {
      SObjectType objectTypeData = ((SObject) (Type.forName(
            'Schema.' + tObjectName
          )
          .newInstance()))
        .getSObjectType();
      DescribeSObjectResult objectDescribeData = objectTypeData.getDescribe();

      Pattern p = Pattern.compile('(?i).*(id|address|latitude|longitude)$');

      Integer count = 0;
      searchWhere += '(';

      for (String field : fieldsAsSet) {
        if (!p.matcher(field.toLowerCase().trim()).matches()) {
          Schema.DisplayType feildType;

          if (field.containsIgnoreCase('.')) {
            List<String> splitName = field.split('\\.');
            String relationObjName = (String) splitName[0];
            String relationFldName = (String) splitName[1];

            if (relationObjName.toLowerCase().trim().equals('owner')) {
              relationObjName = 'User';
            }

            try {
              SObjectType relationObjectTypeData = ((SObject) (Type.forName(
                    'Schema.' + relationObjName.trim()
                  )
                  .newInstance()))
                .getSObjectType();
              DescribeSObjectResult relationObjectDescribeData = relationObjectTypeData.getDescribe();
              feildType = relationObjectDescribeData.fields.getMap()
                .get(relationFldName.trim())
                .getDescribe()
                .getType();
            } catch (Exception e) {
              feildType = Schema.DisplayType.String;
            }
          } else {
            feildType = objectDescribeData.fields.getMap()
              .get(field.trim())
              .getDescribe()
              .getType();
          }

          String escapeSearchText = String.escapeSingleQuotes(
            searchText.replace('%', '\\%').replace('_', '\\_')
          );
          if (
            feildType == Schema.DisplayType.String ||
            feildType == Schema.DisplayType.Email ||
            feildType == Schema.DisplayType.Phone ||
            feildType == Schema.DisplayType.Picklist ||
            feildType == Schema.DisplayType.Combobox ||
            feildType == Schema.DisplayType.URL
          ) {
            searchWhere += field + ' LIKE \'%' + escapeSearchText + '%\'';
            searchWhere += ' OR ';
          } else if (feildType == Schema.DisplayType.multipicklist) {
            searchWhere += field + ' INCLUDES(\'' + escapeSearchText + '\')';
            searchWhere += ' OR ';
          }
        }

        count++;
      }

      searchWhere = searchWhere.replaceAll(' OR $', '');
      searchWhere += ')';
    }

    String searchWhereJoin = '';

    if (
      sObjectName.equalsIgnoreCase('Contact') &&
      parentField == 'ContactId' &&
      (tObjectName.equalsIgnoreCase('Opportunity') ||
      tObjectName.equalsIgnoreCase('Contract'))
    ) {
      String relateField;

      if (tObjectName.equalsIgnoreCase('opportunity')) {
        relateField = 'OpportunityId';
      } else if (tObjectName.equalsIgnoreCase('contract')) {
        relateField = 'ContractId';
      }

      String contactWhere = '';

      if (!String.isEmpty(recordId)) {
        contactWhere +=
          ' WHERE Id IN (SELECT ' +
          relateField +
          ' FROM ' +
          tObjectName +
          'ContactRole WHERE ContactId = \'' +
          String.escapeSingleQuotes(recordId) +
          '\')';
        searchWhereJoin = searchWhere.equals('') ? '' : ' AND ' + searchWhere;
      } else if (!String.isEmpty(strFilter)) {
        strFilter = strFilter.replaceAll('^(\\s+)AND', ' WHERE ');
        searchWhereJoin = searchWhere.equals('') ? '' : ' AND ' + searchWhere;
      }

      if (!searchWhere.equals('') && searchWhereJoin.equals('')) {
        searchWhereJoin = ' WHERE ' + searchWhere;
      }

      query =
        'SELECT ' +
        fields +
        ' FROM ' +
        tObjectName +
        ' ' +
        contactWhere +
        strFilter +
        searchWhereJoin +
        strOrder +
        ' LIMIT ' +
        (recLimit + 1) +
        ' OFFSET ' +
        String.escapeSingleQuotes(offset);
    } else {
      String SoqlWhere = '';
      String IdField = 'Id';

      if (!String.isEmpty(parentField)) {
        IdField = parentField;
      }

      if (!String.isEmpty(recordId)) {
        SoqlWhere +=
          ' WHERE ' +
          String.escapeSingleQuotes(IdField) +
          ' = \'' +
          String.escapeSingleQuotes(recordId) +
          '\'';
        searchWhereJoin = searchWhere.equals('') ? '' : ' AND ' + searchWhere;
      } else if (!String.isEmpty(strFilter)) {
        strFilter = strFilter.replaceAll('^(\\s+)AND', ' WHERE ');
        searchWhereJoin = searchWhere.equals('') ? '' : ' AND ' + searchWhere;
      }

      if (!searchWhere.equals('') && searchWhereJoin.equals('')) {
        searchWhereJoin = ' WHERE ' + searchWhere;
      }

      query =
        'SELECT ' +
        fields +
        ' FROM ' +
        tObjectName +
        ' ' +
        SoqlWhere +
        strFilter +
        searchWhereJoin +
        strOrder +
        ' LIMIT ' +
        (recLimit + 1) +
        ' OFFSET ' +
        String.escapeSingleQuotes(offset);
    }

    if (String.isBlank(query)) {
      return null;
    }

    //System.debug('query: ' + query);

    List<SObject> records = Database.query(query);

    // Adding for checking exist more record
    if (records.size() > recLimit) {
      result.hasMoreRecord = true;
      records.remove(records.size() - 1);
    } else {
      result.hasMoreRecord = false;
    }

    if (!result.encryptedFields.isEmpty()) {
      records = hideEncryptedField(records, result.encryptedFields);
    }

    // Get record tpye
    Schema.RecordTypeInfo masterRt;

    for (Schema.RecordTypeInfo rt : dsr.getRecordTypeInfos()) {
      if (rt.isAvailable() && rt.isActive() && !rt.isMaster()) {
        Map<String, Object> recordType = new Map<String, Object>();
        recordType.put('label', rt.getName());
        recordType.put('value', rt.getRecordTypeId());
        recordType.put('checked', rt.isDefaultRecordTypeMapping());
        recordType.put('default', rt.isDefaultRecordTypeMapping());
        result.recordTypes.add(recordType);
      } else if (rt.isMaster()) {
        masterRt = rt;
      }
    }

    if (result.recordTypes.isEmpty() && masterRt != null) {
      Map<String, Object> recordType = new Map<String, Object>();
      recordType.put('label', masterRt.getName());
      recordType.put('value', masterRt.getRecordTypeId());
      recordType.put('checked', true);
      recordType.put('default', true);
      result.recordTypes.add(recordType);
    }

    result.sObjectName = sObjectName;
    result.records = records;
    result.parentFieldList = parentFieldList;
    result.parentField = parentField;
    result.caseField = caseField;

    return result;
  }

  private static List<Sobject> hideEncryptedField(
    List<Sobject> records,
    List<String> listEncryptedField
  ) {
    for (sObject obj : records) {
      for (String encryptedField : listEncryptedField) {
        if (obj.isSet(encryptedField)) {
          String currentValue = String.valueOf(obj.get(encryptedField));

          if (String.isNotBlank(currentValue)) {
            String newValue = '';
            Integer i = 0;

            while (i < currentValue.length()) {
              newValue += '*';
              i++;
            }

            obj.put(encryptedField, newValue);
          }
        }
      }
    }

    return records;
  }
  private static String replaceQueryFilter(String filter) {
    if (String.isBlank(filter)) {
      return '';
    }
    return ' AND ' + String.escapeSingleQuotes(filter).replace('"', '\'') + ' ';
  }
  private static String checkAndRemoveInvalidRecordType(
    String fields,
    Schema.DescribeSObjectResult dsr
  ) {
    Boolean shouldRemoveRecordType = true;

    for (Schema.RecordTypeInfo rti : dsr.getRecordTypeInfos()) {
      if (rti.isActive() && !rti.isMaster()) {
        shouldRemoveRecordType = false;
        break;
      }
    }

    if (shouldRemoveRecordType) {
      Set<String> fieldsAsSet = new Set<String>(fields.split(','));

      for (String field : fieldsAsSet) {
        if (field.toLowerCase().trim() == 'recordtypeid') {
          fieldsAsSet.remove(field);
        }
      }

      return String.join(new List<String>(fieldsAsSet), ',');
    }

    return fields;
  }

  /**
   * Deleted the related record
   * @param  String
   * @return String
   */
  @AuraEnabled
  public static String deleteRelatedRecord(String recordId) {
    try {
      Database.delete(Id.valueOf(recordId));
      return 'successfully deleted';
    } catch (Exception ex) {
      return ex.getMessage();
    }
  }

  @AuraEnabled
  public static Map<String, Object> getMapDefaultValue(String objName) {
    Map<String, Object> result = new Map<String, Object>();
    sObject sObj = Schema.getGlobalDescribe()
      .get(objName)
      .newSObject(null, true);
    Schema.SObjectType sobjectTypeSchema = Schema.getGlobalDescribe()
      .get(objName);
    Map<String, Schema.SObjectField> fieldMap = sobjectTypeSchema.getDescribe()
      .fields.getMap();

    for (String fieldName : fieldMap.keySet()) {
      Object defaultValue = sObj.get(fieldName);
      Schema.SObjectField field = fieldMap.get(fieldName);
      String fieldType = field.getDescribe().getType().name();

      if (
        defaultValue == null ||
        field == null ||
        fieldType == 'REFERENCE' ||
        fieldType == 'ID' ||
        !field.getDescribe().isUpdateable() ||
        !field.getDescribe().isAccessible()
      ) {
        continue;
      }

      if (fieldType == 'TIME') {
        Integer currentTimezone = (integer) getOffsetCurrentTimezone();
        Time defaultTime = (Time) defaultValue;
        defaultTime = Time.newInstance(
          defaultTime.hour(),
          defaultTime.minute(),
          0,
          0
        );
        defaultTime = defaultTime.addMilliseconds(currentTimezone);
        result.put(fieldName.toLowerCase(), defaultTime);
      } else {
        result.put(fieldName.toLowerCase(), defaultValue);
      }
    }

    return result;
  }

  private static Long getOffsetCurrentTimezone() {
    TimeZone tz = UserInfo.getTimeZone();
    DateTime now = DateTime.now();
    Long offset = tz.getOffset(now);
    return offset;
  }

  /**
   * Get infor of ther related object
   * @param  string sObjectName, string objectName, string showFields, string parentField
   * @return DataRelatedObject
   */
  @AuraEnabled
  public static DataRelatedObject getRelatedList(
    string sObjectName,
    string objectName,
    string showFields,
    string parentField
  ) {
    DataRelatedObject tarGetDataRelated = new DataRelatedObject();

    // Setting data for each fields/columns
    Schema.DescribeSObjectResult objSchemaDescribe = Schema.getGlobalDescribe()
      .get(objectName)
      .getDescribe();
    List<ColumnInfoDetail> lstObjectFields = new List<ColumnInfoDetail>();
    Map<String, Schema.SObjectField> fieldMap = objSchemaDescribe.fields.getMap();
    List<String> lstAvailableFields = new List<String>();
    showFields = checkAndRemoveInvalidRecordType(
      showFields.replace(' ', ''),
      objSchemaDescribe
    );
    List<String> lstShowFields = showFields.split(',');
    Map<String, Object> mapDefaultValue = getMapDefaultValue(objectName);

    // Appending some extra fields
    lstShowFields = settingShowFields(lstShowFields, fieldMap, objectName);

    ColumnInfoDetail col;

    for (String strField : lstShowFields) {
      Schema.SObjectField field = fieldMap.get(strField);

      if (field != null) {
        Schema.DescribeFieldResult fieldDescribe = field.getDescribe();

        if (
          !fieldDescribe.isNillable() &&
          fieldDescribe.getType() != Schema.DisplayType.Boolean
        ) {
          tarGetDataRelated.requiredFields.add(fieldDescribe.getName());
        }

        col = new ColumnInfoDetail();
        col.fieldApiName = fieldDescribe.getName();
        lstAvailableFields.add(col.fieldApiName);
        col.fieldName = fieldDescribe.getLabel();
        col.defaultValue = mapDefaultValue.get(col.fieldApiName.toLowerCase());
        col.fieldType = fieldDescribe.getType().name();

        if (col.fieldType == 'PICKLIST' || col.fieldType == 'MULTIPICKLIST') {
          if (fieldDescribe.isDependentPicklist()) {
            Schema.DescribeFieldResult controlFieldDescribe = fieldDescribe.getController()
              .getDescribe();
            col.controlFieldName = controlFieldDescribe.getName();
            col.picklistDependencyOptions = CommList_PicklistService.getDependencyPicklistOptions(
              controlFieldDescribe,
              fieldDescribe.getPicklistValues()
            );
          } else {
            List<CommList_PicklistOption> options = CommList_PicklistService.getPicklistOptions(
              fieldDescribe.getPicklistValues()
            );
            col.picklistOptions.addAll(options);
          }
        }

        // Getting reference name
        if (col.fieldType == 'REFERENCE') {
          Relationship relationship = new Relationship(
            fieldDescribe.getRelationshipName()
          );

          for (Schema.SObjectType reference : fieldDescribe.getReferenceTo()) {
            relationship.objects.add(reference.getDescribe().getName());
          }

          col.relationship = relationship;
        }

        col.isVisible = true;
        col.isCalculated = fieldDescribe.isCalculated();
        col.isUpdateable = fieldDescribe.isUpdateable();
        col.isCreateable = fieldDescribe.isCreateable();

        if (col.isCalculated) {
          col.fieldType = 'CALCULATED';
        }

        col.htmlInputType = new HtmlInputType(
          col.fieldType,
          fieldDescribe.getScale()
        );

        lstObjectFields.add(col);
      } else {
        col.isVisible = false;
      }

      // Adding for product2Id
      if (col.fieldApiName.equalsIgnoreCase('Product2Id')) {
        col.UpdateableOnlyOnCreate = true;
      }
    }

    // Setting extra infor for show
    tarGetDataRelated.lstObjectFields = lstObjectFields;
    tarGetDataRelated.lstShowFieldsName = lstShowFields;
    tarGetDataRelated.lstExtraFields = CommList_RelatedListEditorCC.getExtraFields(
      sObjectName,
      objectName,
      lstAvailableFields,
      parentField
    );
    tarGetDataRelated.labelName = CommList_RelatedListEditorCC.getObjectLabel(
      objectName
    );
    tarGetDataRelated.isRowCreateable = objSchemaDescribe.isCreateable();
    tarGetDataRelated.isRowDeleteable = objSchemaDescribe.isDeletable();
    tarGetDataRelated.defaultRecordTypeId = getDefaultRecordTypeId(
      objSchemaDescribe
    );
    String strTabStyle = CommList_RelatedListEditorCC.getTabStyle(objectName);
    tarGetDataRelated.tabStyle = String.isBlank(strTabStyle)
      ? 'standard:custom'
      : strTabStyle;

    return tarGetDataRelated;
  }

  private static String getDefaultRecordTypeId(
    Schema.DescribeSObjectResult dsr
  ) {
    for (Schema.RecordTypeInfo rti : dsr.getRecordTypeInfos()) {
      if (rti.isDefaultRecordTypeMapping() && !rti.isMaster()) {
        return rti.getRecordTypeId();
      }
    }
    return '';
  }

  /**
   * Get infor of extra fields that Using for creating new record or clone data.
   * @param  String parentObejct, String childObject, List<String> lstStrFields, String parentField
   * @return List<String>
   */
  @TestVisible
  private static List<String> getExtraFields(
    String parentObejct,
    String childObject,
    List<String> lstStrFields,
    String parentField
  ) {
    List<String> lstExtra = new List<String>();

    if (!lstStrFields.contains('Id')) {
      lstExtra.add('Id');
    }

    if (String.isBlank(parentField)) {
      Map<String, Schema.SObjectType> schemaMap = Schema.getGlobalDescribe();
      Schema.SObjectType objSchema = schemaMap.get(childObject);
      Map<String, Schema.SObjectField> fieldMap = objSchema.getDescribe()
        .fields.getMap();

      for (String field : fieldMap.keySet()) {
        if (
          fieldMap.get(field).getDescribe().getType() ==
          Schema.DisplayType.REFERENCE
        ) {
          for (
            Schema.SObjectType reference : fieldMap.get(field)
              .getDescribe()
              .getReferenceTo()
          ) {
            if (
              parentObejct.equals(reference.getDescribe().getName()) &&
              String.isBlank(parentField)
            ) {
              parentField = fieldMap.get(field).getDescribe().getName();
              lstExtra.add(parentField);
            }
          }
        }
      }
    } else {
      lstExtra.add(parentField);
    }

    return lstExtra;
  }

  /**
   * Add more compound fields.
   * @param  List<String> lstShowFieldsSetting, Map<String, Schema.SObjectField> fieldMap, String objectName
   * @return void
   */
  @TestVisible
  private static List<String> settingShowFields(
    List<String> lstShowFieldsSetting,
    Map<String, Schema.SObjectField> fieldMap,
    String objectName
  ) {
    Set<String> setNotEmpty = new Set<String>(lstShowFieldsSetting);
    Boolean hasParsonalAccount = (objectName.equalsIgnoreCase('account') &&
    fieldMap.get('LastName') != null);

    // remove blanks and nulls
    setNotEmpty.remove('');
    setNotEmpty.remove(null);

    // convert back to list
    lstShowFieldsSetting = new List<String>(setNotEmpty);
    List<String> lstLowerCase = new List<String>();

    for (String strField : lstShowFieldsSetting) {
      lstLowerCase.add(strField.toLowerCase());
    }

    List<Integer> lstPosDelField = new List<Integer>();

    for (String field : lstShowFieldsSetting) {
      String compoundFieldNm = fieldMap.get(field)
        .getDescribe()
        .compoundfieldname;

      if (
        String.isNotBlank(compoundFieldNm) &&
        lstLowerCase.indexOf(compoundFieldNm.toLowerCase()) > -1
      ) {
        if (
          !(objectName.equalsIgnoreCase('account') &&
          field.equalsIgnoreCase('name'))
        ) {
          lstPosDelField.add(lstShowFieldsSetting.indexOf(field));
        }
      }
    }

    // This function always results in asc order.
    lstPosDelField.sort();

    for (Integer i = lstPosDelField.size() - 1; i >= 0; i--) {
      lstShowFieldsSetting.remove(lstPosDelField[i]);
    }

    // Showing the compound field
    Map<Integer, List<String>> mapPosAddField = new Map<Integer, List<String>>();

    for (String field : lstShowFieldsSetting) {
      // With the special case, that's Contact object. The Name field is a compound field. So Expanding it.
      if (
        ('contact'.equalsIgnoreCase(objectName) ||
        'lead'.equalsIgnoreCase(objectName)) && 'name'.equalsIgnoreCase(field)
      ) {
        mapPosAddField.put(
          lstShowFieldsSetting.indexOf(field),
          new List<String>{ 'FirstName', 'LastName' }
        );
      }

      if (
        hasParsonalAccount &&
        ('account'.equalsIgnoreCase(objectName)) &&
        'name'.equalsIgnoreCase(field)
      ) {
        mapPosAddField.put(
          lstShowFieldsSetting.indexOf(field),
          new List<String>{ 'Name', 'FirstName', 'LastName' }
        );
      }

      // With the compound field with type address. Expand them too.
      if (
        'address'
          .equalsIgnoreCase(fieldMap.get(field).getDescribe().type.name())
      ) {
        String addressPre = field.removeEndIgnoreCase('address');
        mapPosAddField.put(
          lstShowFieldsSetting.indexOf(field),
          new List<String>{
            addressPre + 'City',
            addressPre + 'State',
            addressPre + 'Country',
            addressPre + 'PostalCode',
            addressPre + 'Street'
          }
        );
      }
    }

    // With the expanding field, just add return to list fields.
    Integer numberPadding = 0;

    for (Integer posAdd : mapPosAddField.keySet()) {
      for (String str : mapPosAddField.get(posAdd)) {
        lstShowFieldsSetting.add(posAdd + numberPadding, str);
      }

      lstShowFieldsSetting.remove(
        posAdd +
        numberPadding +
        mapPosAddField.get(posAdd).size()
      );
      numberPadding = numberPadding + mapPosAddField.get(posAdd).size() - 1;
    }

    return lstShowFieldsSetting;
  }

  /**
   * Saving multiple records with multiple action
   * @param  string sObjectName, string objectName, list<SObject> toInsert, list<SObject> toUpdate,list<SObject> toDelete, String recordId, String parentField, List<String> lstShowField
   * @return SaveTableResult
   */
  @AuraEnabled
  public static SaveTableResult saveRecords(
    string sObjectName,
    string objectName,
    list<SObject> toInsert,
    list<SObject> toUpdate,
    list<SObject> toDelete,
    String recordId,
    String parentField,
    List<String> lstShowField
  ) {
    SaveTableResult tableResult = new SaveTableResult();

    try {
      Integer index = 0;

      // With the action updating records
      if (!checkFLS(lstShowField, FLSType.UPDATE_OBJECT, objectName)) {
        for (Integer i = 0; i < toUpdate.size(); i++) {
          tableResult.updateResults.add(
            new DMLResult(
              toUpdate[i].Id,
              false,
              System.Label.CommList_RelatedListEditorCCUpdateError
            )
          );
        }
      } else {
        // get Encrypted Field
        List<String> listEncryptedField = new List<String>();
        Map<String, Schema.SObjectField> fieldMap = Schema.getGlobalDescribe()
          .get(objectName)
          .getDescribe()
          .fields.getMap();

        for (String fieldName : lstShowField) {
          Schema.SobjectField strFld = fieldMap.get(fieldName.toLowerCase());
          if (
            strFld != null &&
            strFld.getDescribe().getType() == Schema.DisplayType.ENCRYPTEDSTRING
          ) {
            listEncryptedField.add(
              strFld.getDescribe().getName().toLowerCase()
            );
          }
        }

        if (listEncryptedField.size() > 0) {
          //get all record id
          List<String> listId = new List<String>();

          for (sObject obj : toUpdate) {
            listId.add(String.valueOf(obj.get('Id')));
          }

          //build query
          Map<Id, SObject> mapOldRecord = new Map<Id, SObject>(
            Database.query(
              'SELECT Id,' +
              String.join(listEncryptedField, ',') +
              ' FROM ' +
              String.escapeSingleQuotes(objectName) +
              ' WHERE Id IN :listId '
            )
          );

          for (sObject obj : toUpdate) {
            Map<String, Object> fieldsToValue = obj.getPopulatedFieldsAsMap();
            String objId = String.valueOf(obj.get('Id'));
            obj.clear();

            for (String key : fieldsToValue.keyset()) {
              if (listEncryptedField.contains(key.toLowerCase())) {
                String sValue = String.valueOf(fieldsToValue.get(key));

                if (
                  mapOldRecord.get(objId).get(key) != null &&
                  sValue.countMatches('*') ==
                  String.valueOf(mapOldRecord.get(objId).get(key)).length()
                ) {
                  continue;
                }
              }

              obj.put(key, fieldsToValue.get(key));
            }
          }
        }
        // With the action updating records
        Database.SaveResult[] updateResult = Database.update(toUpdate, false);

        for (Database.SaveResult sr : updateResult) {
          tableResult.updateResults.add(
            new DMLResult(toUpdate[index].Id, sr.isSuccess(), sr.getErrors())
          );
          index++;
        }
      }

      // With the action inserting records
      index = 0;

      if (!checkFLS(lstShowField, FLSType.CREATE_OBJECT, objectName)) {
        for (Integer i = 0; i < toInsert.size(); i++) {
          tableResult.insertResults.add(
            new DMLResult(
              toInsert[i].Id,
              false,
              System.Label.CommList_RelatedListEditorCCCreateError
            )
          );
        }
      } else {
        // With the action inserting records
        Database.SaveResult[] insertResult = Database.insert(toInsert, false);

        for (Database.SaveResult sr : insertResult) {
          tableResult.insertResults.add(
            new DMLResult(toInsert[index].Id, sr.isSuccess(), sr.getErrors())
          );
          index++;
        }

        // In some special case with child of Contact object.
        if (
          sObjectName.equalsIgnoreCase('Contact') &&
          String.isBlank(parentField) &&
          (objectName.equalsIgnoreCase('Opportunity') ||
          objectName.equalsIgnoreCase('Contract'))
        ) {
          List<SObject> lstExtendAdd = new List<SObject>();

          if (objectName.equalsIgnoreCase('Opportunity')) {
            lstExtendAdd = new List<OpportunityContactRole>();
          } else {
            lstExtendAdd = new List<ContractContactRole>();
          }

          // Get data for insert the ContactRole
          Integer idx = 0;

          for (Database.SaveResult sr : insertResult) {
            if (objectName.equalsIgnoreCase('Opportunity')) {
              lstExtendAdd.add(
                new OpportunityContactRole(
                  OpportunityId = toInsert[idx].Id,
                  ContactId = String.escapeSingleQuotes(recordId)
                )
              );
            } else {
              lstExtendAdd.add(
                new ContractContactRole(
                  ContractId = toInsert[idx].Id,
                  ContactId = String.escapeSingleQuotes(recordId)
                )
              );
            }

            idx++;
          }

          // Replace the new errors
          Database.SaveResult[] insertResultExpandResult = Database.insert(
            lstExtendAdd,
            false
          );
          Integer indexExt = 0;

          for (Database.SaveResult sr : insertResultExpandResult) {
            if (!sr.isSuccess()) {
              DMLResult res = tableResult.insertResults.get(indexExt);
              res = new DMLResult(
                toInsert[indexExt].Id,
                sr.isSuccess(),
                sr.getErrors()
              );
            }

            indexExt++;
          }
        }
      }

      // With the action delete records
      index = 0;

      if (!checkFLS(lstShowField, FLSType.DELETE_OBJECT, objectName)) {
        for (Integer i = 0; i < toDelete.size(); i++) {
          tableResult.deleteResults.add(
            new DMLResult(
              toDelete[i].Id,
              false,
              System.Label.CommList_RelatedListEditorCCDeleteError
            )
          );
        }
      } else {
        // With the action delete records
        Database.DeleteResult[] deleteResult = Database.delete(toDelete, false);

        for (Database.DeleteResult sr : deleteResult) {
          tableResult.deleteResults.add(
            new DMLResult(toDelete[index].Id, sr.isSuccess(), sr.getErrors())
          );
          index++;
        }
      }
    } catch (Exception ex) {
      // "Convert" the exception into an AuraHandledException
      throw new AuraHandledException(
        'Something went wrong: ' + ex.getMessage()
      );
    }

    return tableResult;
  }

  //Duc created
  /**
   * Get child relationship name
   * @param  String objectName, String sObjectName
   * @return String
   */
  @AuraEnabled(cacheable=true)
  public static String getChildRelationshipName(
    String childObject,
    String parentObject,
    String parentField
  ) {
    Map<String, Schema.SObjectType> schemaMap = Schema.getGlobalDescribe();
    Schema.SObjectType leadSchema = schemaMap.get(parentObject);

    List<ChildRelationship> rels = leadSchema.getDescribe()
      .getChildRelationships();

    for (ChildRelationship rel : rels) {
      if (childObject == rel.getChildSObject().getDescribe().getName()) {
        if (!String.isBlank(parentField)) {
          if (rel.getField().getDescribe().getName() == parentField) {
            return rel.getRelationshipName();
          } else {
            continue;
          }
        } else {
          return rel.getRelationshipName();
        }
      }
    }

    return null;
  }

  /**
   * Get column infor for showing on the viewmode screen
   * @param  String objectName, String fields
   * @return String
   */
  @AuraEnabled(cacheable=true)
  public static List<ColumnInfo> getColumnInfo(
    String objectName,
    String fields
  ) {
    Map<String, Schema.SObjectType> schemaMap = Schema.getGlobalDescribe();
    Schema.SObjectType leadSchema = schemaMap.get(objectName);
    Map<String, Schema.SObjectField> fieldMap = leadSchema.getDescribe()
      .fields.getMap();
    List<ColumnInfo> infos = new List<ColumnInfo>();
    String relationRegExp = '__c$';

    for (String fieldName : fields.split(',')) {
      fieldName = fieldName.trim();
      Schema.SobjectField strFld = fieldMap.get(fieldName);

      if (strFld == null) {
        ColumnInfo info = new ColumnInfo(
          fieldName,
          'STRING',
          fieldName.toLowerCase().removeEnd('id')
        );
        infos.add(info);
      } else {
        Schema.DescribeFieldResult fieldDescribe = strFld.getDescribe();
        fieldName = fieldDescribe.getName();

        if (fieldDescribe.getType() == Schema.DisplayType.REFERENCE) {
          String extraField;
          Schema.SObjectType parentObject = fieldDescribe.getReferenceTo()[0];

          if (parentObject.getDescribe().getName() == 'Case') {
            extraField =
              fieldName.removeEnd('Id').replaceFirst(relationRegExp, '__r') +
              '.Subject';
          } else {
            extraField =
              fieldName.removeEnd('Id').replaceFirst(relationRegExp, '__r') +
              '.Name';
          }

          ColumnInfo info = new ColumnInfo(
            fieldName,
            String.valueOf(fieldDescribe.getType()),
            strFld.getDescribe().getLabel().removeEnd('ID')
          );
          info.setReference(fieldDescribe.getReferenceTo());
          info.typeAttribute.label = new LinkProperty(extraField);
          infos.add(info);
        } else if (fieldDescribe.getType() == Schema.DisplayType.PICKLIST) {
          ColumnInfo info = new ColumnInfo(
            fieldName,
            String.valueOf(fieldDescribe.getType()),
            fieldDescribe.getLabel()
          );
          info.picklistOptions = CommList_PicklistService.getPicklistOptions(
            fieldDescribe.getPicklistValues()
          );
          infos.add(info);
        } else if (isUniqueField(strFld)) {
          //if unique field then create link to record
          ColumnInfo info = new ColumnInfo(
            fieldName,
            'UNIQUE',
            fieldDescribe.getLabel()
          );
          infos.add(info);
        } else if (String.valueOf(fieldDescribe.getType()) == 'DOUBLE') {
          /**
           * No15
           * Add ' || String.valueOf(fieldDescribe.getType()) == 'INTEGER' ' to if statement to use
           */
          Integer scale = fieldDescribe.getScale();
          ColumnInfo info = new ColumnInfo(
            fieldName,
            'number',
            fieldDescribe.getLabel()
          );
          info.typeAttribute = new TypeAttributes(scale);
          infos.add(info);
        } else if (String.valueOf(fieldDescribe.getType()) == 'CURRENCY') {
          Integer scale = fieldDescribe.getScale();
          ColumnInfo info = new ColumnInfo(
            fieldName,
            'currency',
            fieldDescribe.getLabel()
          );
          info.typeAttribute = new TypeAttributes(scale);
          infos.add(info);
        } else if (strFld.getDescribe().isCalculated()) {
          ColumnInfo info = new ColumnInfo(
            fieldName,
            'calculated',
            fieldDescribe.getLabel()
          );
          infos.add(info);
        } else {
          ColumnInfo info = new ColumnInfo(
            fieldName,
            String.valueOf(fieldDescribe.getType()),
            fieldDescribe.getLabel()
          );
          infos.add(info);
        }
      }
    }

    Schema.SObjectType objSchema = schemaMap.get(objectName);
    ColumnInfo rowAction = new ColumnInfo(null, 'action', null);
    List<ActionDefine> actions = new List<ActionDefine>();

    if (objSchema.getDescribe().isUpdateable()) {
      actions.add(new ActionDefine('Edit', 'edit', false));
    }

    if (objSchema.getDescribe().isDeletable()) {
      actions.add(new ActionDefine('Delete', 'delete', false));
    }

    if (actions.size() == 0) {
      actions.add(new ActionDefine('No action', 'no action', true));
    }

    rowAction.typeAttribute = new TypeAttributes(actions);
    infos.add(rowAction);

    return infos;
  }

  /**
   * Get object label name
   * @param  String objectName
   * @return String
   */
  @AuraEnabled(cacheable=true)
  public static String getObjectLabel(String objectName) {
    List<Schema.DescribeSObjectResult> describeSobjectsResult = Schema.describeSObjects(
      new List<String>{ objectName }
    );
    String objectLabel = describeSobjectsResult[0].getLabel();

    return objectLabel;
  }

  /**
   * Get Flow Info
   * @param  List<String> flowNames
   * @return List<FlowDefinitionView>
   */
  @AuraEnabled(cacheable=true)
  public static List<FlowDefinitionView> getFlowInfo(List<String> flowNames) {
    List<FlowDefinitionView> flowInfo = new List<FlowDefinitionView>();

    if (flowNames != null && flowNames.size() > 0) {
      flowInfo = [
        SELECT Id, ApiName, Label
        FROM FlowDefinitionView
        WHERE ApiName IN :flowNames
      ];
    }

    return flowInfo;
  }

  /**
   * Get tab style
   * @param  String objectName
   * @return String
   */
  @AuraEnabled(cacheable=true)
  public static String getTabStyle(String objectName) {
    if (objectName == 'OpportunityLineItem') {
      objectName = 'Product2';
    }

    List<Schema.DescribeTabSetResult> tabSetDesc = Schema.describeTabs();
    List<Schema.DescribeTabResult> tabDesc = new List<Schema.DescribeTabResult>();
    List<Schema.DescribeIconResult> iconDesc = new List<Schema.DescribeIconResult>();

    for (Schema.DescribeTabSetResult tsr : tabSetDesc) {
      tabDesc.addAll(tsr.getTabs());
    }

    for (Schema.DescribeTabResult tr : tabDesc) {
      if (objectName == tr.getSobjectName()) {
        if (!tr.getIcons().isEmpty()) {
          iconDesc.addAll(tr.getIcons());
        } else {
          return '';
        }
      }
    }

    for (Schema.DescribeIconResult ir : iconDesc) {
      if (
        ir.getTheme() == 'custom' &&
        !ir.getContentType().startsWith('image/svg')
      ) {
        //custom icon thats not an svg
        return '';
      } else if (
        ir.getWidth() == 120 &&
        ir.getTheme() == 'theme4' &&
        ir.getContentType() == 'image/png'
      ) {
        //large lightning icon image
        if (ir.getURL().contains('/custom/')) {
          //Icon is from the Custom Sprite
          String iconTag = ir.getURL()
            .substringBetween('custom/', '.png')
            .substringBefore('_');
          return 'custom:' + iconTag;
        } else if (ir.getURL().contains('/standard/')) {
          //Icon is from the Standard Sprite
          String iconTag = ir.getURL()
            .substringBetween('standard/', '.png')
            .substringBefore('_');
          return 'standard:' + iconTag;
        }
      }
    }

    return '';
  }

  // Check FLS
  public enum FLSType {
    CREATE_OBJECT,
    UPDATE_OBJECT,
    DELETE_OBJECT
  }
  public static Boolean checkFLS(
    String[] fieldCheckFLS,
    FLSType type,
    String objectName
  ) {
    Map<String, Schema.SObjectType> schemaMap = Schema.getGlobalDescribe();
    Schema.SObjectType objSchema = schemaMap.get(objectName);

    if (objSchema == null) {
      return false;
    }

    Map<String, Schema.SObjectField> fieldMap = objSchema.getDescribe()
      .fields.getMap();
    Set<String> fieldCheck = new Set<String>();

    //if null -> check all custom field
    if (fieldCheckFLS == null || fieldCheckFLS.isEmpty()) {
      for (String key : fieldMap.keySet()) {
        if (key.contains('__c')) {
          fieldCheck.add(key);
        }
      }
    } else {
      fieldCheck = new Set<String>(fieldCheckFLS);
    }

    if (type == FLSType.CREATE_OBJECT) {
      for (String field : fieldCheck) {
        SObjectField cusField = fieldMap.get(field);

        if (cusField != null) {
          if (
            !cusField.getDescribe().isCreateable() &&
            !cusField.getDescribe().isCalculated() &&
            !cusField.getDescribe().isAutoNumber() &&
            cusField.getDescribe().getRelationshipOrder() == null
          ) {
            return false;
          }
        } else {
          return false;
        }
      }
    } else if (type == FLSType.UPDATE_OBJECT) {
      for (String field : fieldCheck) {
        SObjectField cusField = fieldMap.get(field);

        if (cusField != null) {
          if (
            !fieldMap.get(field).getDescribe().isUpdateable() &&
            !cusField.getDescribe().isCalculated() &&
            !cusField.getDescribe().isAutoNumber() &&
            cusField.getDescribe().getRelationshipOrder() == null
          ) {
            return false;
          }
        } else {
          return false;
        }
      }
    } else if (type == FLSType.DELETE_OBJECT) {
      if (!objSchema.getDescribe().isDeletable()) {
        return false;
      }
    }

    return true;
  }

  public class GetRecordListResult {
    @AuraEnabled
    public List<SObject> records { get; set; }
    @AuraEnabled
    public List<ColumnInfo> parentFieldList { get; set; }
    @AuraEnabled
    public Boolean hasMoreRecord { get; set; }
    @AuraEnabled
    public String parentField { get; set; }
    @AuraEnabled
    public String sObjectName { get; set; }
    @AuraEnabled
    public String objectName { get; set; }
    @AuraEnabled
    public String caseField { get; set; }
    @AuraEnabled
    public Boolean hasLEOrderField { get; set; }
    @AuraEnabled
    public String orderFieldAPI { get; set; }
    @AuraEnabled
    public List<LocationField> fieldsLocation { get; set; }
    @AuraEnabled
    public List<String> encryptedFields { get; set; }
    @AuraEnabled
    public List<Map<String, Object>> recordTypes { get; set; }
    public GetRecordListResult() {
      this.orderFieldAPI = '';
      this.hasLEOrderField = false;
      this.fieldsLocation = new List<LocationField>();
      this.encryptedFields = new List<String>();
      this.recordTypes = new List<Map<String, Object>>();
    }
  }

  public class LocationField {
    @AuraEnabled
    public String fieldApi { get; set; }
    @AuraEnabled
    public String fieldDetail { get; set; }
    public LocationField(String fieldApi) {
      this.fieldApi = fieldApi;
      this.fieldDetail =
        fieldApi.replace('__c', '__latitude__s') +
        ',' +
        fieldApi.replace('__c', '__longitude__s');
    }
  }

  public class ColumnInfo {
    @AuraEnabled
    public String apiName { get; set; }
    @AuraEnabled
    public String type { get; set; }
    @AuraEnabled
    public String label { get; set; }
    @AuraEnabled
    public TypeAttributes typeAttribute { get; set; }
    @AuraEnabled
    public list<CommList_PicklistOption> picklistOptions { get; set; }
    @AuraEnabled
    public String referenceTo { get; set; }

    public ColumnInfo(String apiName, String type, String label) {
      this.apiName = apiName;
      this.type = type;
      this.label = label;

      if (
        type == 'ID' ||
        type == 'URL' ||
        type == 'EMAIL' ||
        type == 'PHONE' ||
        type == 'REFERENCE' ||
        type == 'UNIQUE'
      ) {
        typeAttribute = new TypeAttributes('_self', apiName);
      }

      picklistOptions = new List<CommList_PicklistOption>();
    }

    public void setReference(List<Schema.sObjectType> referenceTo) {
      if (!referenceTo.isEmpty()) {
        this.referenceTo = referenceTo.get(0).getDescribe().getName();
      }
    }
  }

  public class TypeAttributes {
    @AuraEnabled
    public String target { get; set; }
    @AuraEnabled
    public LinkProperty label { get; set; }
    @AuraEnabled
    public Integer minimumFractionDigits { get; set; }
    @AuraEnabled
    public Integer maximumFractionDigits { get; set; }
    @AuraEnabled
    public List<ActionDefine> rowActions { get; set; }
    public TypeAttributes(List<ActionDefine> actions) {
      rowActions = actions;
    }

    public TypeAttributes(Integer frac) {
      minimumFractionDigits = frac;
      maximumFractionDigits = frac;
    }

    public TypeAttributes(String target, String linkDisplayField) {
      if (!String.isBlank(target)) {
        this.target = target;
      }

      if (!String.isBlank(linkDisplayField)) {
        this.label = new LinkProperty(linkDisplayField);
      }
    }
  }

  public class ActionDefine {
    @AuraEnabled
    public String label { get; set; }
    @AuraEnabled
    public String name { get; set; }
    @AuraEnabled
    public Boolean disabled { get; set; }

    public ActionDefine(String label, String name, Boolean disabled) {
      this.label = label;
      this.name = name;
      this.disabled = disabled;
    }
  }

  public class LinkProperty {
    @AuraEnabled
    public String fieldName { get; set; }

    public LinkProperty(String fieldName) {
      this.fieldName = fieldName;
    }
  }

  public class DataRelatedObject {
    @AuraEnabled
    public List<ColumnInfoDetail> lstObjectFields;
    @AuraEnabled
    public List<String> lstShowFieldsName;
    @AuraEnabled
    public List<String> lstExtraFields;
    @AuraEnabled
    public String labelName;
    @AuraEnabled
    public String tabStyle;
    @AuraEnabled
    public Boolean isRowCreateable;
    @AuraEnabled
    public Boolean isRowDeleteable;
    @AuraEnabled
    public String defaultRecordTypeId;
    @AuraEnabled
    public List<String> requiredFields;

    public DataRelatedObject() {
      requiredFields = new List<String>();
    }
  }

  class ColumnInfoDetail {
    @AuraEnabled
    public String field;
    @AuraEnabled
    public Object defaultValue;
    @AuraEnabled
    public String fieldApiName;
    @AuraEnabled
    public String format;
    @AuraEnabled
    public String label;
    @AuraEnabled
    public String lookupId;
    @AuraEnabled
    public String name;
    @AuraEnabled
    public Boolean sortable;
    @AuraEnabled
    public String fieldType;
    @AuraEnabled
    public Boolean isCalculated;
    @AuraEnabled
    public Boolean isUpdateable;
    @AuraEnabled
    public Boolean isCreateable;
    @AuraEnabled
    public Boolean isVisible;
    @AuraEnabled
    public Boolean UpdateableOnlyOnCreate;
    @AuraEnabled
    public HtmlInputType htmlInputType;
    @AuraEnabled
    public list<CommList_PicklistOption> picklistOptions;
    @AuraEnabled
    public Relationship relationship;
    @AuraEnabled
    public String fieldName;
    @AuraEnabled
    public String controlFieldName;
    @AuraEnabled
    public Map<String, list<CommList_PicklistOption>> picklistDependencyOptions;
    public ColumnInfoDetail() {
      this.UpdateableOnlyOnCreate = false;
      this.isVisible = true;
      this.picklistDependencyOptions = new Map<String, list<CommList_PicklistOption>>();
      this.picklistOptions = new List<CommList_PicklistOption>();
    }
  }
  public class HtmlInputType {
    @AuraEnabled
    public String mainType;
    @AuraEnabled
    public String subType;
    @AuraEnabled
    public String formatType;
    @AuraEnabled
    public Double scale;
    public HtmlInputType(String fieldType, Integer scale) {
      this.mainType = 'invalid';
      this.subType = 'invalid';
      this.formatType = 'invalid';
      if (
        fieldType == 'TEXTAREA' ||
        fieldType == 'ENCRYPTEDSTRING' ||
        fieldType == 'STRING' ||
        fieldType == 'ID' ||
        fieldType == 'COMBOBOX'
      ) {
        this.mainType = 'standard';
        this.subType = 'text';
      } else if (
        fieldType == 'CURRENCY' ||
        fieldType == 'DOUBLE' ||
        fieldType == 'INTEGER' ||
        fieldType == 'PERCENT'
      ) {
        this.mainType = 'standard';
        this.subType = 'number';
        this.formatType = fieldType == 'PERCENT' ? 'percent-fixed' : fieldType;
        this.scale = Math.pow(10, (-1 * scale));
      } else if (fieldType == 'DATE') {
        this.mainType = 'standard';
        this.subType = 'date';
      } else if (fieldType == 'DATETIME') {
        this.mainType = 'datetime';
        this.subType = 'datetime-local';
      } else if (fieldType == 'TIME') {
        this.mainType = 'time';
        this.subType = 'time-local';
      } else if (fieldType == 'BOOLEAN') {
        this.mainType = 'checkbox';
        this.subType = '';
      } else if (fieldType == 'CALCULATED') {
        this.mainType = 'calculated';
        this.subType = '';
      } else if (fieldType == 'PICKLIST') {
        this.mainType = 'picklist';
        this.subType = '';
      } else if (fieldType == 'MULTIPICKLIST') {
        this.mainType = 'multipicklist';
        this.subType = '';
      } else if (fieldType == 'EMAIL') {
        this.mainType = 'standard';
        this.subType = 'email';
      } else if (fieldType == 'PHONE') {
        this.mainType = 'standard';
        this.subType = 'tel';
      } else if (fieldType == 'URL') {
        this.mainType = 'standard';
        this.subType = 'url';
      } else if (fieldType == 'REFERENCE') {
        this.mainType = 'lookup';
        this.subType = '';
      }
    }
  }

  public class Relationship {
    @AuraEnabled
    public String relationshipName;
    @AuraEnabled
    public list<String> objects;
    public Relationship(String relationshipName) {
      this.relationshipName = relationshipName;
      this.objects = new List<String>();
    }
  }

  public class SaveTableResult {
    @AuraEnabled
    public DMLResult[] insertResults;
    @AuraEnabled
    public DMLResult[] updateResults;
    @AuraEnabled
    public DMLResult[] deleteResults;
    SaveTableResult() {
      this.insertResults = new List<DMLResult>();
      this.updateResults = new List<DMLResult>();
      this.deleteResults = new List<DMLResult>();
    }
  }

  public class DMLResult {
    @AuraEnabled
    public String id;
    @AuraEnabled
    public Boolean isSuccess;
    @AuraEnabled
    public String error;
    public DMLResult(String id, Boolean isSuccess, Database.Error[] Errors) {
      this.id = id;
      this.isSuccess = isSuccess;
      this.error = '';
      for (Database.Error err : Errors) {
        this.error += err.getStatusCode() + ': ' + err.getMessage() + '<br/>';
        this.error += 'Error fields: ' + err.getFields() + '<br/>';
      }
    }
    public DMLResult(String id, Boolean isSuccess, String errorMsg) {
      this.id = id;
      this.isSuccess = isSuccess;
      this.error = errorMsg;
    }
  }
}
