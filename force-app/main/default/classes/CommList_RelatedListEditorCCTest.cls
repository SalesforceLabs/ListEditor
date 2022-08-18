// Copyright 2020 salesforce.com, inc
// All rights reserved.
// SPDX-License-Identifier: BSD-3-Clause
// For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause

/**
 * CommList_RelatedListEditorCC
 * @version 1.0
 * @Description: Testing for class CommList_RelatedListEditorCC.
 */
@isTest
public class CommList_RelatedListEditorCCTest {
  /**
   * Get getPrefix
   * @param  string sObjectName, string objectName, string showFields, string parentField
   * @return DataRelatedObject
   */
  public static String getPrefix() {
    ApexClass cs = [
      SELECT NamespacePrefix
      FROM ApexClass
      WHERE Name = :'CommList_RelatedListEditorCCTest'
    ];
    String np = cs.NamespacePrefix;
    return String.isBlank(np) ? '' : np + '__';
  }
  /**
   * Get infor of normal object exist empty fields
   * @param  string sObjectName, string objectName, string showFields, string parentField
   * @return DataRelatedObject
   */
  @isTest
  static void getRelatedListTest1() {
    string sObjectName = 'Account';
    string objectName = 'Contact';
    string showFields = 'name, LeadSource,,';
    string parentField = '';
    CommList_RelatedListEditorCC.DataRelatedObject dataRes = CommList_RelatedListEditorCC.getRelatedList(
      sObjectName,
      objectName,
      showFields,
      parentField
    );
    string labelName = CommList_RelatedListEditorCC.getObjectLabel(objectName);
    System.assertEquals(labelName, dataRes.labelName);
    System.assertEquals(3, dataRes.lstObjectFields.size());
    System.assertEquals(2, dataRes.lstExtraFields.size());
  }

  /**
   * Get infor of normal object with lst fields valid
   * @param  string sObjectName, string objectName, string showFields, string parentField
   * @return DataRelatedObject
   */
  @isTest
  static void getRelatedListTest2() {
    string sObjectName = 'Account';
    string objectName = 'Contact';
    string showFields = 'Id, name, MailingAddress, LeadSource,Phone';
    string parentField = '';
    CommList_RelatedListEditorCC.DataRelatedObject dataRes = CommList_RelatedListEditorCC.getRelatedList(
      sObjectName,
      objectName,
      showFields,
      parentField
    );
    string labelName = CommList_RelatedListEditorCC.getObjectLabel(objectName);
    System.assertEquals(labelName, dataRes.labelName);
    System.assertEquals(10, dataRes.lstObjectFields.size());
    System.assertEquals(1, dataRes.lstExtraFields.size());
  }

  /**
   * Get infor of with the compound data field contains one another field
   * @param  string sObjectName, string objectName, string showFields, string parentField
   * @return DataRelatedObject
   */
  @isTest
  static void getRelatedListTest3() {
    string sObjectName = 'Account';
    string objectName = 'Contact';
    string showFields = 'Id, name, MailingAddress, LeadSource,Phone,MailingStreet,DoNotCall,LastCURequestDate,Email';
    string parentField = '';
    CommList_RelatedListEditorCC.DataRelatedObject dataRes = CommList_RelatedListEditorCC.getRelatedList(
      sObjectName,
      objectName,
      showFields,
      parentField
    );
    string labelName = CommList_RelatedListEditorCC.getObjectLabel(objectName);
    System.assertEquals(labelName, dataRes.labelName);
    System.assertEquals(13, dataRes.lstObjectFields.size());
    System.assertEquals(1, dataRes.lstExtraFields.size());
  }

  /**
   * Get infor of with the compound data field contains two another field
   * @param  string sObjectName, string objectName, string showFields, string parentField
   * @return DataRelatedObject
   */
  @isTest
  static void getRelatedListTest4() {
    string sObjectName = 'Account';
    string objectName = 'Contact';
    string showFields = 'Id, name, MailingAddress, LeadSource,Phone,MailingStreet,FirstName';
    string parentField = '';
    CommList_RelatedListEditorCC.DataRelatedObject dataRes = CommList_RelatedListEditorCC.getRelatedList(
      sObjectName,
      objectName,
      showFields,
      parentField
    );
    string labelName = CommList_RelatedListEditorCC.getObjectLabel(objectName);

    System.assertEquals(labelName, dataRes.labelName);
    System.assertEquals(10, dataRes.lstObjectFields.size());
    System.assertEquals(1, dataRes.lstExtraFields.size());
  }

  /**
   * Get infor of with the compound data field contains two another field
   * @param  string sObjectName, string objectName, string showFields, string parentField
   * @return DataRelatedObject
   */
  @isTest
  static void getRelatedListTest5() {
    string sObjectName = 'Account';
    string objectName = 'Contact';
    string showFields = 'Id, name';
    string parentField = 'Account';
    CommList_RelatedListEditorCC.DataRelatedObject dataRes = CommList_RelatedListEditorCC.getRelatedList(
      sObjectName,
      objectName,
      showFields,
      parentField
    );
    string labelName = CommList_RelatedListEditorCC.getObjectLabel(objectName);

    System.assertEquals(labelName, dataRes.labelName);
    System.assertEquals(3, dataRes.lstObjectFields.size());
    System.assertEquals(1, dataRes.lstExtraFields.size());
  }

  /**
   * Saving record error
   * @param  string sObjectName, string objectName, string showFields, string parentField
   * @return DataRelatedObject
   */
  @isTest
  static void saveRecordsTest1() {
    //Create list data Contact : 2 records
    List<Contact> lstContactFirst = new List<Contact>();
    for (Integer i = 0; i < 2; i++) {
      lstContactFirst.add(
        new Contact(FirstName = 'FirstName' + i, LastName = 'LastName' + i)
      );
    }

    insert lstContactFirst;

    //Create list add: 2 record
    List<Contact> lstContactAdd = new List<Contact>();
    for (Integer i = 0; i < 2; i++) {
      lstContactAdd.add(new Contact(FirstName = 'FirstAdd' + i));
    }

    // Update list data: 2 record
    List<Contact> lstUpdate = new List<Contact>{ lstContactFirst[0] };
    lstUpdate[0].FirstName = 'FirstNameUpdate';
    lstUpdate[0].LastName = 'LastNameUpdate';

    // Create list delete : 1 record.
    List<Contact> lstDel = new List<Contact>{ lstContactFirst[1] };

    CommList_RelatedListEditorCC.SaveTableResult saveResult = CommList_RelatedListEditorCC.saveRecords(
      'Account',
      'Contact',
      lstContactAdd,
      lstUpdate,
      lstDel,
      '',
      '',
      new List<String>{ 'FirstName', 'LastName' }
    );

    List<Contact> lstRes = [SELECT Id, FirstName, LastName FROM Contact];
    System.assertEquals(1, lstRes.size());
    System.assertEquals(false, saveResult.insertResults[0].isSuccess);
    System.assertEquals(false, saveResult.insertResults[1].isSuccess);
    System.assertEquals(true, saveResult.updateResults[0].isSuccess);
    System.assertEquals(true, saveResult.deleteResults[0].isSuccess);
  }

  /**
   * Saving record normaly
   * @param  string sObjectName, string objectName, string showFields, string parentField
   * @return DataRelatedObject
   */
  @isTest
  static void saveRecordsTest2() {
    //Create list data Contact : 2 records
    List<Contact> lstContactFirst = new List<Contact>();
    for (Integer i = 0; i < 2; i++) {
      lstContactFirst.add(
        new Contact(FirstName = 'FirstName' + i, LastName = 'LastName' + i)
      );
    }

    insert lstContactFirst;

    //Create list add: 2 record
    List<Contact> lstContactAdd = new List<Contact>();
    for (Integer i = 0; i < 2; i++) {
      lstContactAdd.add(
        new Contact(FirstName = 'FirstAdd' + i, LastName = 'LastAdd' + i)
      );
    }

    // Update list data: 2 record
    List<Contact> lstUpdate = new List<Contact>{ lstContactFirst[0] };
    lstUpdate[0].FirstName = 'FirstNameUpdate';
    lstUpdate[0].LastName = 'LastNameUpdate';

    // Create list delete : 1 record.
    List<Contact> lstDel = new List<Contact>{ lstContactFirst[1] };

    CommList_RelatedListEditorCC.SaveTableResult saveResult = CommList_RelatedListEditorCC.saveRecords(
      'Account',
      'Contact',
      lstContactAdd,
      lstUpdate,
      lstDel,
      '',
      '',
      new List<String>{ 'FirstName', 'LastName' }
    );

    List<Contact> lstRes = [SELECT Id, FirstName, LastName FROM Contact];
    System.assertEquals(3, lstRes.size());
    System.assertEquals(true, saveResult.insertResults[0].isSuccess);
    System.assertEquals(true, saveResult.insertResults[1].isSuccess);
    System.assertEquals(true, saveResult.updateResults[0].isSuccess);
    System.assertEquals(true, saveResult.deleteResults[0].isSuccess);
  }

  /**
   * Saving record normaly with role
   * @param  string sObjectName, string objectName, string showFields, string parentField
   * @return DataRelatedObject
   */
  @isTest
  static void saveRecordsTest3() {
    // Create contact for link
    Contact contactParent = new Contact(
      FirstName = 'FirstName',
      LastName = 'LastName'
    );
    insert contactParent;

    //Create list data Opportunity : 2 records
    List<Opportunity> lstOpportunityFirst = new List<Opportunity>();
    for (Integer i = 0; i < 2; i++) {
      lstOpportunityFirst.add(
        new Opportunity(
          Name = 'New Opp' + i,
          StageName = 'Prospecting',
          CloseDate = System.today()
        )
      );
    }

    insert lstOpportunityFirst;

    List<OpportunityContactRole> lstRole = new List<OpportunityContactRole>();
    for (Integer i = 0; i < 2; i++) {
      lstRole.add(
        new OpportunityContactRole(
          OpportunityId = lstOpportunityFirst[i].Id,
          ContactId = contactParent.Id
        )
      );
    }

    insert lstRole;

    //Create list add: 2 record
    List<Opportunity> lstOpportunityAdd = new List<Opportunity>();
    for (Integer i = 0; i < 2; i++) {
      lstOpportunityAdd.add(
        new Opportunity(
          Name = 'New Opp Add' + i,
          StageName = 'Prospecting',
          CloseDate = System.today()
        )
      );
    }

    // Update list data: 1 record
    List<Opportunity> lstUpdate = new List<Opportunity>{
      lstOpportunityFirst[0]
    };
    lstUpdate[0].Name = 'Opp Update';

    // Create list delete : 1 record.
    List<Opportunity> lstDel = new List<Opportunity>{ lstOpportunityFirst[1] };

    CommList_RelatedListEditorCC.SaveTableResult saveResult = CommList_RelatedListEditorCC.saveRecords(
      'Contact',
      'Opportunity',
      lstOpportunityAdd,
      lstUpdate,
      lstDel,
      contactParent.Id,
      '',
      new List<String>{ 'Name', 'StageName', 'CloseDate' }
    );

    Integer count = 0;
    for (Opportunity op : [
      SELECT Id, Name
      FROM Opportunity
      WHERE
        Id IN (
          SELECT OpportunityId
          FROM OpportunityContactRole
          WHERE ContactId = :contactParent.Id
        )
    ]) {
      count++;
      System.debug(op.name);
    }

    System.assertEquals(3, count);
    System.assertEquals(true, saveResult.insertResults[0].isSuccess);
    System.assertEquals(true, saveResult.insertResults[1].isSuccess);
    System.assertEquals(true, saveResult.updateResults[0].isSuccess);
    System.assertEquals(true, saveResult.deleteResults[0].isSuccess);
  }

  /**
   * Saving record abnormaly with role
   * @param  string sObjectName, string objectName, string showFields, string parentField
   * @return DataRelatedObject
   */
  @isTest
  static void saveRecordsTest4() {
    // Create contact for link
    Contact contactParent = new Contact(
      FirstName = 'FirstName',
      LastName = 'LastName'
    );
    insert contactParent;

    //Create list data Opportunity : 2 records
    List<Opportunity> lstOpportunityFirst = new List<Opportunity>();
    for (Integer i = 0; i < 2; i++) {
      lstOpportunityFirst.add(
        new Opportunity(
          Name = 'New Opp' + i,
          StageName = 'Prospecting',
          CloseDate = System.today()
        )
      );
    }

    insert lstOpportunityFirst;

    List<OpportunityContactRole> lstRole = new List<OpportunityContactRole>();
    for (Integer i = 0; i < 2; i++) {
      lstRole.add(
        new OpportunityContactRole(
          OpportunityId = lstOpportunityFirst[i].Id,
          ContactId = contactParent.Id
        )
      );
    }

    insert lstRole;

    //Create list add: 2 record
    List<Opportunity> lstOpportunityAdd = new List<Opportunity>();
    for (Integer i = 0; i < 2; i++) {
      lstOpportunityAdd.add(
        new Opportunity(StageName = 'Prospecting', CloseDate = System.today())
      );
    }

    // Update list data: 1 record
    List<Opportunity> lstUpdate = new List<Opportunity>{
      lstOpportunityFirst[0]
    };
    lstUpdate[0].Name = 'Opp Update';

    // Create list delete : 1 record.
    List<Opportunity> lstDel = new List<Opportunity>{ lstOpportunityFirst[1] };

    CommList_RelatedListEditorCC.SaveTableResult saveResult = CommList_RelatedListEditorCC.saveRecords(
      'Contact',
      'Opportunity',
      lstOpportunityAdd,
      lstUpdate,
      lstDel,
      contactParent.Id,
      '',
      new List<String>{ 'Name', 'StageName', 'CloseDate' }
    );

    List<Opportunity> lstRes = [
      SELECT Id, Name
      FROM Opportunity
      WHERE
        Id IN (
          SELECT OpportunityId
          FROM OpportunityContactRole
          WHERE ContactId = :contactParent.Id
        )
    ];

    System.assertEquals(1, lstRes.size());
    System.assertEquals(false, saveResult.insertResults[0].isSuccess);
    System.assertEquals(false, saveResult.insertResults[1].isSuccess);
    System.assertEquals(true, saveResult.updateResults[0].isSuccess);
    System.assertEquals(true, saveResult.deleteResults[0].isSuccess);
  }

  /**
   * Testing getRecordList normal
   * @param  Schema.SobjectField
   * @return GetRecordListResult
   */
  @isTest
  static void getRecordListTest1() {
    Account acc = new Account(Name = 'AccountTest');
    insert acc;

    List<Contact> lstContact = new List<Contact>();
    for (Integer i = 0; i < 5; i++) {
      lstContact.add(
        new Contact(
          FirstName = 'FirstName' + i,
          LastName = 'LastName' + i,
          AccountId = acc.Id
        )
      );
    }

    insert lstContact;

    String objectName = 'Contact';
    String fields = 'Id,Name, MailingAddress, RecordTypeid, AccountId, CreatedDate,OwnerId, DoNotCall, CleanStatus';
    String limitRecs = '10';
    String recordId = acc.Id;
    String sObjectName = 'Account';
    String parentField = '';
    String offset = '0';
    String filter = 'AccountId = \'' + acc.Id + '\'';

    String searchText = 'Name';

    CommList_RelatedListEditorCC.GetRecordListResult dataRecordList = CommList_RelatedListEditorCC.getRecordList(
      objectName,
      fields,
      limitRecs,
      recordId,
      parentField,
      offset,
      filter,
      searchText,
      true,
      ''
    );

    System.assertEquals(5, dataRecordList.records.size());
  }

  /**
   * Testing getRecordList normal -Case
   * @param  Schema.SobjectField
   * @return GetRecordListResult
   */
  @isTest
  static void getRecordListTest2() {
    Contact ct = new Contact(FirstName = 'FirstName', LastName = 'LastName');
    insert ct;

    List<Case> lstCase = new List<Case>();
    for (Integer i = 0; i < 5; i++) {
      lstCase.add(
        new Case(Status = 'Working', Origin = 'Phone', ContactId = ct.Id)
      );
    }

    insert lstCase;

    String objectName = 'Case';
    String fields = 'Status,Origin';
    String limitRecs = '10';
    String recordId = ct.Id;
    String sObjectName = 'Contact';
    String parentField = '';
    String offset = '0';
    String filter = '';

    String searchText = 'Working';

    CommList_RelatedListEditorCC.GetRecordListResult dataRecordList = CommList_RelatedListEditorCC.getRecordList(
      objectName,
      fields,
      limitRecs,
      recordId,
      parentField,
      offset,
      filter,
      searchText,
      true,
      ''
    );

    System.assertEquals(5, dataRecordList.records.size());
  }

  /**
   * Testing getRecordList normal -Opportunity
   * @param  Schema.SobjectField
   * @return GetRecordListResult
   */
  @isTest
  static void getRecordListTest3() {
    Contact ct = new Contact(FirstName = 'FirstName', LastName = 'LastName');
    insert ct;

    Account acc = new Account(Name = 'Account Test');
    insert acc;

    List<Opportunity> lstOp = new List<Opportunity>();
    for (Integer i = 0; i < 5; i++) {
      lstOp.add(
        new Opportunity(
          Name = 'Opportunity Name' + i,
          StageName = 'Prospecting',
          CloseDate = System.today()
        )
      );
    }

    insert lstOp;

    List<OpportunityContactRole> lstTarget = new List<OpportunityContactRole>();
    for (Integer j = 0; j < lstOp.size(); j++) {
      lstTarget.add(
        new OpportunityContactRole(
          OpportunityId = lstOp[j].Id,
          ContactId = ct.Id
        )
      );
    }

    insert lstTarget;

    String objectName = 'Opportunity';
    String fields = 'Name,StageName,AccountId';
    String limitRecs = '10';
    String recordId = ct.Id;
    String sObjectName = 'Contact';
    String parentField = '';
    String offset = '0';
    String filter = '';

    CommList_RelatedListEditorCC.GetRecordListResult dataRecordList = CommList_RelatedListEditorCC.getRecordList(
      objectName,
      fields,
      limitRecs,
      recordId,
      parentField,
      offset,
      filter,
      '',
      true,
      ''
    );
    System.assertEquals(5, dataRecordList.records.size());
  }

  /**
   * deleteRelatedRecord
   * @param  String recordId
   * @return deleteRelatedRecord
   */
  @isTest
  static void deleteRelatedRecordTest1() {
    Contact ct = new Contact(FirstName = 'FirstName', LastName = 'LastName');
    insert ct;

    String result = CommList_RelatedListEditorCC.deleteRelatedRecord(ct.Id);

    System.assertEquals('successfully deleted', result);
  }

  /**
   * deleteRelatedRecord
   * @param  String recordId
   * @return deleteRelatedRecord
   */
  @isTest
  static void deleteRelatedRecordTest2() {
    String result = CommList_RelatedListEditorCC.deleteRelatedRecord(
      'IdInvalid'
    );
    System.assertNotEquals('successfully deleted', result);
  }

  /**
   * Get child relationship
   * @param  String childObjectName, String parentObjectName, String parentFieldName
   * @return String result
   */
  @isTest
  static void getChildRelationshipNameTest1() {
    String expectResult = 'Contacts';
    String result = CommList_RelatedListEditorCC.getChildRelationshipName(
      'Contact',
      'Account',
      ''
    );
    System.assertEquals(expectResult, result);
  }

  /**
   * Get child relationship
   * @param  String childObjectName, String parentObjectName, String parentFieldName
   * @return String result
   */
  @isTest
  static void getChildRelationshipNameTest2() {
    String expectResult = 'Contacts';
    String result = CommList_RelatedListEditorCC.getChildRelationshipName(
      'Contact',
      'Account',
      'AccountId'
    );
    System.assertEquals(expectResult, result);
  }

  /**
   * getColumnInfo
   * @param  String objectName, String fields
   * @return List<ColumnInfo>
   */
  @isTest
  static void getColumnInfoTest1() {
    String objectName = 'Contact';
    String fields = 'Id, AccountId, MailingAddress, Email, Phone, LeadSource,Phone';
    List<CommList_RelatedListEditorCC.ColumnInfo> lstData = CommList_RelatedListEditorCC.getColumnInfo(
      objectName,
      fields
    );
    System.assertNotEquals(null, lstData);
  }

  /**
   * getOrderFieldWithPrefix case obnormal
   * @param  String objectName
   * @return String
   */
  @isTest
  static void getOrderFieldWithPrefixTest1() {
    String objectName = 'ObjectNotExist';
    System.assertEquals(
      '',
      CommList_RelatedListEditorCC.getOrderFieldWithPrefix(objectName)
    );
  }

  /**
   * getOrderFieldWithPrefix case normal
   * @param  String objectName
   * @return String
   */
  @isTest
  static void getOrderFieldWithPrefixTest2() {
    String objectName = 'Contact';
    String defaultOrderField = 'ListEditor__LE_Order__c';
    String actualFieldOrder = CommList_RelatedListEditorCC.getOrderFieldWithPrefix(
      objectName
    );
    Boolean isValid = (actualFieldOrder == defaultOrderField ||
    actualFieldOrder == '');
    System.assert(isValid);
  }

  @isTest
  static void htmlInputTypeTest() {
    CommList_RelatedListEditorCC.HtmlInputType htmlType = new CommList_RelatedListEditorCC.HtmlInputType(
      'TEXTAREA',
      0
    );
    System.assert(htmlType.mainType == 'standard');
    System.assert(htmlType.subType == 'text');

    htmlType = new CommList_RelatedListEditorCC.HtmlInputType('CURRENCY', 2);
    System.assert(htmlType.mainType == 'standard');
    System.assert(htmlType.subType == 'number');

    htmlType = new CommList_RelatedListEditorCC.HtmlInputType('DATE', 0);
    System.assert(htmlType.mainType == 'standard');
    System.assert(htmlType.subType == 'date');

    htmlType = new CommList_RelatedListEditorCC.HtmlInputType('DATETIME', 0);
    System.assert(htmlType.mainType == 'datetime');
    System.assert(htmlType.subType == 'datetime-local');

    htmlType = new CommList_RelatedListEditorCC.HtmlInputType('TIME', 0);
    System.assert(htmlType.mainType == 'time');
    System.assert(htmlType.subType == 'time-local');

    htmlType = new CommList_RelatedListEditorCC.HtmlInputType('BOOLEAN', 0);
    System.assert(htmlType.mainType == 'checkbox');
    System.assert(htmlType.subType == '');

    htmlType = new CommList_RelatedListEditorCC.HtmlInputType('CALCULATED', 0);
    System.assert(htmlType.mainType == 'calculated');
    System.assert(htmlType.subType == '');

    htmlType = new CommList_RelatedListEditorCC.HtmlInputType('PICKLIST', 0);
    System.assert(htmlType.mainType == 'picklist');
    System.assert(htmlType.subType == '');

    htmlType = new CommList_RelatedListEditorCC.HtmlInputType(
      'MULTIPICKLIST',
      0
    );
    System.assert(htmlType.mainType == 'multipicklist');
    System.assert(htmlType.subType == '');

    htmlType = new CommList_RelatedListEditorCC.HtmlInputType('EMAIL', 0);
    System.assert(htmlType.mainType == 'standard');
    System.assert(htmlType.subType == 'email');

    htmlType = new CommList_RelatedListEditorCC.HtmlInputType('PHONE', 0);
    System.assert(htmlType.mainType == 'standard');
    System.assert(htmlType.subType == 'tel');

    htmlType = new CommList_RelatedListEditorCC.HtmlInputType('URL', 0);
    System.assert(htmlType.mainType == 'standard');
    System.assert(htmlType.subType == 'url');

    htmlType = new CommList_RelatedListEditorCC.HtmlInputType('REFERENCE', 0);
    System.assert(htmlType.mainType == 'lookup');
    System.assert(htmlType.subType == '');

    htmlType = new CommList_RelatedListEditorCC.HtmlInputType('Unknow', 0);
    System.assert(htmlType.mainType == 'invalid');
    System.assert(htmlType.subType == 'invalid');
  }
  @isTest
  static void relationshipTest() {
    CommList_RelatedListEditorCC.Relationship relation = new CommList_RelatedListEditorCC.Relationship(
      'SomeRelationName'
    );
    System.assert(relation.relationshipName == 'SomeRelationName');
    System.assert(relation.objects == new List<String>());
  }

  @isTest
  static void DMLResultTest() {
    CommList_RelatedListEditorCC.DMLResult result = new CommList_RelatedListEditorCC.DMLResult(
      'Error',
      true,
      'Get error'
    );
    System.assert(result.id == 'Error');
    System.assert(result.isSuccess == true);
    System.assert(result.error == 'Get error');
  }

  @isTest
  static void typeAttributesTest() {
    CommList_RelatedListEditorCC.TypeAttributes result = new CommList_RelatedListEditorCC.TypeAttributes(
      5
    );
    System.assert(result.minimumFractionDigits == 5);
    System.assert(result.maximumFractionDigits == 5);
  }

  @isTest
  static void locationFieldTest() {
    CommList_RelatedListEditorCC.LocationField result = new CommList_RelatedListEditorCC.LocationField(
      'fieldApi__c'
    );
    System.assert(result.fieldApi == 'fieldApi__c');
    System.assert(
      result.fieldDetail == 'fieldApi__latitude__s,fieldApi__longitude__s'
    );
  }
}
