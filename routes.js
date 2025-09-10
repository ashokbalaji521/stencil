import express from "express";
import {
  getStencilData,
  getRackStatus,
  updateStencilStatus,
  abortUpdate,
  updatedRackIDStencilTable,
} from "./StencilIN/StencilIN.js";
import {
  
  updatedRackIDStencilTableforlargestencil,removeWrongStencilforlargestencil,LightUpStencilforlargestencil,updateEmptyStencilDataforlargestencil,
} from "./StencilIN/LargeStencil.js";
import {
  getPartCodeData,
  getRackStatusindi,
  getSelectedPartCodeData,
  getallStencilIDData,
  getBarcodeIDData,
  getSelectedPartCodeDataBlock,
  LightUpStencil,
  removeWrongStencil,
  updateEmptyStencilData,
  getProductNameData,
  updateOperatorId,
  getRackNo
} from "./StencilOUT/StencilOUT.js";
// import { Login, Login1, Authenticate, Register } from "./Auth/Auth.js";

// import { getOpenRecords, productfamily } from "../Pages/department.js";
import requestIp from "request-ip";
import { InsertData } from "./Auth.js";
import { Login } from "./Auth.js";
import { GetData } from "./Auth.js";

import { getStencils, GetExportdatas ,getrackdataformaintainance} from "./View/ViewLoadedStencil.js";
import {
  updateStatus,
 // getStatus,
 
 getStatus1,

 getStatus4,

 getStatus2,

 getStatus3,
  updateRackData,
  updateRackData1,

  updateRackData2,

  updateRackData3,
  getAllStatuses,
  updateAllRackData,
} from "./TestingPage/Testing.js";
import { insertStencilData, getUserRoleModuleData } from "./Registration/stencilRegistration.js";
import {
  getNoncompliant,
  getNoncompliantdatetimefilter,
  switchLightOff,
} from "./Noncompliant/Noncompliant.js";
import {
  blockunblock,
  getoperatorhistory,
  getOperatorHistoryDatetimeFilter,
  getoperatorid,
  scrap,
  getAllBlockUnblockRecords,
  getAllHistoryDatetimeFilter,
} from "./operatorid.js";
import { getStencilDataByBarcodeID,getStencilDataByBarcodeIDformaintain, getStencilDataByBarcodeIDforslot, updateStencilDataByBarcodeID, updateStencilTension,getPartCodeDatabyall,getProductNameDatabyall,getallStencilIDDatabyall ,getSelectedPartCodeDataforedit,storeEditableStencilRecord,getEditableStencilRecords } from "./Edit/getStencildata.js";


import { getAllUsers, addUser, updateUser ,deleteUser} from "./Adminaccess/Adminaccess.js";
// import { getStatus } from "./testdb.js";
// import { getFilteredStatus } from "./testdb.js";
// import { newupdateStatus } from "./testdb.js";

const router = express.Router();
router.use(requestIp.mw());

//Reports
router.post("/login", Login);
// router.post("/getFilteredStatus", getFilteredStatus);
// router.post("/newupdateStatus", newupdateStatus);
// router.post("/getStatus", getStatus);
router.post("/getdata", GetData);
router.post("/Homepage", InsertData);
router.post("/StencilIn", InsertData);
router.post("/getStencildata", getStencilData);
router.post("/getRackStatus", getRackStatus);
router.post("/updateStencilStatus", updateStencilStatus);
router.post("/getBarcodeIDData", getBarcodeIDData);
router.post("/getallStencilIDData", getallStencilIDData);
router.post("/abortUpdate", abortUpdate);
router.post("/updateRackIDStencilTable", updatedRackIDStencilTable);
router.post("/getPartCodes", getPartCodeData);
router.post("/getSelectedPartCodeData", getSelectedPartCodeData);
router.post("/lightupStencil", LightUpStencil);
router.post("/updateEmptyStencilData", updateEmptyStencilData);
router.post("/getloadeddata", getStencils);
router.post("/getrackdataformaintainance", getrackdataformaintainance);

router.post("/getRackStatusindi", getRackStatusindi);
router.post("/updateStatus", updateStatus);
//router.post("/getStatus"zz, getStatus);
router.post("/getRackNo", getRackNo);
router.post("/getStatus1", getStatus1);

router.post("/getStatus4", getStatus4);

router.post("/getStatus2", getStatus2);

router.post("/getStatus3", getStatus3);  
router.post("/getAllStatuses", getAllStatuses);
router.post("/updateAllRackData", updateAllRackData); 
router.post("/updateRackData1", updateRackData1);

router.post("/updateRackData2", updateRackData2);

router.post("/updateRackData3", updateRackData3);
router.post("/updateRackData", updateRackData);
router.post("/getPartCodeDatabyall", getPartCodeDatabyall);
router.post("/getallStencilIDDatabyall", getallStencilIDDatabyall);
router.post("/getProductNameDatabyall", getProductNameDatabyall);
router.post("/getSelectedPartCodeDataforedit", getSelectedPartCodeDataforedit);
router.post("/insertStencilData", insertStencilData);
router.post("/getNoncompliant", getNoncompliant);
router.post("/switchlightoff", switchLightOff);
router.post("/removewrongpickup", removeWrongStencil);
router.post("/operatorid", getoperatorid);
router.post("/getoperatorhistory", getoperatorhistory);
router.post("/getSelectedPartCodeDatablock", getSelectedPartCodeDataBlock);
router.post("/blockunlockstencil", blockunblock);
router.post("/scrapstencil", scrap);
router.post("/getAllBlockUnblockRecords", getAllBlockUnblockRecords);
router.post("/getStencilDataByBarcodeID", getStencilDataByBarcodeID);
router.post("/getStencilDataByBarcodeIDformaintain", getStencilDataByBarcodeIDformaintain)
router.post("/getOperatorHistoryDatetimeFilter", getOperatorHistoryDatetimeFilter)
router.post("/getAllHistoryDatetimeFilter", getAllHistoryDatetimeFilter);
router.post("/getNoncompliantdatetimefilter", getNoncompliantdatetimefilter );
router.post("/updateStencilDataByBarcodeID", updateStencilDataByBarcodeID);
router.post("/updateStencilTension", updateStencilTension);
router.post("/getProductNameData", getProductNameData);
//router.post('/updateOperatorId', updateOperatorId);
router.post('/getStencilDataByBarcodeIDforslot', getStencilDataByBarcodeIDforslot);
router.post('/GetExportdatas', GetExportdatas);
router.post('/getUserRoleModuleData', getUserRoleModuleData);
router.post("/getusers", getAllUsers);
router.post("/users", addUser);
router.post("/users/:id", updateUser);
router.delete('/users/:id', deleteUser); 
router.post('/getEditableStencilRecords', getEditableStencilRecords ); 

router.post('/storeEditableStencilRecord', storeEditableStencilRecord );

 
export default router;
