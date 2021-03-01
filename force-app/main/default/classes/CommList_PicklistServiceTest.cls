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