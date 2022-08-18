// Copyright 2020 salesforce.com, inc
// All rights reserved.
// SPDX-License-Identifier: BSD-3-Clause
// For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
/**
 * CommList_EditRL_LookupFieldCCTest
 * @version 1.0
 * @Description: Testing for class CommList_EditRL_LookupFieldCC.
 */
@isTest
public class CommList_EditRL_LookupFieldCCTest {
  /**
   * Testing for get information of lookup field: Normal case
   * @param Id recordId, String[] objectsToSearch
   * @return ResultDataLookup
   */
  @isTest
  static void getRecordNameTest1() {
    Contact targetContact = new Contact(
      FirstName = 'first name',
      LastName = 'last name'
    );
    String[] lstObject = new List<String>{ 'Contact' };
    insert targetContact;
    CommList_EditRL_LookupFieldCC.ResultDataLookup dataRes = CommList_EditRL_LookupFieldCC.getRecordName(
      targetContact.Id,
      lstObject
    );
    System.assertEquals('Contact', dataRes.objectName);
    System.assertEquals(targetContact.Id, dataRes.recId);
  }

  /**
   * Testing for get information of lookup field: abnormal case -- recordId null
   * @param Id recordId, String[] objectsToSearch
   * @return ResultDataLookup
   */
  @isTest
  static void getRecordNameTest2() {
    String[] lstObject = new List<String>{ 'Contact' };
    CommList_EditRL_LookupFieldCC.ResultDataLookup dataRes = CommList_EditRL_LookupFieldCC.getRecordName(
      '',
      lstObject
    );

    System.assertEquals(null, dataRes.objectName);
    System.assertEquals(null, dataRes.recId);
    System.assertEquals(null, dataRes.recLabel);
  }

  /**
   * Testing for get information of lookup field: abnormal case -- Object not exist
   * @param Id recordId, String[] objectsToSearch
   * @return ResultDataLookup
   */
  @isTest
  static void getRecordNameTest4() {
    Contact targetContact = new Contact(
      FirstName = 'first name',
      LastName = 'last name'
    );
    String[] lstObject = new List<String>{ 'xxxx' };
    insert targetContact;
    CommList_EditRL_LookupFieldCC.ResultDataLookup dataRes = CommList_EditRL_LookupFieldCC.getRecordName(
      targetContact.Id,
      lstObject
    );

    System.assertEquals(null, dataRes.objectName);
    System.assertEquals(null, dataRes.recId);
    System.assertEquals(null, dataRes.recLabel);
  }

  /**
   * Testing for get information of lookup field: Normal case
   * @param Id recordId, String[] objectsToSearch
   * @return ResultDataLookup
   */
  @isTest
  static void getRecordNameTest5() {
    Case targetCase = new Case(
      Status = 'New',
      Subject = 'subject 1',
      Origin = 'Phone'
    );
    String[] lstObject = new List<String>{ 'Case' };
    insert targetCase;
    CommList_EditRL_LookupFieldCC.ResultDataLookup dataRes = CommList_EditRL_LookupFieldCC.getRecordName(
      targetCase.Id,
      lstObject
    );
    System.assertEquals('Case', dataRes.objectName);
    System.assertEquals(targetCase.Id, dataRes.recId);
  }

  /**
   * Testing for get information of lookup field: Normal case
   * @param Id recordId, String[] objectsToSearch
   * @return ResultDataLookup
   */
  @isTest
  static void getRecordNameTest6() {
    Case targetCase = new Case(Status = 'New', Subject = '', Origin = 'Phone');
    String[] lstObject = new List<String>{ 'Case' };
    insert targetCase;
    CommList_EditRL_LookupFieldCC.ResultDataLookup dataRes = CommList_EditRL_LookupFieldCC.getRecordName(
      targetCase.Id,
      lstObject
    );
    System.assertEquals('Case', dataRes.objectName);
    System.assertEquals(targetCase.Id, dataRes.recId);
  }

  /**
   * Testing for get list data sastify: Show 49 records
   * @param Id recordId, String[] objectsToSearch
   * @return ResultDataLookup
   */
  @isTest
  static void lookupTest1() {
    List<Contact> lstContact = new List<Contact>();
    for (Integer i = 0; i < 49; i++) {
      lstContact.add(
        new Contact(FirstName = 'first name' + i, LastName = 'last name' + i)
      );
    }

    insert lstContact;
    List<Id> fixedSearchResults = new List<Id>();
    for (Contact ct : lstContact) {
      fixedSearchResults.add(ct.Id);
    }

    //Test.setFixedSearchResults(fixedSearchResults);
    List<CommList_EditRL_LookupFieldCC.ResultDataLookup> lstDataRes = CommList_EditRL_LookupFieldCC.lookup(
      'last',
      new List<String>{ 'Contact' }
    );

    System.assertNotEquals(null, lstDataRes);
  }

  /**
   * Testing for get list data sastify: Show max 50 records
   * @param Id recordId, String[] objectsToSearch
   * @return ResultDataLookup
   */
  @isTest
  static void lookupTest2() {
    List<Contact> lstContact = new List<Contact>();
    for (Integer i = 0; i < 51; i++) {
      lstContact.add(
        new Contact(FirstName = 'first name' + i, LastName = 'last name' + i)
      );
    }

    insert lstContact;
    List<Id> fixedSearchResults = new List<Id>();
    for (Contact ct : lstContact) {
      fixedSearchResults.add(ct.Id);
    }

    //Test.setFixedSearchResults(fixedSearchResults);
    List<CommList_EditRL_LookupFieldCC.ResultDataLookup> lstDataRes = CommList_EditRL_LookupFieldCC.lookup(
      'last',
      new List<String>{ 'Contact' }
    );

    System.assertNotEquals(null, lstDataRes);
  }

  /**
   * Testing for get list data sastify: Show max 50 records
   * @param Id recordId, String[] objectsToSearch
   * @return ResultDataLookup
   */
  @isTest
  static void lookupTest3() {
    List<Case> lstCase = new List<Case>();
    for (Integer i = 0; i < 5; i++) {
      lstCase.add(
        new Case(Status = 'New', Subject = 'CaseSubject ' + i, Origin = 'Phone')
      );
    }
    insert lstCase;

    List<CommList_EditRL_LookupFieldCC.ResultDataLookup> lstDataRes = CommList_EditRL_LookupFieldCC.lookup(
      'CaseSubject',
      new List<String>{ 'Case' }
    );

    System.assertNotEquals(null, lstDataRes);
  }
}
