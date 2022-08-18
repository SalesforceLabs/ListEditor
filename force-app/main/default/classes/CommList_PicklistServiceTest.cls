// Copyright 2020 salesforce.com, inc
// All rights reserved.
// SPDX-License-Identifier: BSD-3-Clause
// For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause

@isTest
public class CommList_PicklistServiceTest {
    @isTest static void getDependencyPicklistOptionsTest() {
        Schema.PicklistEntry[] controlEntries = Account.Rating.getDescribe().getPicklistValues();
        Map<String, List<CommList_PicklistOption>> dependenceMap = CommList_PicklistService.getDependencyPicklistOptions(Account.Rating.getDescribe(), controlEntries);
        Boolean isHaveDependecyOptions = false;
        for (String controlValue : dependenceMap.keySet()) {
            List<CommList_PicklistOption> dependenceOptions = dependenceMap.get(controlValue);
            if(!dependenceOptions.isEmpty()) {
                isHaveDependecyOptions = true;
            }
        }
        System.assert(isHaveDependecyOptions);
    }
}
